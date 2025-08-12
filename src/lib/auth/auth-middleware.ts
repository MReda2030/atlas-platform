import { NextResponse } from 'next/server';
import { AuthService } from './auth-service';
import { PermissionService, Permission, UserProfile } from './roles-permissions';

export interface AuthenticatedRequest extends Request {
  user?: UserProfile;
  nextUrl: URL;
  cookies: {
    get(name: string): { value: string } | undefined;
  };
  ip?: string;
}

/**
 * Middleware to require authentication
 */
export function requireAuth(handler: (req: AuthenticatedRequest) => Promise<NextResponse>) {
  return async (req: AuthenticatedRequest): Promise<NextResponse> => {
    try {
      // Try to get token from Authorization header first
      let token: string | null = null;
      const authHeader = req.headers.get('authorization');

      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      } else {
        // Fallback to checking for auth-token cookie
        token = req.cookies.get('auth-token')?.value || null;
      }

      if (!token) {
        return NextResponse.json(
          { message: 'Authentication required' },
          { status: 401 }
        );
      }

      const user = await AuthService.verifyToken(token);

      if (!user) {
        return NextResponse.json(
          { message: 'Invalid or expired token' },
          { status: 401 }
        );
      }

      // Attach user to request
      req.user = user;

      return handler(req);

    } catch (error) {
      console.error('Authentication error:', error);
      return NextResponse.json(
        { message: 'Authentication failed' },
        { status: 401 }
      );
    }
  };
}

/**
 * Middleware to require specific permissions
 */
export function requirePermissions(permissions: Permission | Permission[]) {
  const requiredPermissions = Array.isArray(permissions) ? permissions : [permissions];

  return function (handler: (req: AuthenticatedRequest) => Promise<NextResponse>) {
    return requireAuth(async (req: AuthenticatedRequest): Promise<NextResponse> => {
      const user = req.user!;

      if (!PermissionService.hasAllPermissions(user.permissions, requiredPermissions)) {
        // Log permission denied
        await AuthService.logAudit({
          userId: user.id,
          userEmail: user.email,
          action: 'PERMISSION_DENIED',
          resource: 'api',
          details: {
            requiredPermissions,
            userPermissions: user.permissions,
            path: req.nextUrl.pathname,
            method: req.method,
          },
          ipAddress: req.ip || 'unknown',
          userAgent: req.headers.get('user-agent') || 'unknown',
          branchId: user.branchId,
        });

        return NextResponse.json(
          {
            message: 'Insufficient permissions',
            required: requiredPermissions,
            code: 'PERMISSION_DENIED'
          },
          { status: 403 }
        );
      }

      return handler(req);
    });
  };
}

/**
 * Middleware to require any of the specified permissions (OR logic)
 */
export function requireAnyPermission(permissions: Permission[]) {
  return function (handler: (req: AuthenticatedRequest) => Promise<NextResponse>) {
    return requireAuth(async (req: AuthenticatedRequest): Promise<NextResponse> => {
      const user = req.user!;

      if (!PermissionService.hasAnyPermission(user.permissions, permissions)) {
        await AuthService.logAudit({
          userId: user.id,
          userEmail: user.email,
          action: 'PERMISSION_DENIED',
          resource: 'api',
          details: {
            requiredAnyPermissions: permissions,
            userPermissions: user.permissions,
            path: req.nextUrl.pathname,
            method: req.method,
          },
          ipAddress: req.ip || 'unknown',
          userAgent: req.headers.get('user-agent') || 'unknown',
          branchId: user.branchId,
        });

        return NextResponse.json(
          {
            message: 'Insufficient permissions',
            requiredAny: permissions,
            code: 'PERMISSION_DENIED'
          },
          { status: 403 }
        );
      }

      return handler(req);
    });
  };
}

/**
 * Middleware to require branch access
 */
