import { Router } from 'express';
import { asyncHandler } from '../../middleware/asyncHandler';
import { validate } from '../../middleware/validate';
import { ok, fail, Errors } from '../../lib/response';
import {
  listCategories, getCategoryById, createCategory,
  updateCategory, toggleCategoryActive, deleteCategory,
  listBrands, getBrandById, createBrand,
  updateBrand, toggleBrandActive, deleteBrand,
} from '../../services/catalog.service';
import {
  CategoryCreateSchema, CategoryUpdateSchema,
  BrandCreateSchema, BrandUpdateSchema,
} from '../../validation/schemas';

// ─────────────────────────────────────────────────────────────────────────────
// CATEGORIES  /api/admin/categories
// ─────────────────────────────────────────────────────────────────────────────

export const categoriesRouter = Router();

// GET /api/admin/categories
categoriesRouter.get('/', asyncHandler(async (_req, res) => {
  const categories = await listCategories();
  ok(res, { categories });
}));

// GET /api/admin/categories/:id
categoriesRouter.get('/:id', asyncHandler(async (req, res) => {
  try {
    const category = await getCategoryById(req.params.id);
    ok(res, { category });
  } catch {
    fail(res, Errors.notFound('category'));
  }
}));

// POST /api/admin/categories
categoriesRouter.post('/', validate(CategoryCreateSchema), asyncHandler(async (req, res) => {
  const category = await createCategory(req.body);
  ok(res, { category }, 201);
}));

// PUT /api/admin/categories/:id
categoriesRouter.put('/:id', validate(CategoryUpdateSchema), asyncHandler(async (req, res) => {
  try {
    const category = await updateCategory(req.params.id, req.body);
    ok(res, { category });
  } catch {
    fail(res, Errors.notFound('category'));
  }
}));

// POST /api/admin/categories/:id/toggle
categoriesRouter.post('/:id/toggle', asyncHandler(async (req, res) => {
  try {
    const category = await toggleCategoryActive(req.params.id);
    ok(res, { category });
  } catch {
    fail(res, Errors.notFound('category'));
  }
}));

// DELETE /api/admin/categories/:id
categoriesRouter.delete('/:id', asyncHandler(async (req, res) => {
  try {
    await deleteCategory(req.params.id);
    ok(res, { message: 'Category deleted' });
  } catch (e: any) {
    fail(res, {
      status: 409, message: e.message,
      code: ''
    });
  }
}));

// ─────────────────────────────────────────────────────────────────────────────
// BRANDS  /api/admin/brands
// ─────────────────────────────────────────────────────────────────────────────

export const brandsRouter = Router();

// GET /api/admin/brands
brandsRouter.get('/', asyncHandler(async (_req, res) => {
  const brands = await listBrands();
  ok(res, { brands });
}));

// GET /api/admin/brands/:id
brandsRouter.get('/:id', asyncHandler(async (req, res) => {
  try {
    const brand = await getBrandById(req.params.id);
    ok(res, { brand });
  } catch {
    fail(res, Errors.notFound('brand'));
  }
}));

// POST /api/admin/brands
brandsRouter.post('/', validate(BrandCreateSchema), asyncHandler(async (req, res) => {
  const brand = await createBrand(req.body);
  ok(res, { brand }, 201);
}));

// PUT /api/admin/brands/:id
brandsRouter.put('/:id', validate(BrandUpdateSchema), asyncHandler(async (req, res) => {
  try {
    const brand = await updateBrand(req.params.id, req.body);
    ok(res, { brand });
  } catch {
    fail(res, Errors.notFound('brand'));
  }
}));

// POST /api/admin/brands/:id/toggle
brandsRouter.post('/:id/toggle', asyncHandler(async (req, res) => {
  try {
    const brand = await toggleBrandActive(req.params.id);
    ok(res, { brand });
  } catch {
    fail(res, Errors.notFound('brand'));
  }
}));

// DELETE /api/admin/brands/:id
brandsRouter.delete('/:id', asyncHandler(async (req, res) => {
  try {
    await deleteBrand(req.params.id);
    ok(res, { message: 'Brand deleted' });
  } catch (e: any) {
    fail(res, {
      status: 409, message: e.message,
      code: ''
    });
  }
}));