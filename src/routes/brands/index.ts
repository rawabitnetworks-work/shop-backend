import { Router } from 'express';
import { asyncHandler } from '../../middleware/asyncHandler';
import { ok } from '../../lib/response';
import { listBrands } from '../../services/catalog.service';

const router = Router();

// GET /api/brands
router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const brands = await listBrands();
    ok(res, { brands });
  }),
);

export default router;
