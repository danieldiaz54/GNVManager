import express, { Request, Response } from 'express';
import cors from 'cors';
import { thermoRoutes, aforoRoutes, dispatchRoutes, ledgerRoutes, errorHandler } from '../interfaces';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Health Check
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'online',
    service: 'GNVManager-Backend',
    timestamp: new Date().toISOString(),
  });
});

// Rutas de API versionada v1
app.use('/api/v1/thermo', thermoRoutes);
app.use('/api/v1/aforo', aforoRoutes);
app.use('/api/v1/dispatch', dispatchRoutes);
app.use('/api/v1/ledger', ledgerRoutes);

// Manejo centralizado de errores
app.use(errorHandler);

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`[GNVManager Backend] Servidor iniciado en puerto ${PORT}`);
  });
}

export default app;
