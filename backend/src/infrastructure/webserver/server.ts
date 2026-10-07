import express, { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import thermodynamicRoutes from './routes/thermodynamic.routes';
import reconciliationRoutes from './routes/reconciliation.routes';

dotenv.config();

const app = express();

// 1. Hardening de Cabeceras HTTP (Helmet)
app.use(helmet());

// 2. Parseo de JSON seguro (Rechaza payloads inmensos)
app.use(express.json({ limit: '10kb' }));

// 3. Control de Acceso (CORS) - Lista Blanca estricta
const corsOptions = {
  origin: process.env.CORS_ORIGINS || 'http://localhost:5173',
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

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`[Seguridad Activada] Servidor escuchando en el puerto ${PORT}`);
  console.log(`[CORS] Orígenes permitidos: ${corsOptions.origin}`);
});
