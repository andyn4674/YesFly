import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createRoutes } from './routes';

/**
 * Main Express server setup and configuration
 * 
 * This file sets up the Express server with:
 * - Security middleware (Helmet)
 * - CORS configuration
 * - JSON parsing
 * - Route mounting
 * - Error handling
 * - Server startup
 * 
 * The server is designed to be:
 * - Secure by default (CORS, Helmet)
 * - Stateless (no session storage)
 * - Production-ready (error handling, logging)
 * - Easy to test and maintain
 */

// Create Express application
const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware - Helmet helps secure Express apps
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS configuration - Allow requests from frontend
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:5174', 'http://localhost:5174'],
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' })); // Support JSON-encoded bodies
app.use(express.urlencoded({ extended: true, limit: '10mb' })); // Support URL-encoded bodies

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Mount routes
app.use(createRoutes());

// Global error handler
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', error);
  
  // Don't send error details in production
  const message = process.env.NODE_ENV === 'production' 
    ? 'Internal server error' 
    : error.message;
  
  res.status(500).json({
    success: false,
    error: 'Internal Server Error',
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`,
    availableRoutes: [
      'GET /',
      'POST /api/restrictions',
      'GET /api/health',
      'GET /api/docs'
    ]
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Drone Flight Restriction API server running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📚 API docs: http://localhost:${PORT}/api/docs`);
  console.log(`🎯 Restrictions endpoint: http://localhost:${PORT}/api/restrictions`);
  
  if (process.env.NODE_ENV !== 'production') {
    console.log(`⚠️  Development mode - detailed error messages enabled`);
  }
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

export default app;