export function requireBranchAccess(getBranchId: (req: AuthenticatedRequest) => string | null) {
  return function (handler: (req: AuthenticatedRequest) => Promise<NextResponse>) {
    return requireAuth(async (req: AuthenticatedRequest): Promise<NextResponse> => {
      const user = req.user!;
      const requestedBranchId = getBranchId(req);

      if (!requestedBranchId) {
        return NextResponse.json(
          { message: 'Branch ID is required' },
          { status: 400 }
        );
      }

      if (!PermissionService.canAccessBranch(user, requestedBranchId)) {
        await AuthService.logAudit({
          userId: user.id,
          userEmail: user.email,
          action: 'BRANCH_ACCESS_DENIED',
          resource: 'api',
          details: {
            requestedBranchId,
            userBranchId: user.branchId,
            path: req.nextUrl.pathname,
            method: req.method,
          },
          ipAddress: req.ip || 'unknown',
          userAgent: req.headers.get('user-agent') || 'unknown',
          branchId: user.branchId,
        });

        return NextResponse.json(
          {
            message: 'Access denied to this branch',
            code: 'BRANCH_ACCESS_DENIED'
          },
          { status: 403 }
        );
      }

      return handler(req);
    });
  };
}

/**
 * Middleware for data filtering based on user role and branch
 */
export function applyDataFilters(req: AuthenticatedRequest): {
  branchFilter?: string;
  agentFilter?: string;
  restrictToOwn: boolean;
  userId?: string;
} {
  const user = req.user!;
  const filters = PermissionService.getDataFilters(user);

  return {
    ...filters,
    userId: user.id,
  };
}

/**
 * Helper to get client IP address
 */
export function getClientIP(req: AuthenticatedRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  const realIP = req.headers.get('x-real-ip');
  const clientIP = req.ip;

  return forwarded?.split(',')[0] || realIP || clientIP || 'unknown';
}

/**
 * Helper to get user agent
 */
export function getUserAgent(req: AuthenticatedRequest): string {
  return req.headers.get('user-agent') || 'unknown';
}

/**
 * Role-based route protection
 */
export function requireRole(allowedRoles: string | string[]) {
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  return function (handler: (req: AuthenticatedRequest) => Promise<NextResponse>) {
    return requireAuth(async (req: AuthenticatedRequest): Promise<NextResponse> => {
      const user = req.user!;

      if (!roles.includes(user.role)) {
        await AuthService.logAudit({
          userId: user.id,
          userEmail: user.email,
          action: 'ROLE_ACCESS_DENIED',
          resource: 'api',
          details: {
            requiredRoles: roles,
            userRole: user.role,
            path: req.nextUrl.pathname,
            method: req.method,
          },
          ipAddress: getClientIP(req),
          userAgent: getUserAgent(req),
          branchId: user.branchId,
        });

        return NextResponse.json(
          {
            message: 'Access denied for your role',
            code: 'ROLE_ACCESS_DENIED'
          },
          { status: 403 }
        );
      }

      return handler(req);
    });
  };
}

/**
 * Combine multiple middleware functions
 */
export function combineMiddleware(...middlewares: Array<(handler: any) => any>) {
  return middlewares.reduce((acc, middleware) => middleware(acc));
}

// Predefined middleware combinations for common use cases
export const adminOnly = requireRole(['SUPER_ADMIN', 'ADMIN']);
export const branchManagerOrAbove = requireRole(['SUPER_ADMIN', 'ADMIN', 'BRANCH_MANAGER']);
export const mediaBuyerAccess = requirePermissions([Permission.CREATE_MEDIA_REPORTS, Permission.VIEW_MEDIA_REPORTS]);
export const salesAgentAccess = requirePermissions([Permission.CREATE_SALES_REPORTS, Permission.VIEW_SALES_REPORTS]);
export const analyticsAccess = requirePermissions(Permission.VIEW_ANALYTICS);

export default {
  requireAuth,
  requirePermissions,
  requireAnyPermission,
  requireBranchAccess,
  requireRole,
  combineMiddleware,
  adminOnly,
  branchManagerOrAbove,
  mediaBuyerAccess,
  salesAgentAccess,
  analyticsAccess,
};