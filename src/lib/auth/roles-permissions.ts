// User Management and Permissions System for Atlas Platform
// Comprehensive role-based access control (RBAC) system

export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  BRANCH_MANAGER = 'BRANCH_MANAGER',
  MEDIA_BUYER = 'MEDIA_BUYER',
  SALES_AGENT = 'SALES_AGENT',
  ANALYST = 'ANALYST',
  VIEWER = 'VIEWER'
}

export enum Permission {
  // User Management
  MANAGE_USERS = 'manage_users',
  VIEW_USERS = 'view_users',
  ASSIGN_ROLES = 'assign_roles',

  // Media Reports
  CREATE_MEDIA_REPORTS = 'create_media_reports',
  VIEW_MEDIA_REPORTS = 'view_media_reports',
  EDIT_MEDIA_REPORTS = 'edit_media_reports',
  DELETE_MEDIA_REPORTS = 'delete_media_reports',
  VIEW_ALL_MEDIA_REPORTS = 'view_all_media_reports',

  // Sales Reports
  CREATE_SALES_REPORTS = 'create_sales_reports',
  VIEW_SALES_REPORTS = 'view_sales_reports',
  EDIT_SALES_REPORTS = 'edit_sales_reports',
  DELETE_SALES_REPORTS = 'delete_sales_reports',
  VIEW_ALL_SALES_REPORTS = 'view_all_sales_reports',

  // Analytics
  VIEW_ANALYTICS = 'view_analytics',
  VIEW_DETAILED_ANALYTICS = 'view_detailed_analytics',
  VIEW_FINANCIAL_METRICS = 'view_financial_metrics',
  EXPORT_ANALYTICS = 'export_analytics',
  VIEW_ALL_BRANCHES_ANALYTICS = 'view_all_branches_analytics',

  // System Administration
  MANAGE_SYSTEM_SETTINGS = 'manage_system_settings',
  VIEW_AUDIT_LOGS = 'view_audit_logs',
  MANAGE_BRANCHES = 'manage_branches',
  MANAGE_AGENTS = 'manage_agents',

  // Data Management
  IMPORT_DATA = 'import_data',
  EXPORT_DATA = 'export_data',
  BULK_OPERATIONS = 'bulk_operations',

