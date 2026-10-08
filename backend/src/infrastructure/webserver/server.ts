import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

// Carga dinámica de variables de entorno según NODE_ENV con fallback a .env
const envFileName = process.env.NODE_ENV === 'production'
  ? '.env.production'
  : '.env.development';

const specificEnvPath = path.resolve(process.cwd(), envFileName);
const fallbackEnvPath = path.resolve(process.cwd(), '.env');

if (fs.existsSync(specificEnvPath)) {
  dotenv.config({ path: specificEnvPath, override: true });
} else if (fs.existsSync(fallbackEnvPath)) {
  dotenv.config({ path: fallbackEnvPath });
} else {
  dotenv.config();
}

import express, { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/auth.routes';
import thermodynamicRoutes from './routes/thermodynamic.routes';
import reconciliationRoutes from './routes/reconciliation.routes';
import { gasProfileRoutes } from './routes/gas-profile.routes';

const app = express();

// 1. Hardening de Cabeceras HTTP (Helmet)
app.use(helmet());

// 2. Parseo de JSON seguro (Rechaza payloads inmensos)
app.use(express.json({ limit: '10kb' }));

// 3. Control de Acceso (CORS) - Admite múltiples orígenes o comodines Vercel
const rawOrigins = process.env.CORS_ORIGINS || 'http://localhost:5173';
const allowedOrigins = rawOrigins.split(',').map(o => o.trim());

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Permitir peticiones sin origin (como apps móviles, curl, Postman o health checks)
    if (!origin) return callback(null, true);
    if (rawOrigins === '*' || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
      return callback(null, true);
    }
    return callback(new Error(`CORS bloqueado para origen: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// 4. Rate Limiting (Seguridad en Login y Alto Rendimiento para Cálculos Internos)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 50, // 50 intentos en login
  message: { success: false, error: 'Demasiados intentos de acceso, intente de nuevo en 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/v1/auth/login', authLimiter);

// Límite amplio para operaciones internas (cálculos masivos de rack y reconciliación)
const internalApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10000, // 10,000 peticiones cada 15 min para uso interno continuo
  message: { success: false, error: 'Demasiadas peticiones desde esta IP, intente de nuevo más tarde.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', internalApiLimiter);

// Rutas (Interfaces / Adapters)
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/thermodynamics', thermodynamicRoutes);
app.use('/api/v1/reconciliation', reconciliationRoutes);
app.use('/api/v1/gas-profiles', gasProfileRoutes);

// Ruta base para Health Check
app.get('/api/v1/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', message: 'GNV Manager API is running securely.' });
});

// Middleware Global de Manejo de Errores
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal Server Error',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    },
  });
});

if (process.env.VERCEL !== "1") {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`[Seguridad Activada] Servidor escuchando en el puerto ${PORT}`);
  });
}

export default app;

