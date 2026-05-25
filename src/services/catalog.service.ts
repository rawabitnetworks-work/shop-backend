import { supabase } from '../lib/supabase';
import { z } from 'zod';
import {
  CategoryCreateSchema, CategoryUpdateSchema,
  BrandCreateSchema, BrandUpdateSchema,
} from '../validation/schemas';

// ─────────────────────────────────────────────────────────────────────────────
// CATEGORIES
// ─────────────────────────────────────────────────────────────────────────────

export async function listCategories() {
  const { data, error } = await supabase
    .from('categories')
    .select('id, slug, name, name_ar, description, description_ar, parent_id, banner_url, hero_title, hero_title_ar, hero_subtitle_ar, icon_url, is_active, sort_order, filter_config, created_at, updated_at')
    .order('sort_order', { ascending: true });

  if (error) throw new Error(error.message);
  return data;
}

export async function getCategoryById(id: string) {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function getCategoryBySlug(slug: string) {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function createCategory(input: z.infer<typeof CategoryCreateSchema>) {
  const { data, error } = await supabase
    .from('categories')
    .insert(input)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function updateCategory(id: string, input: z.infer<typeof CategoryUpdateSchema>) {
  const { data, error } = await supabase
    .from('categories')
    .update(input)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function toggleCategoryActive(id: string) {
  const { data: current, error: fetchErr } = await supabase
    .from('categories')
    .select('is_active')
    .eq('id', id)
    .single();

  if (fetchErr) throw new Error(fetchErr.message);

  const { data, error } = await supabase
    .from('categories')
    .update({ is_active: !current.is_active })
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function deleteCategory(id: string) {
  const { count } = await supabase
    .from('products')
    .select('id', { count: 'exact', head: true })
    .eq('category_id', id)
    .is('deleted_at', null);

  if (count && count > 0)
    throw new Error(`Cannot delete: ${count} product(s) still use this category`);

  const { error } = await supabase.from('categories').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

// ─────────────────────────────────────────────────────────────────────────────
// BRANDS
// ─────────────────────────────────────────────────────────────────────────────

export async function listBrands() {
  const { data, error } = await supabase
    .from('brands')
    .select('id, slug, name, name_ar, logo_url, website_url, description, description_ar, is_active, sort_order, created_at, updated_at')
    .order('sort_order', { ascending: true });

  if (error) throw new Error(error.message);
  return data;
}

export async function getBrandById(id: string) {
  const { data, error } = await supabase
    .from('brands')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function getBrandBySlug(slug: string) {
  const { data, error } = await supabase
    .from('brands')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function createBrand(input: z.infer<typeof BrandCreateSchema>) {
  const { data, error } = await supabase
    .from('brands')
    .insert(input)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function updateBrand(id: string, input: z.infer<typeof BrandUpdateSchema>) {
  const { data, error } = await supabase
    .from('brands')
    .update(input)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function toggleBrandActive(id: string) {
  const { data: current, error: fetchErr } = await supabase
    .from('brands')
    .select('is_active')
    .eq('id', id)
    .single();

  if (fetchErr) throw new Error(fetchErr.message);

  const { data, error } = await supabase
    .from('brands')
    .update({ is_active: !current.is_active })
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function deleteBrand(id: string) {
  const { count } = await supabase
    .from('products')
    .select('id', { count: 'exact', head: true })
    .eq('brand_id', id)
    .is('deleted_at', null);

  if (count && count > 0)
    throw new Error(`Cannot delete: ${count} product(s) still use this brand`);

  const { error } = await supabase.from('brands').delete().eq('id', id);
  if (error) throw new Error(error.message);
}