  // Branch-specific permissions
  MANAGE_BRANCH_USERS = 'manage_branch_users',
  VIEW_BRANCH_ANALYTICS = 'view_branch_analytics',
  MANAGE_BRANCH_AGENTS = 'manage_branch_agents',
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  branchId?: string; // null for super_admin, required for branch-specific roles
  agentNumber?: string; // for sales_agent role
  permissions: Permission[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
  createdBy: string;
}

// Role definitions with default permissions
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.SUPER_ADMIN]: [
    // Full system access
    Permission.MANAGE_USERS,
    Permission.VIEW_USERS,
    Permission.ASSIGN_ROLES,
    Permission.CREATE_MEDIA_REPORTS,
    Permission.VIEW_MEDIA_REPORTS,
    Permission.EDIT_MEDIA_REPORTS,
    Permission.DELETE_MEDIA_REPORTS,
    Permission.VIEW_ALL_MEDIA_REPORTS,
    Permission.CREATE_SALES_REPORTS,
    Permission.VIEW_SALES_REPORTS,
    Permission.EDIT_SALES_REPORTS,
    Permission.DELETE_SALES_REPORTS,
    Permission.VIEW_ALL_SALES_REPORTS,
    Permission.VIEW_ANALYTICS,
    Permission.VIEW_DETAILED_ANALYTICS,
    Permission.VIEW_FINANCIAL_METRICS,
    Permission.EXPORT_ANALYTICS,
    Permission.VIEW_ALL_BRANCHES_ANALYTICS,
    Permission.MANAGE_SYSTEM_SETTINGS,
    Permission.VIEW_AUDIT_LOGS,
    Permission.MANAGE_BRANCHES,
    Permission.MANAGE_AGENTS,
    Permission.IMPORT_DATA,
    Permission.EXPORT_DATA,
    Permission.BULK_OPERATIONS,
    Permission.MANAGE_BRANCH_USERS,
    Permission.VIEW_BRANCH_ANALYTICS,
    Permission.MANAGE_BRANCH_AGENTS,
  ],

  [UserRole.ADMIN]: [
    // System-wide access - can see ALL data across all branches
    Permission.MANAGE_USERS,
    Permission.VIEW_USERS,
    Permission.ASSIGN_ROLES,
    Permission.CREATE_MEDIA_REPORTS,
    Permission.VIEW_MEDIA_REPORTS,
    Permission.EDIT_MEDIA_REPORTS,
    Permission.DELETE_MEDIA_REPORTS,
    Permission.VIEW_ALL_MEDIA_REPORTS,
    Permission.CREATE_SALES_REPORTS,
    Permission.VIEW_SALES_REPORTS,
    Permission.EDIT_SALES_REPORTS,
    Permission.DELETE_SALES_REPORTS,
    Permission.VIEW_ALL_SALES_REPORTS,
    Permission.VIEW_ANALYTICS,
    Permission.VIEW_DETAILED_ANALYTICS,
    Permission.VIEW_FINANCIAL_METRICS,
    Permission.EXPORT_ANALYTICS,
    Permission.VIEW_ALL_BRANCHES_ANALYTICS,
    Permission.VIEW_AUDIT_LOGS,
    Permission.MANAGE_AGENTS,
    Permission.IMPORT_DATA,
    Permission.EXPORT_DATA,
    Permission.BULK_OPERATIONS,
  ],

  [UserRole.BRANCH_MANAGER]: [
    // Branch manager - can see all data within their branch
    Permission.CREATE_MEDIA_REPORTS,
    Permission.VIEW_MEDIA_REPORTS,
    Permission.EDIT_MEDIA_REPORTS,
    Permission.DELETE_MEDIA_REPORTS,
    Permission.CREATE_SALES_REPORTS,
    Permission.VIEW_SALES_REPORTS,
    Permission.EDIT_SALES_REPORTS,
    Permission.DELETE_SALES_REPORTS,
    Permission.VIEW_ANALYTICS,
    Permission.VIEW_DETAILED_ANALYTICS,
    Permission.EXPORT_ANALYTICS,
    Permission.VIEW_BRANCH_ANALYTICS,
    Permission.MANAGE_BRANCH_USERS,
    Permission.MANAGE_BRANCH_AGENTS,
    Permission.EXPORT_DATA,
  ],

  [UserRole.MEDIA_BUYER]: [
    // Media buyer - can only see their own created reports
    Permission.CREATE_MEDIA_REPORTS,
    Permission.VIEW_MEDIA_REPORTS, // Limited to own reports
    Permission.EDIT_MEDIA_REPORTS, // Limited to own reports
    Permission.CREATE_SALES_REPORTS,
    Permission.VIEW_SALES_REPORTS, // Limited to own reports
    Permission.EDIT_SALES_REPORTS, // Limited to own reports
    Permission.VIEW_ANALYTICS, // Limited to own data
    Permission.EXPORT_DATA, // Limited to own data
  ],

  [UserRole.SALES_AGENT]: [
    // Sales agent - limited to sales reports
    Permission.CREATE_SALES_REPORTS,
    Permission.VIEW_SALES_REPORTS, // Limited to own reports
    Permission.EDIT_SALES_REPORTS, // Limited to own reports
    Permission.VIEW_ANALYTICS, // Limited to own performance
  ],

  [UserRole.ANALYST]: [
    // Analyst - read-only access to analytics
    Permission.VIEW_MEDIA_REPORTS,
    Permission.VIEW_SALES_REPORTS,
    Permission.VIEW_ANALYTICS,
    Permission.VIEW_DETAILED_ANALYTICS,
    Permission.VIEW_FINANCIAL_METRICS,
    Permission.EXPORT_ANALYTICS,
    Permission.EXPORT_DATA,
  ],

  [UserRole.VIEWER]: [
    // Viewer - minimal read-only access
    Permission.VIEW_ANALYTICS,
  ],
};

// Helper functions
export class PermissionService {
  static getUserPermissions(role: UserRole): Permission[] {
    return ROLE_PERMISSIONS[role] || [];
  }

  static hasPermission(userPermissions: Permission[], required: Permission): boolean {
    return userPermissions.includes(required);
  }

  static hasAnyPermission(userPermissions: Permission[], required: Permission[]): boolean {
    return required.some(permission => userPermissions.includes(permission));
  }

  static hasAllPermissions(userPermissions: Permission[], required: Permission[]): boolean {
    return required.every(permission => userPermissions.includes(permission));
  }

  static canAccessBranch(user: UserProfile, branchId: string): boolean {
    // Super admin can access all branches
    if (user.role === UserRole.SUPER_ADMIN) return true;

    // Admin can access all branches
    if (user.role === UserRole.ADMIN) return true;

    // Branch-specific users can only access their branch
    return user.branchId === branchId;
  }

