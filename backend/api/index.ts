// Import Firebase config first to initialize it
import '../src/config/firebase';

// Import and export the Express app directly
import app from '../src/server';

// Vercel expects a default export
export default app;
