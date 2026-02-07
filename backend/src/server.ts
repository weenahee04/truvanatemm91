import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './utils/logger';
import routes from './routes';

// Load environment variables
dotenv.config();

const app: Application = express();
const PORT = parseInt(process.env.PORT || '5000', 10);

// CORS: must be first — answer OPTIONS (preflight) immediately with CORS headers; set headers on all other responses
app.use((req, res, next) => {
  const origin = (req.headers.origin as string) || '';
  const allowOrigin =
    !origin ||
    /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin) ||
    origin.includes('vercel.app')
      ? origin || '*'
      : origin;

  const corsHeaders: Record<string, string> = {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Accept, Origin, stripe-signature',
    'Access-Control-Max-Age': '86400',
  };

  // Preflight: respond immediately so browser always gets CORS headers
  if (req.method === 'OPTIONS') {
    res.writeHead(204, corsHeaders);
    res.end();
    return;
  }

  Object.entries(corsHeaders).forEach(([k, v]) => res.setHeader(k, v));
  next();
});

// CORS Helper function to check if origin should be allowed
const isOriginAllowed = (origin: string | undefined): boolean => {
  if (!origin) return true; // Allow requests with no origin
  
  // Allow all Vercel domains (including vercel.app subdomains)
  if (origin.includes('.vercel.app') || origin.includes('vercel.app')) {
    logger.info(`CORS: ✅ Allowing Vercel origin: ${origin}`);
    return true;
  }
  
  // Allow localhost in development
  if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
    return true;
  }
  
  // In development, allow all origins
  if (!process.env.NODE_ENV || process.env.NODE_ENV === 'development') {
    return true;
  }
  
  // Check against FRONTEND_URL in production
  const allowedOrigins = process.env.FRONTEND_URL?.split(',').map(url => url.trim()).filter(Boolean) || [];
  if (allowedOrigins.length > 0) {
    const isAllowed = allowedOrigins.some(allowed => 
      allowed.toLowerCase() === origin.toLowerCase() || 
      origin.includes(allowed.toLowerCase())
    );
    if (isAllowed) {
      logger.info(`CORS: ✅ Allowing origin from FRONTEND_URL: ${origin}`);
    }
    return isAllowed;
  }
  
  // Fallback: allow all in production if no FRONTEND_URL set (for now, log it)
  logger.warn(`CORS: ⚠️ No FRONTEND_URL set, allowing all origins. Origin: ${origin}`);
  return true;
};

// Note: CORS middleware will handle OPTIONS requests automatically
// This handler is kept for additional logging and fallback
app.use((req, res, next) => {
  // Log OPTIONS requests for debugging
  if (req.method === 'OPTIONS') {
    const origin = req.headers.origin;
    logger.info(`OPTIONS preflight request: ${req.path} from origin: ${origin || 'none'}`);
  }
  next();
});

// CORS configuration - use cors package for reliable handling
// This works in conjunction with the OPTIONS handler above
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      logger.info('CORS: ✅ Allowing request with no origin');
      return callback(null, true);
    }
    
    if (isOriginAllowed(origin)) {
      logger.info(`CORS: ✅ Allowed origin: ${origin}`);
      return callback(null, true);
    } else {
      logger.warn(`CORS: ❌ Blocked origin: ${origin}`);
      // Still allow but log warning - better than blocking
      return callback(null, true);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin', 'stripe-signature'],
  exposedHeaders: [],
  maxAge: 86400, // 24 hours
  preflightContinue: false,
  optionsSuccessStatus: 204,
}));

// Middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false,
}));

// IMPORTANT: Stripe webhook needs raw body for signature verification
// Apply raw body parser BEFORE json parser for webhook route
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging (but skip for webhook to avoid logging sensitive data)
app.use((req, _res, next) => {
  // Log CORS-related headers for debugging
  if (req.method === 'OPTIONS' || req.headers.origin) {
    logger.info(`${req.method} ${req.path} - Origin: ${req.headers.origin || 'none'}`);
  } else if (req.path !== '/api/payments/webhook') {
    logger.info(`${req.method} ${req.path}`);
  } else {
    logger.info(`Webhook request: ${req.method} ${req.path}`);
  }
  next();
});

// Initialize Firebase manually (don't auto-call startServer)
let firebaseInitialized = false;

// Health check
app.get('/health', (_req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    firebase: firebaseInitialized ? 'connected' : 'not configured'
  });
});

// API Routes
app.use('/api', routes);

// 404 handler for API routes
app.use('/api/*', (_req, res) => {
  logger.warn(`404 - Route not found: ${_req.method} ${_req.originalUrl}`);
  res.status(404).json({
    status: 'error',
    statusCode: 404,
    message: `API route not found: ${_req.method} ${_req.originalUrl}`,
  });
});

// Error handling
app.use(errorHandler);

const initializeFirebase = async () => {
  if (!firebaseInitialized) {
    try {
      const firebase = await import('./config/firebase');
      if (firebase.default) {
        logger.info('✅ Firebase connected successfully');
        firebaseInitialized = true;
      } else {
        logger.warn('⚠️ Firebase not configured - server will run without Firebase features');
      }
    } catch (error: any) {
      logger.warn('⚠️ Firebase initialization failed - server will run without Firebase features:', error.message);
      // Don't throw - allow server to start without Firebase
    }
  }
};

// For Vercel, export app and initialize Firebase on first request
if (process.env.VERCEL) {
  // In Vercel, initialize Firebase once
  initializeFirebase().catch(err => logger.error('Firebase init error:', err));
} else {
  // Local development or Railway - start server normally
  const startServer = async () => {
    try {
      await initializeFirebase();
      
      // In Railway or production, listen on 0.0.0.0 to accept external connections
      // In local development, can use 127.0.0.1 for security
      const host = process.env.NODE_ENV === 'production' ? '0.0.0.0' : '127.0.0.1';
      
      app.listen(PORT, host, () => {
        logger.info(`🚀 Server running on port ${PORT}`);
        logger.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
        logger.info(`📡 API URL: http://${host}:${PORT}`);
        logger.info(`🌐 Listening on: ${host}:${PORT}`);
        if (firebaseInitialized) {
          logger.info(`🔥 Firebase Project: ${process.env.FIREBASE_PROJECT_ID}`);
        } else {
          logger.info(`⚠️ Firebase not configured`);
        }
      });
    } catch (error) {
      logger.error('❌ Failed to start server:', error);
      // In production, don't exit immediately - let Railway handle restart
      if (process.env.NODE_ENV === 'development') {
        process.exit(1);
      }
    }
  };

  startServer();
}

// Handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit in production - let Railway handle it
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  logger.error('Stack:', error.stack);
  // Don't exit immediately in production - log and let Railway restart
  if (process.env.NODE_ENV === 'development') {
    process.exit(1);
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  if (!process.env.VERCEL) {
    process.exit(0);
  }
});

export default app;
