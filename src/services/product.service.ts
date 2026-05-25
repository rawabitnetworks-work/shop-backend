import { supabase } from '../lib/supabase';
import { z } from 'zod';
import { ProductSearchSchema } from '../validation/schemas';

type SearchInput = z.infer<typeof ProductSearchSchema>;

export async function searchProducts(input: SearchInput) {
  const { page, limit, search, category, solution_type, filters, sort } = input;
  const offset = (page - 1) * limit;

  // ── Base query ──────────────────────────────────────────────────────────────
  let query = supabase
    .from('products')
    .select(
      `
      id, slug, name, name_ar, tagline, tagline_ar, short_description, short_description_ar,
      main_image_url, rating, review_count,
      price_range, solution_type, attributes,
      connectivity, is_featured, published_at,
      brands!inner ( slug, name, name_ar, logo_url ),
      categories!inner ( slug, name, name_ar ),
      product_badges ( badges ( slug, name, name_ar, color_class ) ),
      product_tags ( tags ( slug, name, name_ar ) ),
      product_certifications ( certifications ( slug, name, name_ar, short_name, short_name_ar ) )
    `,
      { count: 'exact' },
    )
    .eq('status', 'published')
    .is('deleted_at', null);

  // ── Full-text search ────────────────────────────────────────────────────────
  if (search && search.trim()) {
    const isArabic = /[\u0600-\u06FF]/.test(search);
    query = query.textSearch(
      isArabic ? 'search_vector_ar' : 'search_vector',
      search,
      { type: 'websearch', config: isArabic ? 'simple' : 'english' },
    );
  }

  // ── Category filter ─────────────────────────────────────────────────────────
  if (category) {
    query = query.eq('categories.slug', category);
  }

  // ── Solution type filter ────────────────────────────────────────────────────
  if (solution_type) {
    query = query.eq('solution_type', solution_type);
  }

  // ── Brand filter ────────────────────────────────────────────────────────────
  if (filters?.brand?.length) {
    query = query.in('brands.slug', filters.brand);
  }

  // ── Connectivity filter (array overlap) ────────────────────────────────────
  if (filters?.connectivity?.length) {
    query = query.overlaps('connectivity', filters.connectivity);
  }

  // ── Price range filter ──────────────────────────────────────────────────────
  if (filters?.price_range?.length) {
    query = query.in('price_range', filters.price_range);
  }

  if (filters?.tags?.length) { query = query.in('product_tags.tags.slug', filters.tags); }

  // ── Attributes filter (JSONB contains) ─────────────────────────────────────
  // e.g. { "resolution": "4K" } or { "is_anc": true, "ports": 48 }
  if (filters?.attributes && Object.keys(filters.attributes).length) {
    query = query.contains('attributes', filters.attributes);
  }

  // ── Sort ────────────────────────────────────────────────────────────────────
  const sortField = sort?.field ?? 'published_at';
  const sortDir   = sort?.direction ?? 'desc';

  if (sortField === 'published_at') {
    query = query.order('is_featured', { ascending: false }).order('published_at', { ascending: sortDir === 'asc' });
  } else {
    query = query.order(sortField, { ascending: sortDir === 'asc' });
  }

  // ── Pagination ──────────────────────────────────────────────────────────────
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) throw new Error(error.message);

  const total = count ?? 0;

  // ── Shape the response ──────────────────────────────────────────────────────
  const products = (data ?? []).map((p: any) => ({
    id:                p.id,
    slug:              p.slug,
    name:                 p.name,
    name_ar:              p.name_ar,
    tagline:              p.tagline,
    tagline_ar:           p.tagline_ar,
    short_description:    p.short_description,
    short_description_ar: p.short_description_ar,
    main_image_url:    p.main_image_url,
    rating:            p.rating,
    review_count:      p.review_count,
    price_range:       p.price_range,
    solution_type:     p.solution_type,
    attributes:        p.attributes ?? {},
    connectivity:      p.connectivity,
    is_featured:       p.is_featured,
    brand:          p.brands,       // already contains name_ar from select
    category:       p.categories,   // already contains name_ar from select
    badge:          (p.product_badges ?? []).map((pb: any) => pb.badges).filter(Boolean),
    tags:           (p.product_tags ?? []).map((pt: any) => pt.tags?.slug).filter(Boolean),
    certifications: (p.product_certifications ?? []).map((pc: any) => ({
      slug:          pc.certifications?.slug,
      name:          pc.certifications?.name,
      name_ar:       pc.certifications?.name_ar,
      short_name:    pc.certifications?.short_name,
      short_name_ar: pc.certifications?.short_name_ar,
    })).filter((c: any) => c.slug),
  }));

  return {
    products,
    pagination: {
      page,
      limit,
      total_products: total,
      total_pages:    Math.ceil(total / limit),
      has_next:       page * limit < total,
      has_prev:       page > 1,
    },
  };
}