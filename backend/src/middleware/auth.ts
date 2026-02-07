import { Request, Response, NextFunction } from 'express';
import { auth } from '../config/firebase';
import { db } from '../config/firebase';

export interface AuthRequest extends Request {
  user?: {
    uid: string;
    email?: string;
    role?: string;
    [key: string]: any;
  };
}

export const authenticateToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void | Response> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    // Verify Firebase token
    const decodedToken = await auth.verifyIdToken(token);
    
    // Get user role from Firestore (fallback to custom claims if available)
    let userRole = decodedToken.role || 'user';
    
    try {
      const userDoc = await db.collection('users').doc(decodedToken.uid).get();
      if (userDoc.exists) {
        const userData = userDoc.data();
        userRole = userData?.role || decodedToken.role || 'user';
      }
    } catch {
      // If Firestore fetch fails, use role from token or default to 'user'
    }
    
    // Attach user to request
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      role: userRole.toLowerCase(), // Normalize to lowercase
    };

    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

export const requireAdmin = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void | Response> => {
  const userRole = req.user?.role?.toLowerCase();
  if (userRole !== 'admin' && userRole !== 'super_admin') {
    return res.status(403).json({ error: 'Access denied. Admin only.' });
  }
  next();
};

export const requireSuperAdmin = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void | Response> => {
  const userRole = req.user?.role?.toLowerCase();
  if (userRole !== 'super_admin') {
    return res.status(403).json({ error: 'Access denied. Super Admin only.' });
  }
  next();
};

export const requireAnyAdmin = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void | Response> => {
  const userRole = req.user?.role?.toLowerCase();
  const allowed = ['admin', 'admin_limited', 'super_admin', 'accounting'];
  if (!userRole || !allowed.includes(userRole)) {
    return res.status(403).json({ error: 'Access denied. Admin only.' });
  }
  next();
};

export const requireSeller = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void | Response> => {
  const userRole = req.user?.role?.toLowerCase();
  if (userRole !== 'seller' && userRole !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Seller only.' });
  }
  next();
};
