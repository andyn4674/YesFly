import express from 'express';
import { RestrictionController } from '../controllers/restrictionController';

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
export function createRoutes(): express.Router {
  const router = express.Router();
  const restrictionController = new RestrictionController();

  // API versioning - all routes under /api/v1
  const apiRouter = express.Router();

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
