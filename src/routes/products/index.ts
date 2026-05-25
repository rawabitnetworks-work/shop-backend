
import { Router } from 'express';
import { z } from 'zod';

import { asyncHandler } from '../../middleware/asyncHandler';
import { validate } from '../../middleware/validate';

import { ok, fail, Errors } from '../../lib/response';
import { supabase } from '../../lib/supabase';

import {
  uploadProductImage,
  uploadDatasheet,
  deleteProductImage,
  reorderProductImages,
  setPrimaryImage,
  getDatasheetSignedUrl,
} from '../../services/storage.service';

import { searchProducts } from '../../services/product.service';

import {
  ProductSearchSchema,
  ProductDetailsSchema,
} from '../../validation/schemas';

// make sure this already exists in your project
import upload from '../../middleware/upload';

const router = Router();

// ── POST /api/products/search ─────────────────────────────────────────────────
router.post(
  '/search',
  validate(ProductSearchSchema),
  asyncHandler(async (req, res) => {
    const result = await searchProducts(req.body);
    ok(res, result);
  }),
);

// ── POST /api/products/details ────────────────────────────────────────────────
router.post(
  '/details',
  validate(ProductDetailsSchema),
  asyncHandler(async (req, res) => {
    const { slug, product_uuid } = req.body;

    let query = supabase
      .from('products')
      .select(
        `*, 
        brands ( slug, name, name_ar, logo_url ),
        categories ( slug, name, name_ar ),
        product_images ( public_url, alt_text, sort_order, is_primary ),
        product_tags ( tags ( slug, name, name_ar ) ),
        product_certifications ( certifications ( slug, name, name_ar, short_name, short_name_ar, logo_url ) ),
        product_badges ( badges ( slug, name, name_ar, color_class ) ),
        product_related!product_related_product_id_fkey (
          relation_type,
          related:products!product_related_related_product_id_fkey (
            id,
            slug,
            name,
            name_ar,
            main_image_url,
            rating,
            price_range,
            brands(name, name_ar)
          )
        )`
      )
      .eq('status', 'published')
      .is('deleted_at', null);

    if (slug) query = query.eq('slug', slug);
    if (product_uuid) query = query.eq('id', product_uuid);

    const { data, error } = await query.single();

    if (error || !data) {
      return fail(res, Errors.notFound('product'));
    }

    const product = {
      ...data,

      brand: data.brands,
      category: data.categories,

      images: data.product_images ?? [],

      tags: (data.product_tags ?? [])
        .map((pt: any) => pt.tags),

      certifications: (data.product_certifications ?? [])
        .map((pc: any) => pc.certifications),

      badges: (data.product_badges ?? [])
        .map((pb: any) => pb.badges),

      related_products: (data.product_related ?? []).map((pr: any) => ({
        ...pr.related,
        brand_name: pr.related?.brands?.name,
        relation_type: pr.relation_type,
      })),

      datasheet_available: !!data.datasheet_path,

      seo: {
        title:          data.seo_title,
        description:    data.seo_description,
        keywords:       data.seo_keywords,
        og_image_url:   data.og_image_url,
        title_ar:       data.seo_title_ar,
        description_ar: data.seo_description_ar,
        keywords_ar:    data.seo_keywords_ar,
      },
    };

    ok(res, { product });
  }),
);

// ── GET /api/products/:uuid/datasheet ─────────────────────────────────────────
router.get(
  '/:uuid/datasheet',
  asyncHandler(async (req, res) => {
    const signedUrl = await getDatasheetSignedUrl(req.params.uuid);

    if (!signedUrl) {
      return fail(res, Errors.notFound('datasheet'));
    }

    ok(res, {
      url: signedUrl,
      expires_in: 3600,
    });
  }),
);

// ── GET /api/products/:uuid/related ──────────────────────────────────────────
router.get(
  '/:uuid/related',
  asyncHandler(async (req, res) => {
    const { data, error } = await supabase
      .from('product_related')
      .select(`
        relation_type,
        related:products!product_related_related_product_id_fkey(
          id,
          slug,
          name,
          name_ar,
          main_image_url,
          rating,
          price_range,
          brands(name, name_ar)
        )
      `)
      .eq('product_id', req.params.uuid)
      .limit(10);

    if (error) {
      throw new Error(error.message);
    }

    ok(res, {
      related_products: data ?? [],
    });
  }),
);

// ── POST /api/admin/products/upload/images (bulk) ────────────────────────────
router.post(
  '/upload/images',
  upload.array('files', 20),
  asyncHandler(async (req, res) => {
    const files = req.files as Express.Multer.File[];
    const productId = req.body.product_id as string;

    if (!files?.length || !productId) {
      return fail(
        res,
        Errors.validation('files and product_id are required')
      );
    }

    const results = await Promise.all(
      files.map((f) =>
        uploadProductImage({
          productId,
          buffer: f.buffer,
          mimetype: f.mimetype,
          originalName: f.originalname,
          imageType: 'gallery',
        })
      )
    );

    ok(res, { images: results }, 201);
  }),
);

// ── DELETE /api/admin/products/images/:imageId ───────────────────────────────
router.delete(
  '/images/:imageId',
  asyncHandler(async (req, res) => {
    try {
      await deleteProductImage(req.params.imageId);

      ok(res, {
        message: 'Image deleted',
      });
    } catch (e: any) {
      fail(res, Errors.notFound('image'));
    }
  }),
);

// ── PUT /api/admin/products/:id/images/reorder ───────────────────────────────
router.put(
  '/:id/images/reorder',
  asyncHandler(async (req, res) => {
    const updates = z.array(
      z.object({
        id: z.string().uuid(),
        sort_order: z.number().int(),
      })
    ).parse(req.body);

    await reorderProductImages(req.params.id, updates);

    ok(res, {
      message: 'Images reordered',
    });
  }),
);

// ── POST /api/admin/products/images/:imageId/set-primary ────────────────────
router.post(
  '/images/:imageId/set-primary',
  asyncHandler(async (req, res) => {
    try {
      const image = await setPrimaryImage(req.params.imageId);

      ok(res, { image });
    } catch {
      fail(res, Errors.notFound('image'));
    }
  }),
);

export default router;