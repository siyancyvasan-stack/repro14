import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { Role } from '../../lib/enums.js';
import { authenticate, authorize } from '../../middleware/auth.js';
import { hashPassword } from '../../lib/password.js';
import db from '../../lib/db.js';

export const adminUserRouter = Router();
adminUserRouter.use(authenticate, authorize(Role.ADMIN, Role.MANAGER, Role.FACTORY_MANAGER));

const employeeCode = z.string().regex(/^\d{1,7}$/, 'Agent ID must contain digits only (maximum 7 digits).');
const role = z.enum([Role.AGENT, Role.FACTORY_MANAGER]);
const userInput = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().email().transform((value) => value.trim().toLowerCase()),
  employeeCode,
  role,
  phone: z.string().trim().max(30).optional().or(z.literal('')),
  avatarUrl: z.string().url().max(500).optional().or(z.literal('')),
  password: z.string().min(8).max(128).optional(),
});

const selectFields = 'SELECT id, name, email, employeeCode, role, phone, avatarUrl, status, createdAt, updatedAt FROM User';

adminUserRouter.get('/', async (req, res) => {
  const requestedRole = req.query.role === Role.AGENT || req.query.role === Role.FACTORY_MANAGER ? req.query.role : null;
  const [rows] = await db.query(
    requestedRole
      ? `${selectFields} WHERE tenantId = ? AND role = ? ORDER BY name ASC`
      : `${selectFields} WHERE tenantId = ? AND role IN (?, ?) ORDER BY name ASC`,
    requestedRole ? [req.auth.tenantId, requestedRole] : [req.auth.tenantId, Role.AGENT, Role.FACTORY_MANAGER],
  );
  return res.json({ users: rows });
});

adminUserRouter.get('/:id', async (req, res) => {
  const [rows] = await db.query(
    'SELECT id, name, email, employeeCode, role, phone, avatarUrl, status, createdAt, updatedAt FROM User WHERE id = ? AND tenantId = ? AND role IN (?, ?) LIMIT 1',
    [req.params.id, req.auth.tenantId, Role.AGENT, Role.FACTORY_MANAGER],
  );
  if (!rows[0]) return res.status(404).json({ error: { code: 'USER_NOT_FOUND', message: 'User not found.' } });
  return res.json({ user: rows[0] });
});

adminUserRouter.post('/', async (req, res) => {
  const input = userInput.extend({ password: z.string().min(8).max(128) }).parse(req.body);
  if (req.auth.role !== Role.ADMIN && !(req.auth.role === Role.MANAGER && input.role === Role.FACTORY_MANAGER)) {
    return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Managers can create Factory Manager accounts only.' } });
  }
  const [existing] = await db.query(
    'SELECT id FROM User WHERE tenantId = ? AND (email = ? OR employeeCode = ?) LIMIT 1',
    [req.auth.tenantId, input.email, input.employeeCode],
  );
  if (existing.length) return res.status(409).json({ error: { code: 'USER_ALREADY_EXISTS', message: 'Email or employee ID is already in use.' } });

  const id = randomUUID();
  await db.query(
    'INSERT INTO User (id, tenantId, name, email, passwordHash, employeeCode, phone, avatarUrl, role, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [id, req.auth.tenantId, input.name, input.email, await hashPassword(input.password), input.employeeCode, input.phone || null, input.avatarUrl || null, input.role, 'ACTIVE'],
  );
  const [created] = await db.query('SELECT id, name, email, employeeCode, role, phone, avatarUrl, status FROM User WHERE id = ?', [id]);
  return res.status(201).json({ user: created[0] });
});

adminUserRouter.patch('/:id', async (req, res) => {
  const input = userInput.partial().parse(req.body);
  const [target] = await db.query('SELECT id FROM User WHERE id = ? AND tenantId = ? AND role IN (?, ?) LIMIT 1', [req.params.id, req.auth.tenantId, Role.AGENT, Role.FACTORY_MANAGER]);
  if (!target[0]) return res.status(404).json({ error: { code: 'USER_NOT_FOUND', message: 'User not found.' } });
  const [targetRole] = await db.query('SELECT role FROM User WHERE id = ? AND tenantId = ? LIMIT 1', [req.params.id, req.auth.tenantId]);
  if (req.auth.role === Role.FACTORY_MANAGER && targetRole[0]?.role !== Role.AGENT) return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Factory managers can maintain sales-person profiles only.' } });
  if (!Object.keys(input).length) return res.status(400).json({ error: { code: 'NO_CHANGES', message: 'No changes supplied.' } });

  if (input.email || input.employeeCode) {
    const [conflict] = await db.query(
      'SELECT id FROM User WHERE tenantId = ? AND id <> ? AND (email = COALESCE(?, email) OR employeeCode = COALESCE(?, employeeCode)) LIMIT 1',
      [req.auth.tenantId, req.params.id, input.email ?? null, input.employeeCode ?? null],
    );
    if (conflict.length) return res.status(409).json({ error: { code: 'USER_ALREADY_EXISTS', message: 'Email or employee ID is already in use.' } });
  }

  const fields = [];
  const values = [];
  for (const key of ['name', 'email', 'employeeCode', 'role', 'phone', 'avatarUrl']) {
    if (input[key] !== undefined) { fields.push(`${key} = ?`); values.push(input[key] || null); }
  }
  if (input.password) { fields.push('passwordHash = ?'); values.push(await hashPassword(input.password)); }
  fields.push('updatedAt = NOW()');
  values.push(req.params.id, req.auth.tenantId);
  await db.query(`UPDATE User SET ${fields.join(', ')} WHERE id = ? AND tenantId = ?`, values);
  const [updated] = await db.query('SELECT id, name, email, employeeCode, role, phone, avatarUrl, status FROM User WHERE id = ?', [req.params.id]);
  return res.json({ user: updated[0] });
});
