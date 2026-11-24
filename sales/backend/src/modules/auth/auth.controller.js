import * as authService from './auth.service.js';
import { env } from '../../config/env.js';
import { AppError } from '../../middleware/errorHandler.js';
import { createDeviceSession, closeDeviceSessions, touchDeviceSession, } from '../../lib/deviceSession.js';
import { createRefreshToken, hashToken } from '../../lib/jwt.js';
import db from '../../lib/db.js';
import { hashPassword, verifyPassword } from '../../lib/password.js';
import { sendAccountDeletionVerification, sendPasswordReset } from '../../lib/email.js';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
const WEBVIEW_HANDOFF_TTL_MS = 60_000;
const cookieOptions = {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: env.COOKIE_SAME_SITE,
    domain: env.COOKIE_DOMAIN || undefined,
    maxAge: env.JWT_REFRESH_TTL_DAYS * 86_400_000,
    path: '/api/v1/auth',
};
const clientType = (req) => String(req.headers['x-client-platform']).toLowerCase() === 'mobile' ? 'MOBILE' : 'WEB';
const assertTrustedCookieOrigin = (req, client) => {
    if (client === 'MOBILE' || !req.cookies.tf_refresh)
        return;
    const origin = req.get('origin');
    if (origin && !env.CORS_ORIGINS.includes(origin)) {
        throw new AppError(403, 'UNTRUSTED_ORIGIN', 'Request origin is not allowed');
    }
    if (req.get('sec-fetch-site') === 'cross-site') {
        throw new AppError(403, 'CSRF_REJECTED', 'Cross-site session request rejected');
    }
};
export const login = async (req, res) => {
    const client = clientType(req);
    const result = await authService.login(req.body, {
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        clientType: client,
    });
    // Record device session — fire and forget, never blocks login
    // Decode tenantId from the access token since publicUser() strips it
    try {
        const { verifyAccessToken } = await import('../../lib/jwt.js');
        const claims = verifyAccessToken(result.accessToken);
        void createDeviceSession({
            tenantId: claims.tenantId,
            userId: claims.sub,
            userAgent: req.headers['user-agent'],
            clientPlatform: req.headers['x-client-platform'],
            appVersion: req.headers['x-app-version'],
            ip: req.ip,
        });
    }
    catch {
        // non-blocking — if JWT parse fails here, login still succeeds
    }
    if (client === 'WEB')
        res.cookie('tf_refresh', result.refreshToken, cookieOptions);
    return res.json({ accessToken: result.accessToken, refreshToken: client === 'MOBILE' ? result.refreshToken : undefined, user: result.user });
};
export const requestRegistrationOtp = async (req, res) => {
    await authService.requestRegistrationOtp(req.body);
    return res.status(202).json({
        message: 'If the address can be registered, a verification code has been sent.',
        expiresInMinutes: env.OTP_TTL_MINUTES,
    });
};
export const verifyRegistrationOtp = async (req, res) => {
    const user = await authService.verifyRegistrationOtp(req.body);
    return res.status(201).json({ message: 'Account verified successfully', user });
};
export const requestPasswordReset = async (req, res) => {
    const { email, tenant } = req.body;
    // The response is deliberately identical whether or not the account exists.
    const [users] = await db.query(
        'SELECT u.id, u.name, u.email FROM User u JOIN Tenant t ON t.id = u.tenantId WHERE u.email = ? AND t.slug = ? AND u.status = ? LIMIT 1',
        [email, tenant, 'ACTIVE']
    );
    const user = users[0];
    if (user) {
        const token = createRefreshToken();
        const expiresAt = new Date(Date.now() + 15 * 60_000);
        await db.query('UPDATE EmailVerification SET consumedAt = NOW() WHERE email = ? AND tenantSlug = ? AND purpose = ? AND consumedAt IS NULL', [email, tenant, 'PASSWORD_RESET']);
        await db.query(
            'INSERT INTO EmailVerification (id, email, tenantSlug, purpose, codeHash, payload, expiresAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [randomUUID(), email, tenant, 'PASSWORD_RESET', hashToken(token), JSON.stringify({ userId: user.id }), expiresAt]
        );
        const resetUrl = new URL(env.WEBAUTHN_ORIGIN);
        resetUrl.searchParams.set('reset', token);
        resetUrl.searchParams.set('email', email);
        try {
            await sendPasswordReset(email, user.name, resetUrl.toString());
        } catch (error) {
            await db.query('UPDATE EmailVerification SET consumedAt = NOW() WHERE email = ? AND tenantSlug = ? AND purpose = ? AND codeHash = ?', [email, tenant, 'PASSWORD_RESET', hashToken(token)]).catch(() => undefined);
            throw error;
        }
    }
    return res.status(202).json({ message: 'If the account exists, a password reset link has been sent.' });
};
export const resetPassword = async (req, res) => {
    const { email, tenant, token, password } = req.body;
    const [resets] = await db.query(
        'SELECT * FROM EmailVerification WHERE email = ? AND tenantSlug = ? AND purpose = ? AND codeHash = ? AND consumedAt IS NULL AND expiresAt > NOW() ORDER BY createdAt DESC LIMIT 1',
        [email, tenant, 'PASSWORD_RESET', hashToken(token)]
    );
    const reset = resets[0];
    if (!reset) throw new AppError(400, 'PASSWORD_RESET_INVALID', 'This password reset link is invalid or expired.');
    const [users] = await db.query('SELECT u.id, u.tenantId FROM User u JOIN Tenant t ON t.id = u.tenantId WHERE u.email = ? AND t.slug = ? AND u.status = ? LIMIT 1', [email, tenant, 'ACTIVE']);
    const user = users[0];
    if (!user) throw new AppError(400, 'PASSWORD_RESET_INVALID', 'This password reset link is invalid or expired.');
    const connection = await db.getConnection();
    await connection.beginTransaction();
    try {
        const [consumed] = await connection.query('UPDATE EmailVerification SET consumedAt = NOW() WHERE id = ? AND consumedAt IS NULL', [reset.id]);
        if (consumed.affectedRows !== 1) throw new AppError(400, 'PASSWORD_RESET_INVALID', 'This password reset link has already been used.');
        await connection.query('UPDATE User SET passwordHash = ? WHERE id = ?', [await hashPassword(password), user.id]);
        await connection.query('UPDATE RefreshToken SET revokedAt = NOW() WHERE userId = ? AND revokedAt IS NULL', [user.id]);
        await connection.query('INSERT INTO AuditLog (tenantId, actorId, action, entity, entityId, ipAddress) VALUES (?, ?, ?, ?, ?, ?)', [user.tenantId, user.id, 'PASSWORD_RESET', 'User', user.id, req.ip]);
        await connection.commit();
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally { connection.release(); }
    return res.status(204).send();
};
export const refresh = async (req, res) => {
    const client = clientType(req);
    assertTrustedCookieOrigin(req, client);
    const refreshToken = client === 'MOBILE' ? req.body?.refreshToken : req.cookies.tf_refresh ?? req.body?.refreshToken;
    if (!refreshToken) {
        throw new AppError(401, 'REFRESH_TOKEN_REQUIRED', 'Refresh token is required');
    }
    const result = await authService.refresh(refreshToken, {
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        clientType: client,
    });
    if (client === 'WEB')
        res.cookie('tf_refresh', result.refreshToken, cookieOptions);
    return res.json({ accessToken: result.accessToken, refreshToken: client === 'MOBILE' ? result.refreshToken : undefined, user: result.user });
};
export const logout = async (req, res) => {
    const client = clientType(req);
    assertTrustedCookieOrigin(req, client);
    const refreshToken = client === 'MOBILE' ? req.body?.refreshToken : req.cookies.tf_refresh ?? req.body?.refreshToken;
    await authService.logout(refreshToken);
    // Close device sessions — fire and forget
    if (req.auth?.sub)
        void closeDeviceSessions(req.auth.sub);
    if (client === 'WEB') {
        res.setHeader('Clear-Site-Data', '"cache", "cookies", "storage"');
        res.clearCookie('tf_refresh', cookieOptions);
    }
    return res.status(204).send();
};
export const me = async (req, res) => {
    const [users] = await db.query(
        'SELECT id, email, name, role, avatarUrl, employeeCode, phone, region, tenantId FROM User WHERE id = ?',
        [req.auth.sub]
    );
    const user = users[0];
    // Touch session heartbeat — fire and forget
    if (req.auth?.sub && req.auth?.tenantId) {
        void touchDeviceSession(req.auth.sub, req.auth.tenantId, req.headers['x-app-version']);
    }
    return res.json({ user });
};

export const updateMe = async (req, res) => {
    const input = z.object({
        name: z.string().trim().min(2).max(100).optional(),
        email: z.string().email().transform((value) => value.toLowerCase()).optional(),
        avatarUrl: z.string().url().max(500).optional().or(z.literal('')),
        password: z.string().min(8).max(128).optional(),
    }).strict().parse(req.body);
    if (!Object.keys(input).length) return res.status(400).json({ error: { code: 'NO_CHANGES', message: 'No profile changes supplied.' } });
    if (input.email) {
        const [conflicts] = await db.query('SELECT id FROM User WHERE tenantId = ? AND email = ? AND id <> ? LIMIT 1', [req.auth.tenantId, input.email, req.auth.sub]);
        if (conflicts.length) return res.status(409).json({ error: { code: 'EMAIL_ALREADY_EXISTS', message: 'This email is already in use.' } });
    }
    const fields = [];
    const values = [];
    for (const key of ['name', 'email', 'avatarUrl']) {
        if (input[key] !== undefined) { fields.push(`${key} = ?`); values.push(input[key] || null); }
    }
    if (input.password) { fields.push('passwordHash = ?'); values.push(await hashPassword(input.password)); }
    fields.push('updatedAt = NOW()');
    values.push(req.auth.sub, req.auth.tenantId);
    await db.query(`UPDATE User SET ${fields.join(', ')} WHERE id = ? AND tenantId = ?`, values);
    const [users] = await db.query('SELECT id, email, name, role, avatarUrl, employeeCode, phone, region, tenantId FROM User WHERE id = ? AND tenantId = ?', [req.auth.sub, req.auth.tenantId]);
    return res.json({ user: users[0] });
};
export const requestAccountDeletion = async (req, res) => {
    const input = z.object({ email: z.string().email().transform((value) => value.toLowerCase()), password: z.string().min(8).max(128), tenant: z.string().min(2).default('reproutes') }).strict().parse(req.body);
    const [users] = await db.query('SELECT u.id, u.tenantId, u.email, u.name, u.passwordHash FROM User u JOIN Tenant t ON t.id = u.tenantId WHERE u.email = ? AND t.slug = ? AND u.status = ? LIMIT 1', [input.email, input.tenant, 'ACTIVE']);
    const user = users[0];
    if (!user || !(await verifyPassword(input.password, user.passwordHash))) throw new AppError(401, 'IDENTITY_VERIFICATION_FAILED', 'Email or password is incorrect.');
    const token = createRefreshToken();
    const expiresAt = new Date(Date.now() + 15 * 60_000);
    await db.query('UPDATE EmailVerification SET consumedAt = NOW() WHERE email = ? AND tenantSlug = ? AND purpose = ? AND consumedAt IS NULL', [input.email, input.tenant, 'ACCOUNT_DELETION']);
    await db.query('INSERT INTO EmailVerification (id, email, tenantSlug, purpose, codeHash, payload, expiresAt) VALUES (?, ?, ?, ?, ?, ?, ?)', [randomUUID(), input.email, input.tenant, 'ACCOUNT_DELETION', hashToken(token), JSON.stringify({ userId: user.id }), expiresAt]);
    const confirmUrl = new URL('/delete-account', env.WEBAUTHN_ORIGIN);
    confirmUrl.searchParams.set('email', input.email); confirmUrl.searchParams.set('token', token);
    try { await sendAccountDeletionVerification(input.email, user.name, confirmUrl.toString()); }
    catch (error) { await db.query('UPDATE EmailVerification SET consumedAt = NOW() WHERE email = ? AND tenantSlug = ? AND purpose = ? AND codeHash = ?', [input.email, input.tenant, 'ACCOUNT_DELETION', hashToken(token)]).catch(() => undefined); throw error; }
    return res.status(202).json({ message: 'A verification link was sent to your email. It expires in 15 minutes.' });
};
export const confirmAccountDeletion = async (req, res) => {
    const input = z.object({ email: z.string().email().transform((value) => value.toLowerCase()), token: z.string().min(32).max(512), tenant: z.string().min(2).default('reproutes') }).strict().parse(req.body);
    const [requests] = await db.query('SELECT e.*, u.id as userId, u.tenantId FROM EmailVerification e JOIN User u ON u.id = JSON_UNQUOTE(JSON_EXTRACT(e.payload, "$.userId")) WHERE e.email = ? AND e.tenantSlug = ? AND e.purpose = ? AND e.codeHash = ? AND e.consumedAt IS NULL AND e.expiresAt > NOW() ORDER BY e.createdAt DESC LIMIT 1', [input.email, input.tenant, 'ACCOUNT_DELETION', hashToken(input.token)]);
    const request = requests[0];
    if (!request) throw new AppError(400, 'ACCOUNT_DELETION_INVALID', 'This deletion link is invalid or expired.');
    const connection = await db.getConnection();
    await connection.beginTransaction();
    try {
        const [consumed] = await connection.query('UPDATE EmailVerification SET consumedAt = NOW() WHERE id = ? AND consumedAt IS NULL', [request.id]);
        if (consumed.affectedRows !== 1) throw new AppError(409, 'ACCOUNT_DELETION_USED', 'This deletion link has already been used.');
        const deletedEmail = `deleted+${request.userId}@invalid.reproutes`;
        await connection.query('DELETE FROM LocationPing WHERE agentId = ?', [request.userId]);
        await connection.query('UPDATE Attendance SET checkInLat = NULL, checkInLng = NULL, checkOutLat = NULL, checkOutLng = NULL, checkInAccuracy = NULL, checkOutAccuracy = NULL, gpsCoverage = NULL WHERE agentId = ?', [request.userId]);
        await connection.query('UPDATE AgentProfile SET status = ?, shiftActive = ?, trackingState = ?, latitude = NULL, longitude = NULL, lastLocationAt = NULL, lastHeartbeatAt = NULL WHERE userId = ?', ['OFFLINE', false, 'STOPPED', request.userId]);
        await connection.query('DELETE FROM BiometricCredential WHERE userId = ?', [request.userId]);
        await connection.query('DELETE FROM PasskeyChallenge WHERE userId = ?', [request.userId]);
        await connection.query('UPDATE RefreshToken SET revokedAt = NOW() WHERE userId = ? AND revokedAt IS NULL', [request.userId]);
        await connection.query('UPDATE User SET status = ?, email = ?, name = ?, passwordHash = ?, employeeCode = NULL, phone = NULL, avatarUrl = NULL, region = NULL, updatedAt = NOW() WHERE id = ?', ['DELETED', deletedEmail, 'Deleted user', await hashPassword(randomUUID()), request.userId]);
        await connection.query('INSERT INTO AuditLog (tenantId, actorId, action, entity, entityId, ipAddress, metadata) VALUES (?, ?, ?, ?, ?, ?, ?)', [request.tenantId, request.userId, 'ACCOUNT_DELETED', 'User', request.userId, req.ip, JSON.stringify({ retained: 'De-identified operational records may be retained for up to 7 years.' })]);
        await connection.commit();
    } catch (error) { await connection.rollback(); throw error; } finally { connection.release(); }
    res.clearCookie('tf_refresh', cookieOptions);
    return res.json({ message: 'Your account has been deleted and access has been revoked.' });
};
export const createWebViewHandoff = async (req, res) => {
    const code = createRefreshToken();
    await db.query(
        'INSERT INTO PasskeyChallenge (id, userId, challenge, purpose, expiresAt) VALUES (?, ?, ?, ?, ?)',
        [randomUUID(), req.auth.sub, hashToken(code), 'WEBVIEW_HANDOFF', new Date(Date.now() + WEBVIEW_HANDOFF_TTL_MS)]
    );
    res.setHeader('Cache-Control', 'no-store');
    return res.status(201).json({ code, expiresInSeconds: WEBVIEW_HANDOFF_TTL_MS / 1000 });
};
export const exchangeWebViewHandoff = async (req, res) => {
    const code = typeof req.body?.code === 'string' ? req.body.code : '';
    if (code.length < 32)
        throw new AppError(400, 'HANDOFF_INVALID', 'Mobile session handoff is invalid');
    const [handoffs] = await db.query(
        'SELECT p.*, u.id as userId, u.email as userEmail, u.name as userName, u.role as userRole, u.tenantId as userTenantId, u.status as userStatus FROM PasskeyChallenge p JOIN User u ON p.userId = u.id WHERE p.challenge = ? AND p.purpose = ? AND p.consumedAt IS NULL AND p.expiresAt > NOW() LIMIT 1',
        [hashToken(code), 'WEBVIEW_HANDOFF']
    );
    const handoff = handoffs[0];
    if (handoff) {
        handoff.user = { id: handoff.userId, email: handoff.userEmail, name: handoff.userName, role: handoff.userRole, tenantId: handoff.userTenantId, status: handoff.userStatus };
    }
    if (!handoff?.user || handoff.user.status !== 'ACTIVE') {
        throw new AppError(400, 'HANDOFF_EXPIRED', 'Mobile session handoff expired. Return to the app and try again.');
    }
    const [updateResult] = await db.query(
        'UPDATE PasskeyChallenge SET consumedAt = NOW() WHERE id = ? AND consumedAt IS NULL',
        [handoff.id]
    );
    if (updateResult.affectedRows !== 1)
        throw new AppError(409, 'HANDOFF_USED', 'Mobile session handoff was already used');
    const session = await authService.createAuthenticatedSession(handoff.user, {
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        clientType: 'WEB',
    });
    res.cookie('tf_refresh', session.refreshToken, cookieOptions);
    res.setHeader('Cache-Control', 'no-store');
    return res.json({ accessToken: session.accessToken, user: session.user });
};
