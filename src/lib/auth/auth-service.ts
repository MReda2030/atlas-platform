import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { UserProfile, UserRole, PermissionService, AuditAction } from './roles-permissions';

const prisma = new PrismaClient();

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface CreateUserData {
  email: string;
  password: string;
  name: string;
  role: UserRole;
  branchId?: string;
  agentNumber?: string;
  createdBy: string;
}

export interface AuthResult {
  success: boolean;
  user?: UserProfile;
  token?: string;
  message?: string;
}

export interface SessionInfo {
  userId: string;
  sessionId: string;
  expiresAt: Date;
  ipAddress?: string;
  userAgent?: string;
}

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
const SALT_ROUNDS = 12;

export class AuthService {
  /**
   * Register a new user
   */
  static async createUser(userData: CreateUserData, creatorIpAddress?: string, creatorUserAgent?: string): Promise<AuthResult> {
    try {
      // Check if email already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: userData.email }
      });

      if (existingUser) {
        return {
          success: false,
          message: 'Email already registered'
        };
      }

      // Validate role assignment permissions
      const creator = await prisma.user.findUnique({
        where: { id: userData.createdBy },
        include: { branch: true }
      });

      if (!creator) {
        return {
          success: false,
          message: 'Invalid creator'
        };
      }

      const creatorProfile: UserProfile = {
        id: creator.id,
        email: creator.email,
        name: creator.name,
        role: creator.role as UserRole,
        branchId: creator.branchId || undefined,
        permissions: PermissionService.getUserPermissions(creator.role as UserRole),
        isActive: creator.isActive ?? true,
        createdAt: creator.createdAt || new Date(),
        updatedAt: creator.updatedAt || new Date(),
        lastLoginAt: creator.lastLoginAt || undefined,
        createdBy: 'system', // Placeholder since this field doesn't exist in the User model
      };

      const roleValidation = PermissionService.validateRoleAssignment(
        creatorProfile, 
        userData.role, 
        userData.branchId
      );

      if (!roleValidation.valid) {
        return {
          success: false,
          message: roleValidation.reason
        };
      }

      // Hash password
      const passwordHash = await bcrypt.hash(userData.password, SALT_ROUNDS);

      // Create user
      const newUser = await prisma.user.create({
        data: {
          email: userData.email,
          passwordHash,
          name: userData.name,
          role: userData.role as any, // Cast to handle enum type
          branchId: userData.branchId,
        },
        include: {
          branch: true,
        }
      });

      // Log user creation
      await this.logAudit({
        userId: userData.createdBy,
        userEmail: creator.email,
        action: AuditAction.USER_CREATED,
        resource: 'user',
        resourceId: newUser.id,
        details: {
          newUserEmail: newUser.email,
          newUserRole: newUser.role,
          branchId: newUser.branchId,
        },
        ipAddress: creatorIpAddress || 'unknown',
        userAgent: creatorUserAgent || 'unknown',
        branchId: creator.branchId,
      });

      const userProfile: UserProfile = {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role as UserRole,
        branchId: newUser.branchId || undefined,
        permissions: PermissionService.getUserPermissions(newUser.role as UserRole),
        isActive: newUser.isActive ?? true,
        createdAt: newUser.createdAt || new Date(),
        updatedAt: newUser.updatedAt || new Date(),
        createdBy: 'system', // Placeholder since this field doesn't exist in the User model
      };

