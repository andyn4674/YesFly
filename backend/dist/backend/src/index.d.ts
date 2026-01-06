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
declare const app: import("express-serve-static-core").Express;
export default app;
//# sourceMappingURL=index.d.ts.map