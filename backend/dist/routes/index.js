"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRoutes = createRoutes;
const express_1 = __importDefault(require("express"));
const restrictionController_1 = require("../controllers/restrictionController");
/**
 * Route definitions for the drone flight restriction API
 *
 * This module defines all API endpoints and their middleware.
 * It provides a clean separation between routing logic and
 * controller logic, making the codebase more maintainable.
 *
 * Routes follow REST conventions:
 * - POST /api/restrictions - Get flight restrictions
 * - GET /api/health - Health check
 * - GET /api/docs - API documentation
 */
function createRoutes() {
    const router = express_1.default.Router();
    const restrictionController = new restrictionController_1.RestrictionController();
    // API versioning - all routes under /api/v1
    const apiRouter = express_1.default.Router();
    // Main restriction endpoint
    apiRouter.post('/restrictions', restrictionController.getRestrictions.bind(restrictionController));
    // Health check endpoint
    apiRouter.get('/health', restrictionController.healthCheck.bind(restrictionController));
    // API documentation endpoint
    apiRouter.get('/docs', restrictionController.getApiDocs.bind(restrictionController));
    // Mount API routes under /api
    router.use('/api', apiRouter);
    // Root endpoint with basic info
    router.get('/', (req, res) => {
        res.json({
            service: 'Drone Flight Restriction API',
            version: '1.0.0',
            description: 'Backend API for drone flight restriction web application',
            endpoints: {
                restrictions: 'POST /api/restrictions',
                health: 'GET /api/health',
                docs: 'GET /api/docs'
            },
            documentation: 'GET /api/docs for detailed API documentation'
        });
    });
    return router;
}
//# sourceMappingURL=index.js.map