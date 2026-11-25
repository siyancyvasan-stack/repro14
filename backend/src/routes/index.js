import { Router } from 'express';
import { authRouter } from '../modules/auth/auth.routes.js';
import { agentRouter } from '../modules/agents/agent.routes.js';
import { productRouter } from '../modules/products/product.routes.js';
import { orderRouter } from '../modules/orders/order.routes.js';
import { attendanceRouter } from '../modules/attendance/attendance.routes.js';
import { analyticsRouter } from '../modules/analytics/analytics.routes.js';
import { notificationRouter } from '../modules/notifications/notification.routes.js';
import { auditRouter } from '../modules/audit/audit.routes.js';
import { fileRouter } from '../modules/files/file.routes.js';
import { reportRouter } from '../modules/reports/report.routes.js';
import { trackingRouter } from '../modules/tracking/tracking.routes.js';
import { shopRouter } from '../modules/shops/shop.routes.js';
import { settingsRouter } from '../modules/settings/settings.routes.js';
import { searchRouter } from '../modules/search/search.routes.js';
import { chatRouter } from '../modules/chat/chat.routes.js';
import { safetyRouter } from '../modules/safety/safety.routes.js';
import { factoryRouter } from '../modules/factory/factory.routes.js';
import { fuelRouter } from '../modules/fuel/fuel.routes.js';
import { platformRouter } from '../modules/platform/platform.routes.js';
import { invoiceRouter } from '../modules/invoices/invoice.routes.js';
import { projectRouter } from '../modules/projects/project.routes.js';
import { mobileRouter } from '../modules/mobile/mobile.routes.js';
import { contactRouter } from '../modules/contacts/contact.routes.js';
import { exportRouter } from '../modules/exports/export.routes.js';
import { broadcastRouter } from '../modules/broadcast/broadcast.routes.js';
import { fieldIntelligenceRouter } from '../modules/field-intelligence/field-intelligence.routes.js';
import { adminUserRouter } from '../modules/admin/admin-user.routes.js';
import { env } from '../config/env.js';
import db from '../lib/db.js';

export const apiRouter = Router();

apiRouter.get('/config/app-version', async (req, res) => {
    const appVersion = env.APP_VERSION || env.VITE_APP_VERSION || '14';
    const mobileVersion = env.MOBILE_APP_VERSION || appVersion;
    const managerVersion = env.VITE_MANAGER_APP_VERSION || appVersion;
    const salesVersion = env.VITE_SALES_APP_VERSION || appVersion;
    const factoryVersion = env.VITE_FACTORY_APP_VERSION || appVersion;
    res.json({
        version: appVersion,
        manager: { version: managerVersion },
        sales: { version: salesVersion },
        factory: { version: factoryVersion },
        android: {
            latestVersion: env.LATEST_APP_VERSION_ANDROID || mobileVersion,
            minimumRequired: env.MIN_APP_VERSION_ANDROID || mobileVersion,
            updateUrl: env.UPDATE_URL_ANDROID,
        },
        ios: {
            latestVersion: env.LATEST_APP_VERSION_IOS || mobileVersion,
            minimumRequired: env.MIN_APP_VERSION_IOS || mobileVersion,
            updateUrl: env.UPDATE_URL_IOS,
        },
        web: {
            latestVersion: env.LATEST_APP_VERSION_WEB || appVersion,
            minimumRequired: env.MIN_APP_VERSION_WEB || appVersion,
        }
    });
});

apiRouter.use('/auth', authRouter);
apiRouter.use('/admin/users', adminUserRouter);
apiRouter.use('/agents', agentRouter);
apiRouter.use('/products', productRouter);
apiRouter.use('/shops', shopRouter);
apiRouter.use('/orders', orderRouter);
apiRouter.use('/attendance', attendanceRouter);
apiRouter.use('/analytics', analyticsRouter);
apiRouter.use('/notifications', notificationRouter);
apiRouter.use('/audit-logs', auditRouter);
apiRouter.use('/files', fileRouter);
apiRouter.use('/reports', reportRouter);
apiRouter.use('/tracking', trackingRouter);
apiRouter.use('/field-intelligence', fieldIntelligenceRouter);
apiRouter.use('/settings', settingsRouter);
apiRouter.use('/search', searchRouter);
apiRouter.use('/chat', chatRouter);
apiRouter.use('/safety', safetyRouter);
apiRouter.use('/factory', factoryRouter);
apiRouter.use('/fuel', fuelRouter);
apiRouter.use('/platform', platformRouter);
apiRouter.use('/invoices', invoiceRouter);
apiRouter.use('/projects', projectRouter);
apiRouter.use('/mobile', mobileRouter);
apiRouter.use('/contacts', contactRouter);
apiRouter.use('/exports', exportRouter);
apiRouter.use('/', broadcastRouter);