  static canViewUserData(viewer: UserProfile, target: UserProfile): boolean {
    // Super admin can view all users
    if (viewer.role === UserRole.SUPER_ADMIN) return true;

    // Admin can view all users
    if (viewer.role === UserRole.ADMIN) return true;

    // Branch managers can view users in their branch
    if (viewer.role === UserRole.BRANCH_MANAGER) {
      return viewer.branchId === target.branchId;
    }

    // Users can view their own data
    return viewer.id === target.id;
  }

  static canManageUser(manager: UserProfile, target: UserProfile): boolean {
    // Super admin can manage all users
    if (manager.role === UserRole.SUPER_ADMIN) return true;

    // Branch managers can manage users in their branch (except other branch managers)
    if (manager.role === UserRole.BRANCH_MANAGER) {
      return manager.branchId === target.branchId &&
        target.role !== UserRole.SUPER_ADMIN &&
        target.role !== UserRole.ADMIN &&
        target.role !== UserRole.BRANCH_MANAGER;
    }

    return false;
  }

  static getDataFilters(user: UserProfile): {
    branchFilter?: string;
    agentFilter?: string;
    restrictToOwn: boolean;
  } {
    console.log('PermissionService.getDataFilters - User role:', user.role, 'Type:', typeof user.role);
    console.log('PermissionService.getDataFilters - UserRole.MEDIA_BUYER:', UserRole.MEDIA_BUYER);
    console.log('PermissionService.getDataFilters - Comparison:', user.role === UserRole.MEDIA_BUYER);

    switch (user.role) {
      case UserRole.SUPER_ADMIN:
      case UserRole.ADMIN:
        // Admin can see ALL data across all branches
        return { restrictToOwn: false };

      case UserRole.BRANCH_MANAGER:
        // Branch manager can see all data within their branch
        return {
          branchFilter: user.branchId,
          restrictToOwn: false
        };

      case UserRole.MEDIA_BUYER:
        console.log('PermissionService.getDataFilters - MEDIA_BUYER case matched!');
        console.log('PermissionService.getDataFilters - User branchId:', user.branchId);

        // Media buyer can only see their own created reports
        // This applies whether they have a branch or not
        return {
          restrictToOwn: true // Only their own reports
        };

      default:
        return { restrictToOwn: true };
    }
  }

  static validateRoleAssignment(
    assigner: UserProfile,
    targetRole: UserRole,
    targetBranchId?: string
  ): { valid: boolean; reason?: string } {
    // Super admin can assign any role
    if (assigner.role === UserRole.SUPER_ADMIN) {
      return { valid: true };
    }

    // Admin can assign MEDIA_BUYER role
    if (assigner.role === UserRole.ADMIN) {
      const allowedRoles = [UserRole.MEDIA_BUYER];

      if (!allowedRoles.includes(targetRole)) {
        return {
          valid: false,
          reason: 'Admin can only assign Media Buyer role'
        };
      }

      // Media buyers should not have branch assignment
      if (targetRole === UserRole.MEDIA_BUYER && targetBranchId) {
        return {
          valid: false,
          reason: 'Media buyers should not be assigned to specific branches'
        };
      }

      return { valid: true };
    }

    return {
      valid: false,
      reason: 'Insufficient permissions to assign roles'
    };
  }
}

// Audit logging interface
export interface AuditLog {
  id: string;
  userId: string;
  userEmail: string;
  action: string;
  resource: string;
  resourceId?: string;
  details: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
  branchId?: string;
}

export enum AuditAction {
  USER_LOGIN = 'user_login',
  USER_LOGOUT = 'user_logout',
  USER_CREATED = 'user_created',
  USER_UPDATED = 'user_updated',
  USER_DELETED = 'user_deleted',
  USER_ROLE_CHANGED = 'user_role_changed',
  MEDIA_REPORT_CREATED = 'media_report_created',
  MEDIA_REPORT_UPDATED = 'media_report_updated',
  MEDIA_REPORT_DELETED = 'media_report_deleted',
  SALES_REPORT_CREATED = 'sales_report_created',
  SALES_REPORT_UPDATED = 'sales_report_updated',
  SALES_REPORT_DELETED = 'sales_report_deleted',
  ANALYTICS_VIEWED = 'analytics_viewed',
  DATA_EXPORTED = 'data_exported',
  SYSTEM_SETTINGS_CHANGED = 'system_settings_changed',
  PERMISSION_DENIED = 'permission_denied',
}

export default PermissionService;