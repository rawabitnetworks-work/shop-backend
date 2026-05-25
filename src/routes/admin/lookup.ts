import { Router } from 'express';
import { asyncHandler } from '../../middleware/asyncHandler';
import { validate } from '../../middleware/validate';
import { ok, fail, Errors } from '../../lib/response';
import {
  listTags, getTagById, createTag, updateTag, deleteTag,
  listCertifications, getCertificationById, createCertification, updateCertification, deleteCertification,
  listBadges, getBadgeById, createBadge, updateBadge, toggleBadgeActive, deleteBadge,
  listAdminUsers, getAdminUserById, createAdminUser, updateAdminUser, toggleAdminUserActive, deleteAdminUser,
  listAuditLogs,
} from '../../services/lookup.service';
import {
  TagCreateSchema, TagUpdateSchema,
  CertificationCreateSchema, CertificationUpdateSchema,
  BadgeCreateSchema, BadgeUpdateSchema,
  AdminUserCreateSchema, AdminUserUpdateSchema,
} from '../../validation/schemas';

// ─────────────────────────────────────────────────────────────────────────────
// TAGS  /api/admin/tags
// ─────────────────────────────────────────────────────────────────────────────

export const tagsRouter = Router();

tagsRouter.get('/', asyncHandler(async (req, res) => {
  const tags = await listTags(req.query.type as string | undefined);
  ok(res, { tags });
}));

tagsRouter.get('/:id', asyncHandler(async (req, res) => {
  try {
    const tag = await getTagById(req.params.id);
    ok(res, { tag });
  } catch {
    fail(res, Errors.notFound('tag'));
  }
}));

tagsRouter.post('/', validate(TagCreateSchema), asyncHandler(async (req, res) => {
  const tag = await createTag(req.body);
  ok(res, { tag }, 201);
}));

tagsRouter.put('/:id', validate(TagUpdateSchema), asyncHandler(async (req, res) => {
  try {
    const tag = await updateTag(req.params.id, req.body);
    ok(res, { tag });
  } catch {
    fail(res, Errors.notFound('tag'));
  }
}));

tagsRouter.delete('/:id', asyncHandler(async (req, res) => {
  try {
    await deleteTag(req.params.id);
    ok(res, { message: 'Tag deleted' });
  } catch (e: any) {
    fail(res, {
        status: 409, message: e.message,
        code: ''
    });
  }
}));

// ─────────────────────────────────────────────────────────────────────────────
// CERTIFICATIONS  /api/admin/certifications
// ─────────────────────────────────────────────────────────────────────────────

export const certificationsRouter = Router();

certificationsRouter.get('/', asyncHandler(async (_req, res) => {
  const certifications = await listCertifications();
  ok(res, { certifications });
}));

certificationsRouter.get('/:id', asyncHandler(async (req, res) => {
  try {
    const certification = await getCertificationById(req.params.id);
    ok(res, { certification });
  } catch {
    fail(res, Errors.notFound('certification'));
  }
}));

certificationsRouter.post('/', validate(CertificationCreateSchema), asyncHandler(async (req, res) => {
  const certification = await createCertification(req.body);
  ok(res, { certification }, 201);
}));

certificationsRouter.put('/:id', validate(CertificationUpdateSchema), asyncHandler(async (req, res) => {
  try {
    const certification = await updateCertification(req.params.id, req.body);
    ok(res, { certification });
  } catch {
    fail(res, Errors.notFound('certification'));
  }
}));

certificationsRouter.delete('/:id', asyncHandler(async (req, res) => {
  try {
    await deleteCertification(req.params.id);
    ok(res, { message: 'Certification deleted' });
  } catch (e: any) {
    fail(res, {
        status: 409, message: e.message,
        code: ''
    });
  }
}));

// ─────────────────────────────────────────────────────────────────────────────
// BADGES  /api/admin/badges
// ─────────────────────────────────────────────────────────────────────────────

export const badgesRouter = Router();

badgesRouter.get('/', asyncHandler(async (_req, res) => {
  const badges = await listBadges();
  ok(res, { badges });
}));

badgesRouter.get('/:id', asyncHandler(async (req, res) => {
  try {
    const badge = await getBadgeById(req.params.id);
    ok(res, { badge });
  } catch {
    fail(res, Errors.notFound('badge'));
  }
}));

badgesRouter.post('/', validate(BadgeCreateSchema), asyncHandler(async (req, res) => {
  const badge = await createBadge(req.body);
  ok(res, { badge }, 201);
}));

badgesRouter.put('/:id', validate(BadgeUpdateSchema), asyncHandler(async (req, res) => {
  try {
    const badge = await updateBadge(req.params.id, req.body);
    ok(res, { badge });
  } catch {
    fail(res, Errors.notFound('badge'));
  }
}));

badgesRouter.post('/:id/toggle', asyncHandler(async (req, res) => {
  try {
    const badge = await toggleBadgeActive(req.params.id);
    ok(res, { badge });
  } catch {
    fail(res, Errors.notFound('badge'));
  }
}));

badgesRouter.delete('/:id', asyncHandler(async (req, res) => {
  try {
    await deleteBadge(req.params.id);
    ok(res, { message: 'Badge deleted' });
  } catch (e: any) {
    fail(res, {
        status: 409, message: e.message,
        code: ''
    });
  }
}));

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN USERS  /api/admin/users
// ─────────────────────────────────────────────────────────────────────────────

export const adminUsersRouter = Router();

adminUsersRouter.get('/', asyncHandler(async (_req, res) => {
  const users = await listAdminUsers();
  ok(res, { users });
}));

adminUsersRouter.get('/:id', asyncHandler(async (req, res) => {
  try {
    const user = await getAdminUserById(req.params.id);
    ok(res, { user });
  } catch {
    fail(res, Errors.notFound('admin user'));
  }
}));

adminUsersRouter.post('/', validate(AdminUserCreateSchema), asyncHandler(async (req, res) => {
  const user = await createAdminUser(req.body);
  ok(res, { user }, 201);
}));

adminUsersRouter.put('/:id', validate(AdminUserUpdateSchema), asyncHandler(async (req, res) => {
  try {
    const user = await updateAdminUser(req.params.id, req.body);
    ok(res, { user });
  } catch {
    fail(res, Errors.notFound('admin user'));
  }
}));

adminUsersRouter.post('/:id/toggle', asyncHandler(async (req, res) => {
  try {
    const user = await toggleAdminUserActive(req.params.id);
    ok(res, { user });
  } catch {
    fail(res, Errors.notFound('admin user'));
  }
}));

adminUsersRouter.delete('/:id', asyncHandler(async (req, res) => {
  try {
    await deleteAdminUser(req.params.id);
    ok(res, { message: 'Admin user deleted' });
  } catch {
    fail(res, Errors.notFound('admin user'));
  }
}));

// ─────────────────────────────────────────────────────────────────────────────
// AUDIT LOGS  /api/admin/audit-logs  (read-only)
// ─────────────────────────────────────────────────────────────────────────────

export const auditLogsRouter = Router();

auditLogsRouter.get('/', asyncHandler(async (req, res) => {
  const page        = Number(req.query.page  ?? 1);
  const limit       = Number(req.query.limit ?? 50);
  const entity_type = req.query.entity_type as string | undefined;
  const entity_id   = req.query.entity_id   as string | undefined;

  const result = await listAuditLogs(page, limit, entity_type, entity_id);
  ok(res, result);
}));