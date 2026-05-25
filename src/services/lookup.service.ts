import { supabase } from '../lib/supabase';
import { z } from 'zod';
import {
  TagCreateSchema, TagUpdateSchema,
  CertificationCreateSchema, CertificationUpdateSchema,
  BadgeCreateSchema, BadgeUpdateSchema,
  AdminUserCreateSchema, AdminUserUpdateSchema,
} from '../validation/schemas';

// ─────────────────────────────────────────────────────────────────────────────
// TAGS
// ─────────────────────────────────────────────────────────────────────────────

export async function listTags(tag_type?: string) {
  let query = supabase
    .from('tags')
    .select('id, slug, name, name_ar, tag_type, color, created_at')
    .order('name', { ascending: true });

  if (tag_type) query = query.eq('tag_type', tag_type);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data;
}

export async function getTagById(id: string) {
  const { data, error } = await supabase
    .from('tags')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function createTag(input: z.infer<typeof TagCreateSchema>) {
  const { data, error } = await supabase
    .from('tags')
    .insert(input)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function updateTag(id: string, input: z.infer<typeof TagUpdateSchema>) {
  const { data, error } = await supabase
    .from('tags')
    .update(input)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function deleteTag(id: string) {
  // remove from all products first (junction table cascades, but let's be explicit)
  const { count } = await supabase
    .from('product_tags')
    .select('product_id', { count: 'exact', head: true })
    .eq('tag_id', id);

  if (count && count > 0)
    throw new Error(`Cannot delete: ${count} product(s) still use this tag`);

  const { error } = await supabase.from('tags').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

// ─────────────────────────────────────────────────────────────────────────────
// CERTIFICATIONS
// ─────────────────────────────────────────────────────────────────────────────

export async function listCertifications() {
  const { data, error } = await supabase
    .from('certifications')
    .select('id, slug, name, name_ar, short_name, short_name_ar, logo_url, badge_color, created_at')
    .order('name', { ascending: true });

  if (error) throw new Error(error.message);
  return data;
}

export async function getCertificationById(id: string) {
  const { data, error } = await supabase
    .from('certifications')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function createCertification(input: z.infer<typeof CertificationCreateSchema>) {
  const { data, error } = await supabase
    .from('certifications')
    .insert(input)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function updateCertification(id: string, input: z.infer<typeof CertificationUpdateSchema>) {
  const { data, error } = await supabase
    .from('certifications')
    .update(input)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function deleteCertification(id: string) {
  const { count } = await supabase
    .from('product_certifications')
    .select('product_id', { count: 'exact', head: true })
    .eq('certification_id', id);

  if (count && count > 0)
    throw new Error(`Cannot delete: ${count} product(s) still use this certification`);

  const { error } = await supabase.from('certifications').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

// ─────────────────────────────────────────────────────────────────────────────
// BADGES
// ─────────────────────────────────────────────────────────────────────────────

export async function listBadges() {
  const { data, error } = await supabase
    .from('badges')
    .select('id, slug, name, name_ar, color_class, is_active')
    .order('name', { ascending: true });

  if (error) throw new Error(error.message);
  return data;
}

export async function getBadgeById(id: string) {
  const { data, error } = await supabase
    .from('badges')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function createBadge(input: z.infer<typeof BadgeCreateSchema>) {
  const { data, error } = await supabase
    .from('badges')
    .insert(input)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function updateBadge(id: string, input: z.infer<typeof BadgeUpdateSchema>) {
  const { data, error } = await supabase
    .from('badges')
    .update(input)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function toggleBadgeActive(id: string) {
  const { data: current, error: fetchErr } = await supabase
    .from('badges')
    .select('is_active')
    .eq('id', id)
    .single();

  if (fetchErr) throw new Error(fetchErr.message);

  const { data, error } = await supabase
    .from('badges')
    .update({ is_active: !current.is_active })
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function deleteBadge(id: string) {
  const { count } = await supabase
    .from('product_badges')
    .select('product_id', { count: 'exact', head: true })
    .eq('badge_id', id);

  if (count && count > 0)
    throw new Error(`Cannot delete: ${count} product(s) still use this badge`);

  const { error } = await supabase.from('badges').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN USERS
// ─────────────────────────────────────────────────────────────────────────────

export async function listAdminUsers() {
  const { data, error } = await supabase
    .from('admin_users')
    .select('id, user_id, role, name, email, is_active, created_at, updated_at')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

export async function getAdminUserById(id: string) {
  const { data, error } = await supabase
    .from('admin_users')
    .select('id, user_id, role, name, email, is_active, created_at, updated_at')
    .eq('id', id)
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function createAdminUser(input: z.infer<typeof AdminUserCreateSchema>) {
  const { data, error } = await supabase
    .from('admin_users')
    .insert(input)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function updateAdminUser(id: string, input: z.infer<typeof AdminUserUpdateSchema>) {
  const { data, error } = await supabase
    .from('admin_users')
    .update(input)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function toggleAdminUserActive(id: string) {
  const { data: current, error: fetchErr } = await supabase
    .from('admin_users')
    .select('is_active')
    .eq('id', id)
    .single();

  if (fetchErr) throw new Error(fetchErr.message);

  const { data, error } = await supabase
    .from('admin_users')
    .update({ is_active: !current.is_active })
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function deleteAdminUser(id: string) {
  const { error } = await supabase
    .from('admin_users')
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);
}

// ─────────────────────────────────────────────────────────────────────────────
// AUDIT LOGS  (read-only)
// ─────────────────────────────────────────────────────────────────────────────

export async function listAuditLogs(page = 1, limit = 50, entity_type?: string, entity_id?: string) {
  let query = supabase
    .from('audit_logs')
    .select('id, admin_id, action, entity_type, entity_id, changes, ip_address, user_agent, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range((page - 1) * limit, page * limit - 1);

  if (entity_type) query = query.eq('entity_type', entity_type);
  if (entity_id)   query = query.eq('entity_id', entity_id);

  const { data, error, count } = await query;
  if (error) throw new Error(error.message);

  return {
    logs: data,
    pagination: {
      page,
      limit,
      total: count ?? 0,
      total_pages: Math.ceil((count ?? 0) / limit),
      has_next: page * limit < (count ?? 0),
      has_prev: page > 1,
    },
  };
}