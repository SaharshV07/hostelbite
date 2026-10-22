"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const auth_1 = require("./routes/auth");
const vendors_1 = require("./routes/vendors");
const menu_1 = require("./routes/menu");
const orders_1 = require("./routes/orders");
const payments_1 = require("./routes/payments");
const wallet_1 = require("./routes/wallet");
const delivery_1 = require("./routes/delivery");
const complaints_1 = require("./routes/complaints");
const reviews_1 = require("./routes/reviews");
const admin_1 = require("./routes/admin");
const analytics_1 = require("./routes/analytics");
const notifications_1 = require("./routes/notifications");
const errorHandler_1 = require("./middleware/errorHandler");
exports.app = (0, express_1.default)();
exports.app.use((0, cors_1.default)({
    origin: true, // Allow frontend dev server
    credentials: true
}));
exports.app.use(express_1.default.json());
// Health Check Endpoint
exports.app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'HostelBite Backend API',
        institution: 'Manipal University Jaipur - Department of IT',
        timestamp: new Date().toISOString()
    });
});
// Mount Routes
exports.app.use('/api/auth', auth_1.authRouter);
exports.app.use('/api/vendors', vendors_1.vendorRouter);
exports.app.use('/api/menu', menu_1.menuRouter);
exports.app.use('/api/orders', orders_1.orderRouter);
exports.app.use('/api/payments', payments_1.paymentRouter);
exports.app.use('/api/wallet', wallet_1.walletRouter);
exports.app.use('/api/delivery', delivery_1.deliveryRouter);
exports.app.use('/api/complaints', complaints_1.complaintRouter);
exports.app.use('/api/reviews', reviews_1.reviewRouter);
exports.app.use('/api/admin', admin_1.adminRouter);
exports.app.use('/api/analytics', analytics_1.analyticsRouter);
exports.app.use('/api/notifications', notifications_1.notificationRouter);
// Centralized Error Handling
exports.app.use(errorHandler_1.errorHandler);