      return {
        success: true,
        user: userProfile,
        message: 'User created successfully'
      };

    } catch (error) {
      console.error('User creation error:', error);
      return {
        success: false,
        message: 'Failed to create user'
      };
    }
  }

  /**
   * Authenticate user login
   */
  static async login(credentials: LoginCredentials, ipAddress?: string, userAgent?: string): Promise<AuthResult> {
    try {
      // Find user with branch info
      const user = await prisma.user.findUnique({
        where: { email: credentials.email },
        include: { branch: true }
      });

      if (!user) {
        return {
          success: false,
          message: 'Invalid email or password'
        };
      }

      if (!user.isActive) {
        return {
          success: false,
          message: 'Account is deactivated. Contact administrator.'
        };
      }

      // Verify password
      const validPassword = await bcrypt.compare(credentials.password, user.passwordHash);
      if (!validPassword) {
        // Log failed login attempt
        await this.logAudit({
          userId: user.id,
          userEmail: user.email,
          action: 'LOGIN_FAILED',
          resource: 'auth',
          resourceId: user.id,
          details: { reason: 'invalid_password' },
          ipAddress: ipAddress || 'unknown',
          userAgent: userAgent || 'unknown',
          branchId: user.branchId,
        });

        return {
          success: false,
          message: 'Invalid email or password'
        };
      }

      // Update last login time
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() }
      });

      // Generate session ID and create session
      const sessionId = this.generateSessionId();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      // Create JWT token with full user info
      const token = jwt.sign(
        { 
          userId: user.id, 
          email: user.email,
          role: user.role,
          sessionId: sessionId
        },
        JWT_SECRET as string,
        { expiresIn: JWT_EXPIRES_IN } as any
      );

      // Store session with the same token that will be returned to client
      await prisma.userSession.create({
        data: {
          userId: user.id,
          token: token,
          expiresAt: expiresAt,
          ipAddress: ipAddress,
          userAgent: userAgent,
        }
      });

      // Log successful login
      await this.logAudit({
        userId: user.id,
        userEmail: user.email,
        action: AuditAction.USER_LOGIN,
        resource: 'auth',
        details: { sessionId: sessionId },
        ipAddress: ipAddress || 'unknown',
        userAgent: userAgent || 'unknown',
        branchId: user.branchId,
      });

      const userProfile: UserProfile = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role as UserRole,
        branchId: user.branchId || undefined,
        permissions: PermissionService.getUserPermissions(user.role as UserRole),
        isActive: user.isActive ?? true,
        createdAt: user.createdAt || new Date(),
        updatedAt: user.updatedAt || new Date(),
        lastLoginAt: user.lastLoginAt || undefined,
        createdBy: 'system', // Placeholder since this field doesn't exist in the User model
      };

      return {
        success: true,
        user: userProfile,
        token,
        message: 'Login successful'
      };

    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message: 'Login failed'
      };
    }
  }

  /**
   * Logout user
   */
  static async logout(token: string, ipAddress?: string, userAgent?: string): Promise<{ success: boolean; message: string }> {
    try {
      const decoded = jwt.verify(token, JWT_SECRET as string) as any;
      
      // Remove session
      await prisma.userSession.delete({
        where: { token }
      }).catch(() => {}); // Ignore if session doesn't exist

      // Log logout
      await this.logAudit({
        userId: decoded.userId,
        userEmail: decoded.email,
        action: AuditAction.USER_LOGOUT,
        resource: 'auth',
        details: { sessionId: decoded.sessionId },
        ipAddress: ipAddress || 'unknown',
        userAgent: userAgent || 'unknown',
      });

      return {
        success: true,
        message: 'Logged out successfully'
      };

    } catch (error) {
      return {
        success: true, // Don't expose token validation errors
        message: 'Logged out successfully'
      };
    }
  }

  /**
   * Verify JWT token and get user profile
   */
  static async verifyToken(token: string): Promise<UserProfile | null> {
    try {
      const decoded = jwt.verify(token, JWT_SECRET as string) as any;

      // Check if session still exists
      const session = await prisma.userSession.findUnique({
        where: { token },
        include: { user: { include: { branch: true } } }
      });

      if (!session || session.expiresAt < new Date()) {
        return null;
      }

      const user = session.user;

      if (!user.isActive) {
        return null;
      }

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role as UserRole,
        branchId: user.branchId || undefined,
        permissions: PermissionService.getUserPermissions(user.role as UserRole),
        isActive: user.isActive ?? true,
        createdAt: user.createdAt || new Date(),
        updatedAt: user.updatedAt || new Date(),
        lastLoginAt: user.lastLoginAt || undefined,
        createdBy: 'system', // Placeholder since this field doesn't exist in the User model
      };

    } catch (error) {
      return null;
    }
  }

  /**
   * Create user session
   */
  private static async createSession(sessionInfo: SessionInfo) {
    const session = await prisma.userSession.create({
      data: {
        userId: sessionInfo.userId,
        token: jwt.sign(
          { 
            userId: sessionInfo.userId,
            sessionId: sessionInfo.sessionId 
          },
          JWT_SECRET as string,
          { expiresIn: JWT_EXPIRES_IN } as any
        ),
        expiresAt: sessionInfo.expiresAt,
        ipAddress: sessionInfo.ipAddress,
        userAgent: sessionInfo.userAgent,
      }
    });

    return { ...sessionInfo, token: session.token };
  }

  /**
   * Generate unique session ID
   */
  private static generateSessionId(): string {
    return `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Change user password
   */
  static async changePassword(
    userId: string, 
    currentPassword: string, 
    newPassword: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        return { success: false, message: 'User not found' };
      }

      // Verify current password
      const validPassword = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!validPassword) {
        return { success: false, message: 'Current password is incorrect' };
      }

      // Hash new password
      const newPasswordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

      // Update password
      await prisma.user.update({
        where: { id: userId },
        data: { passwordHash: newPasswordHash }
      });

      // Log password change
      await this.logAudit({
        userId,
        userEmail: user.email,
        action: 'PASSWORD_CHANGED',
        resource: 'user',
        resourceId: userId,
        details: {},
        ipAddress: ipAddress || 'unknown',
        userAgent: userAgent || 'unknown',
        branchId: user.branchId,
      });

      return { success: true, message: 'Password changed successfully' };

    } catch (error) {
      console.error('Password change error:', error);
      return { success: false, message: 'Failed to change password' };
    }
  }

  /**
   * Log audit event
   */
  static async logAudit(auditData: {
    userId: string;
    userEmail: string;
    action: string;
    resource: string;
    resourceId?: string;
    details: Record<string, any>;
    ipAddress: string;
    userAgent: string;
    branchId?: string | null;
  }): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          userId: auditData.userId,
          action: auditData.action,
          table_name: auditData.resource,
          record_id: auditData.resourceId || auditData.userId || 'N/A',
          old_values: auditData.details?.oldValues || null,
          new_values: auditData.details?.newValues || auditData.details || null,
          ipAddress: auditData.ipAddress,
          userAgent: auditData.userAgent,
        }
      });
    } catch (error) {
      console.error('Failed to log audit event:', error);
      // Don't throw error - audit logging shouldn't break the main flow
    }
  }

  /**
   * Clean up expired sessions
   */
  static async cleanupExpiredSessions(): Promise<void> {
    try {
      await prisma.userSession.deleteMany({
        where: {
          expiresAt: { lt: new Date() }
        }
      });
    } catch (error) {
      console.error('Failed to cleanup expired sessions:', error);
    }
  }
}

export default AuthService;