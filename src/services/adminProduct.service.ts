import { supabase } from '../lib/supabase';
import { z } from 'zod';
import { ProductCreateSchema, ProductUpdateSchema } from '../validation/schemas';

type CreateInput = z.infer<typeof ProductCreateSchema>;
type UpdateInput = z.infer<typeof ProductUpdateSchema>;

// ── Helpers ───────────────────────────────────────────────────────────────────

async function syncRelations(
  productId: string,
  input: {
    tag_ids?:             string[] | null;
    certification_ids?:   string[] | null;
    badge_ids?:           string[] | null;
    related_product_ids?: { id: string; relation_type: string }[] | null;
  },
) {
  if (input.tag_ids != null) {
    await supabase.from('product_tags').delete().eq('product_id', productId);
    if (input.tag_ids.length) {
      await supabase.from('product_tags').insert(
        input.tag_ids.map(tag_id => ({ product_id: productId, tag_id })),
      );
    }
  }

  if (input.certification_ids != null) {
    await supabase.from('product_certifications').delete().eq('product_id', productId);
    if (input.certification_ids.length) {
      await supabase.from('product_certifications').insert(
        input.certification_ids.map(certification_id => ({ product_id: productId, certification_id })),
      );
    }
  }

  if (input.badge_ids != null) {
    await supabase.from('product_badges').delete().eq('product_id', productId);
    if (input.badge_ids.length) {
      await supabase.from('product_badges').insert(
        input.badge_ids.map(badge_id => ({ product_id: productId, badge_id })),
      );
    }
  }

  if (input.related_product_ids != null) {
    await supabase.from('product_related').delete().eq('product_id', productId);
    if (input.related_product_ids.length) {
      await supabase.from('product_related').insert(
        input.related_product_ids.map(({ id, relation_type }) => ({
          product_id:         productId,
          related_product_id: id,
          relation_type,
        })),
      );
    }
  }
}

async function auditLog(action: string, entityId: string, changes?: object) {
  await supabase.from('audit_logs').insert({
    action,
    entity_type: 'product',
    entity_id:   entityId,
    changes:     changes ?? null,
  });
}

// ── Service functions ─────────────────────────────────────────────────────────

export async function createProduct(input: CreateInput) {
  const { tag_ids, certification_ids, badge_ids, related_product_ids, ...productData } = input;

  const { data, error } = await supabase
    .from('products')
    .insert(productData)
    .select()
    .single();

  if (error) throw new Error(error.message);

  await syncRelations(data.id, { tag_ids, certification_ids, badge_ids, related_product_ids });
  await auditLog('create', data.id, { name: data.name });

  return data;
}

export async function updateProduct(id: string, input: UpdateInput) {
  const { tag_ids, certification_ids, badge_ids, related_product_ids, ...productData } = input;

  const { data, error } = await supabase
    .from('products')
    .update(productData)
    .eq('id', id)
    .is('deleted_at', null)
    .select()
    .single();

  if (error) throw new Error(error.message);

  await syncRelations(id, { tag_ids, certification_ids, badge_ids, related_product_ids });
  await auditLog('update', id, productData);

  return data;
}

export async function publishProduct(id: string) {
  const { data, error } = await supabase
    .from('products')
    .update({ status: 'published', published_at: new Date().toISOString() })
    .eq('id', id)
    .is('deleted_at', null)
    .select()
    .single();

  if (error) throw new Error(error.message);
  await auditLog('publish', id);
  return data;
}

export async function archiveProduct(id: string) {
  const { data, error } = await supabase
    .from('products')
    .update({ status: 'archived' })
    .eq('id', id)
    .is('deleted_at', null)
    .select()
    .single();

  if (error) throw new Error(error.message);
  await auditLog('archive', id);
  return data;
}

export async function softDeleteProduct(id: string) {
  const { data, error } = await supabase
    .from('products')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  await auditLog('delete', id);
  return data;
}

export async function getProductById(id: string) {
  const { data, error } = await supabase
    .from('products')
    .select(`*,
      brands ( id, slug, name, name_ar, logo_url ),
      categories ( id, slug, name, name_ar ),
      product_images ( id, public_url, storage_path, alt_text, sort_order, is_primary ),
      product_tags ( tag_id, tags ( id, slug, name, name_ar, tag_type ) ),
      product_certifications ( certification_id, certifications ( id, slug, name, name_ar, short_name, short_name_ar ) ),
      product_badges ( badge_id, badges ( id, slug, name, name_ar, color_class ) ),
      product_related!product_related_product_id_fkey (
        relation_type,
        related:products!product_related_related_product_id_fkey ( id, slug, name, name_ar, main_image_url )
      )`)
    .eq('id', id)
    .is('deleted_at', null)
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function listAdminProducts(page = 1, limit = 20, status?: string, search?: string) {
  let query = supabase
    .from('products')
    .select('id, slug, name, name_ar, status, is_featured, rating, published_at, brands(name, name_ar), categories(name, name_ar)', { count: 'exact' })
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .range((page - 1) * limit, page * limit - 1);

  if (status) query = query.eq('status', status);
  if (search) query = query.textSearch('search_vector', search, { type: 'websearch', config: 'english' });

  const { data, error, count } = await query;
  if (error) throw new Error(error.message);
  return { products: data, total: count ?? 0 };
}