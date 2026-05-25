import { Router } from 'express';
import multer from 'multer';
import { asyncHandler } from '../../middleware/asyncHandler';
import { validate } from '../../middleware/validate';
import { ok, fail, Errors } from '../../lib/response';
import {
  createProduct,
  updateProduct,
  publishProduct,
  archiveProduct,
  softDeleteProduct,
  getProductById,
  listAdminProducts,
} from '../../services/adminProduct.service';
import { uploadProductImage, uploadDatasheet } from '../../services/storage.service';
import { ProductCreateSchema, ProductUpdateSchema } from '../../validation/schemas';
import { z } from 'zod';

const router = Router();

// Multer — memory storage (buffer sent to Supabase)
const upload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 20 * 1024 * 1024 }, // 20 MB
  fileFilter(_req, file, cb) {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    cb(null, allowed.includes(file.mimetype));
  },
});

// ── GET  /api/admin/products ──────────────────────────────────────────────────
router.get('/', asyncHandler(async (req, res) => {
  const page   = Number(req.query.page  ?? 1);
  const limit  = Number(req.query.limit ?? 20);
  const status = req.query.status as string | undefined;
  const search = req.query.search as string | undefined;
  const result = await listAdminProducts(page, limit, status, search);
  ok(res, result);
}));

// ── GET  /api/admin/products/:id ──────────────────────────────────────────────
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    try {
      const product = await getProductById(req.params.id);
      ok(res, { product });
    } catch {
      fail(res, Errors.notFound('product'));
    }
  }),
);

// ── POST /api/admin/products ──────────────────────────────────────────────────
router.post(
  '/',
  validate(ProductCreateSchema),
  asyncHandler(async (req, res) => {
    const product = await createProduct(req.body);
    ok(res, { product }, 201);
  }),
);

// ── PUT  /api/admin/products/:id ──────────────────────────────────────────────
router.put(
  '/:id',
  validate(ProductUpdateSchema),
  asyncHandler(async (req, res) => {
    try {
      const product = await updateProduct(req.params.id, req.body);
      ok(res, { product });
    } catch {
      fail(res, Errors.notFound('product'));
    }
  }),
);

// ── POST /api/admin/products/:id/publish ─────────────────────────────────────
router.post(
  '/:id/publish',
  asyncHandler(async (req, res) => {
    try {
      const product = await publishProduct(req.params.id);
      ok(res, { product });
    } catch {
      fail(res, Errors.notFound('product'));
    }
  }),
);

// ── POST /api/admin/products/:id/archive ─────────────────────────────────────
router.post(
  '/:id/archive',
  asyncHandler(async (req, res) => {
    try {
      const product = await archiveProduct(req.params.id);
      ok(res, { product });
    } catch {
      fail(res, Errors.notFound('product'));
    }
  }),
);

// ── DELETE /api/admin/products/:id ───────────────────────────────────────────
router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    try {
      await softDeleteProduct(req.params.id);
      ok(res, { message: 'Product deleted' });
    } catch {
      fail(res, Errors.notFound('product'));
    }
  }),
);

// ── POST /api/admin/products/upload/image ─────────────────────────────────────
router.post(
  '/upload/image',
  upload.single('file'),
  asyncHandler(async (req, res) => {
    const file      = req.file;
    const productId = req.body.product_id as string;
    const imageType = (req.body.type ?? 'gallery') as 'main' | 'gallery';

    if (!file || !productId) {
      return fail(res, Errors.validation('file and product_id are required'));
    }

    try {
      const result = await uploadProductImage({
        productId,
        buffer:       file.buffer,
        mimetype:     file.mimetype,
        originalName: file.originalname,
        imageType,
      });
      ok(res, result, 201);
    } catch (e: any) {
      fail(res, Errors.uploadFailed(e.message));
    }
  }),
);

// ── POST /api/admin/products/upload/datasheet ─────────────────────────────────
router.post(
  '/upload/datasheet',
  upload.single('file'),
  asyncHandler(async (req, res) => {
    const file      = req.file;
    const productId = req.body.product_id as string;

    if (!file || !productId) {
      return fail(res, Errors.validation('file and product_id are required'));
    }
    if (file.mimetype !== 'application/pdf') {
      return fail(res, Errors.validation('Only PDF files are accepted for datasheets'));
    }

    try {
      const result = await uploadDatasheet({
        productId,
        buffer:       file.buffer,
        originalName: file.originalname,
      });
      ok(res, result, 201);
    } catch (e: any) {
      fail(res, Errors.uploadFailed(e.message));
    }
  }),
);

export default router;
