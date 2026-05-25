import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import { errorHandler } from './middleware/errorHandler';
import { requireAdminKey } from './middleware/auth';

// ── Public routers ────────────────────────────────────────────────────────────
import productsRouter   from './routes/products/index';
import categoriesRouter from './routes/categories/index';
import brandsRouter     from './routes/brands/index';

// ── Admin routers ─────────────────────────────────────────────────────────────
import adminProductsRouter from './routes/admin/products';
import { categoriesRouter as adminCategoriesRouter, brandsRouter as adminBrandsRouter } from './routes/admin/catalog';
import { tagsRouter, certificationsRouter, badgesRouter, adminUsersRouter, auditLogsRouter } from './routes/admin/lookup';

const app = express();

// ── Security & logging ────────────────────────────────────────────────────────
app.use(helmet());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));


// ── CORS ──────────────────────────────────────────────────────────────────────
app.use(cors({
  origin: true,
  credentials: true,
}));

// ── Body parsers ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Rate limiting ─────────────────────────────────────────────────────────────
const publicLimiter = rateLimit({ windowMs: 60_000, max: 120, standardHeaders: true, legacyHeaders: false });
const adminLimiter  = rateLimit({ windowMs: 60_000, max: 300, standardHeaders: true, legacyHeaders: false });

// ── Public routes ─────────────────────────────────────────────────────────────
app.use('/api/products',   publicLimiter, productsRouter);
app.use('/api/categories', publicLimiter, categoriesRouter);
app.use('/api/brands',     publicLimiter, brandsRouter);

app.post('/api/admin/login', adminLimiter, (req, res) => {
  const { username, password } = req.body;
  const expectedUser = process.env.ADMIN_USERNAME;
  const expectedPass = process.env.ADMIN_PASSWORD;

  if (username === expectedUser && password === expectedPass) {
    return res.json({ success: true, token: process.env.ADMIN_TOKEN });
  }
  return res.status(401).json({ success: false, error: { message: 'Invalid credentials' } });
});

// ── Admin routes (require API key) ────────────────────────────────────────────
app.use('/api/admin/products',        adminLimiter, requireAdminKey, adminProductsRouter);
app.use('/api/admin/categories',      adminLimiter, requireAdminKey, adminCategoriesRouter);
app.use('/api/admin/brands',          adminLimiter, requireAdminKey, adminBrandsRouter);
app.use('/api/admin/tags',            adminLimiter, requireAdminKey, tagsRouter);
app.use('/api/admin/certifications',  adminLimiter, requireAdminKey, certificationsRouter);
app.use('/api/admin/badges',          adminLimiter, requireAdminKey, badgesRouter);
app.use('/api/admin/users',           adminLimiter, requireAdminKey, adminUsersRouter);
app.use('/api/admin/audit-logs',      adminLimiter, requireAdminKey, auditLogsRouter);

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Route not found', status: 404 } }));

// ── Global error handler ──────────────────────────────────────────────────────
app.use(errorHandler);

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = Number(process.env.PORT ?? 3000);
app.listen(PORT, () => {
  console.log(`\n🚀 shop-backend running on http://localhost:${PORT}`);
  console.log(`   NODE_ENV  : ${process.env.NODE_ENV ?? 'development'}`);
  console.log(`   Supabase  : ${process.env.SUPABASE_URL}\n`);
});

export default app;