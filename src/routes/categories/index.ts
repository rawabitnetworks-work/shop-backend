import { Router } from 'express';
import { asyncHandler } from '../../middleware/asyncHandler';
import { ok, fail, Errors } from '../../lib/response';
import { listCategories, getCategoryBySlug } from '../../services/catalog.service';

const router = Router();

// GET /api/categories
router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const categories = await listCategories();
    ok(res, { categories });
  }),
);

// GET /api/categories/:slug
router.get(
  '/:slug',
  asyncHandler(async (req, res) => {
    try {
      const category = await getCategoryBySlug(req.params.slug);
      ok(res, { category });
    } catch {
      fail(res, Errors.notFound('category'));
    }
  }),
);

export default router;
