import { z } from 'zod';

// ── Public ────────────────────────────────────────────────────────────────────

export const ProductSearchSchema = z.object({
  page:          z.number().int().min(1).max(1000).default(1),
  limit:         z.number().int().min(1).max(1000).default(12),
  search:        z.string().max(200).nullish(),
  category:      z.string().max(100).nullish(),
  solution_type: z.string().max(100).nullish(), // filter by solution
  filters: z.object({
    brand:        z.array(z.string()).nullish(),
    connectivity: z.array(z.string()).nullish(),
    price_range:  z.array(z.string()).nullish(),
    attributes:   z.record(z.any()).nullish(), // e.g. { "ports": 48, "is_anc": true }
    tags:         z.array(z.string()).nullish(),
  }).nullish(),
  sort: z.object({
    field:     z.enum(['rating', 'review_count', 'name', 'published_at']).default('published_at'),
    direction: z.enum(['asc', 'desc']).default('desc'),
  }).nullish(),
});

export const ProductDetailsSchema = z.object({
  product_uuid: z.string().uuid().nullish(),
  slug:         z.string().max(200).nullish(),
}).refine(d => d.product_uuid || d.slug, {
  message: 'Either product_uuid or slug is required',
});

// ── Admin — products ──────────────────────────────────────────────────────────

export const ProductCreateSchema = z.object({
  slug:               z.string().max(200),
  sku:                z.string().max(100).nullish(),
  brand_id:           z.string().uuid(),
  category_id:        z.string().uuid(),
  name:               z.string().min(1).max(300),
  tagline:            z.string().max(500).nullish(),
  description:        z.string().nullish(),
  short_description:  z.string().max(500).nullish(),
  main_image_url:     z.string().url().nullish(),
  main_image_path:    z.string().nullish(),
  datasheet_url:      z.string().url().nullish(),
  datasheet_path:     z.string().nullish(),
  specs:              z.array(z.any()).default([]),
  features:           z.array(z.string()).default([]),
  connectivity:       z.array(z.string()).default([]),
  price_range:        z.enum(['Budget', 'Mid-Range', 'Premium', 'Enterprise']).nullish(),
  solution_type:      z.string().max(100).nullish(), // 'av', 'computing', 'cyber', etc.
  attributes:         z.record(z.any()).default({}),  // flexible per product type
  is_featured:        z.boolean().default(false),
  seo_title:          z.string().max(200).nullish(),
  seo_description:    z.string().max(500).nullish(),
  seo_keywords:       z.array(z.string()).nullish(),
  og_image_url:       z.string().url().nullish(),
  canonical_url:      z.string().url().nullish(),
  name_ar:              z.string().max(300).nullish(),
tagline_ar:           z.string().max(500).nullish(),
description_ar:       z.string().nullish(),
short_description_ar: z.string().max(500).nullish(),
features_ar:          z.array(z.any()).nullish(),
specs_ar:             z.array(z.any()).nullish(),
seo_title_ar:         z.string().max(200).nullish(),
seo_description_ar:   z.string().max(500).nullish(),
seo_keywords_ar:      z.array(z.string()).nullish(),
  // Relations
  tag_ids:            z.array(z.string().uuid()).nullish(),
  certification_ids:  z.array(z.string().uuid()).nullish(),
  badge_ids:          z.array(z.string().uuid()).nullish(),
  related_product_ids: z.array(z.object({
    id:            z.string().uuid(),
    relation_type: z.enum(['similar', 'accessory', 'upgrade', 'bundle']).default('similar'),
  })).nullish(),
});

export const ProductUpdateSchema = ProductCreateSchema.partial();

export const PublishProductSchema = z.object({
  product_id: z.string().uuid(),
});

// ── Admin — categories ────────────────────────────────────────────────────────

export const CategoryCreateSchema = z.object({
  slug:            z.string().max(200),
  name:            z.string().min(1).max(200),
  description:     z.string().nullish(),
  parent_id:       z.string().uuid().nullish(),
  banner_url:      z.string().url().nullish(),
  hero_title:      z.string().nullish(),
  hero_subtitle:   z.string().nullish(),
  icon_url:        z.string().url().nullish(),
  is_active:       z.boolean().default(true),
  sort_order:      z.number().int().default(0),
  seo_title:       z.string().max(200).nullish(),
  seo_description: z.string().max(500).nullish(),
  seo_keywords:    z.array(z.string()).nullish(),
  og_image_url:    z.string().url().nullish(),
  filter_config:   z.record(z.any()).default({}),
  name_ar:            z.string().max(200).nullish(),
description_ar:     z.string().nullish(),
hero_title_ar:      z.string().nullish(),
hero_subtitle_ar:   z.string().nullish(),
seo_title_ar:       z.string().max(200).nullish(),
seo_description_ar: z.string().max(500).nullish(),
});

export const CategoryUpdateSchema = CategoryCreateSchema.partial();

// ── Admin — brands ────────────────────────────────────────────────────────────

export const BrandCreateSchema = z.object({
  slug:        z.string().max(200),
  name:        z.string().min(1).max(200),
  logo_url:    z.string().url().nullish(),
  website_url: z.string().url().nullish(),
  description: z.string().nullish(),
  is_active:   z.boolean().default(true),
  sort_order:  z.number().int().default(0),
  name_ar:            z.string().max(200).nullish(),
description_ar:     z.string().nullish(),
seo_title_ar:       z.string().max(200).nullish(),
seo_description_ar: z.string().max(500).nullish(),
  
});

export const BrandUpdateSchema = BrandCreateSchema.partial();

// ── Tags ──────────────────────────────────────────────────────────────────────

export const TagCreateSchema = z.object({
  slug:     z.string().max(200),
  name:     z.string().min(1).max(200),
  tag_type: z.string().max(100).default('product'),
  color:    z.string().max(50).nullish(),
  name_ar: z.string().max(200).nullish(),
});

export const TagUpdateSchema = TagCreateSchema.partial();

// ── Certifications ────────────────────────────────────────────────────────────

export const CertificationCreateSchema = z.object({
  slug:        z.string().max(200),
  name:        z.string().min(1).max(200),
  short_name:  z.string().min(1).max(50),
  logo_url:    z.string().url().nullish(),
  badge_color: z.string().max(50).nullish(),
  name_ar:       z.string().max(200).nullish(),
short_name_ar: z.string().max(50).nullish(),
});

export const CertificationUpdateSchema = CertificationCreateSchema.partial();

// ── Badges ────────────────────────────────────────────────────────────────────

export const BadgeCreateSchema = z.object({
  slug:        z.string().max(200),
  name:        z.string().min(1).max(200),
  color_class: z.string().max(100).nullish(),
  is_active:   z.boolean().default(true),
  name_ar: z.string().max(200).nullish(),
});

export const BadgeUpdateSchema = BadgeCreateSchema.partial();

// ── Admin users ───────────────────────────────────────────────────────────────

export const AdminUserCreateSchema = z.object({
  user_id:   z.string().uuid(),
  role:      z.enum(['admin', 'editor']).default('editor'),
  name:      z.string().max(200).nullish(),
  email:     z.string().email(),
  is_active: z.boolean().default(true),
});

export const AdminUserUpdateSchema = AdminUserCreateSchema.partial().omit({ user_id: true });