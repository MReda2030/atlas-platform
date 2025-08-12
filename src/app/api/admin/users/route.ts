import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { requirePermissions, getClientIP, getUserAgent } from '@/lib/auth/auth-middleware';
import { Permission, UserRole } from '@/lib/auth/roles-permissions';
import { AuthService } from '@/lib/auth/auth-service';

const prisma = new PrismaClient();

// GET - List users with filtering and pagination
export const GET = requirePermissions([Permission.MANAGE_USERS, Permission.VIEW_USERS])(
  async (request) => {
    try {
      const currentUser = request.user!;
      const { searchParams } = new URL(request.url);

      // Parse query parameters
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '50');
      const search = searchParams.get('search') || '';
      const role = searchParams.get('role') || '';
      const branchId = searchParams.get('branchId') || '';
      const isActive = searchParams.get('isActive');

      // Build where clause based on user permissions
      const whereClause: any = {};

      // Apply search filter
      if (search) {
        whereClause.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ];
      }

      // Apply role filter
      if (role) {
        whereClause.role = role as UserRole;
      }

      // Apply branch filter
      if (branchId) {
        whereClause.branchId = branchId;
      }

      // Apply active status filter
      if (isActive !== null && isActive !== '') {
        whereClause.isActive = isActive === 'true';
      }

      // Apply access controls
      if (currentUser.role === UserRole.BRANCH_MANAGER) {
        whereClause.branchId = currentUser.branchId;
      }

      // Get users with pagination
      const [users, totalCount] = await Promise.all([
        prisma.user.findMany({
          where: whereClause,
          include: {
            branch: true,
          },
          orderBy: [
            { isActive: 'desc' },
            { createdAt: 'desc' }
          ],
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.user.count({ where: whereClause }),
      ]);

      // Format response
      const formattedUsers = users.map(user => ({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        branchId: user.branchId,
        branchName: user.branch?.name,
        agentNumber: user.agentNumber,
        isActive: user.isActive,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
        lastLoginAt: user.lastLoginAt?.toISOString(),
      }));

      // Get summary statistics
      const summary = {
        totalUsers: totalCount,
        activeUsers: await prisma.user.count({ 
          where: { ...whereClause, isActive: true } 
        }),
        inactiveUsers: await prisma.user.count({ 
          where: { ...whereClause, isActive: false } 
        }),
        roleDistribution: await prisma.user.groupBy({
          by: ['role'],
          where: whereClause,
          _count: { role: true },
        }),
      };

      return NextResponse.json({
        success: true,
        data: {
          users: formattedUsers,
          pagination: {
            page,
            limit,
            totalCount,
            totalPages: Math.ceil(totalCount / limit),
          },
          summary,
          filters: {
            search,
            role,
            branchId,
            isActive,
          },
        },
      });

    } catch (error) {
      console.error('Get users error:', error);
      return NextResponse.json(
        { message: 'Failed to fetch users' },
        { status: 500 }
      );
    }
  }
);

// POST - Create new user
export const POST = requirePermissions(Permission.MANAGE_USERS)(
  async (request) => {
    try {
      const currentUser = request.user!;
      const body = await request.json();

      const {
        email,
        password,
        name,
        role,
        branchId,
        agentNumber,
      } = body;

      // Validation
      if (!email || !password || !name || !role) {
        return NextResponse.json(
          { message: 'Email, password, name, and role are required' },
          { status: 400 }
        );
      }

      // Email format validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          { message: 'Invalid email format' },
          { status: 400 }
        );
      }

      // Password strength validation
      if (password.length < 8) {
        return NextResponse.json(
          { message: 'Password must be at least 8 characters long' },
          { status: 400 }
        );
      }

      // Role validation
      if (!Object.values(UserRole).includes(role)) {
        return NextResponse.json(
          { message: 'Invalid role specified' },
          { status: 400 }
        );
      }

      // Sales agent validation
      if (role === UserRole.SALES_AGENT) {
        if (!agentNumber) {
          return NextResponse.json(
            { message: 'Agent number is required for sales agents' },
            { status: 400 }
          );
        }

        // Check if agent number already exists
        const existingAgent = await prisma.user.findFirst({
          where: {
            agentNumber,
            role: UserRole.SALES_AGENT,
          },
        });

        if (existingAgent) {
          return NextResponse.json(
            { message: `Agent number ${agentNumber} is already assigned` },
            { status: 400 }
          );
        }
      }

      // Branch-specific roles validation
      const branchRequiredRoles = [
        UserRole.BRANCH_MANAGER,
        UserRole.MEDIA_BUYER,
        UserRole.SALES_AGENT,
        UserRole.ANALYST,
        UserRole.VIEWER,
      ];

      if (branchRequiredRoles.includes(role) && !branchId) {
        return NextResponse.json(
          { message: `Branch is required for ${role} role` },
          { status: 400 }
        );
      }

      // Get client information
      const ipAddress = getClientIP(request);
      const userAgent = getUserAgent(request);

      // Create user using AuthService
      const result = await AuthService.createUser(
        {
          email: email.toLowerCase().trim(),
          password,
          name: name.trim(),
          role,
          branchId,
          agentNumber,
          createdBy: currentUser.id,
        },
        ipAddress,
        userAgent
      );

      if (!result.success) {
        return NextResponse.json(
          { message: result.message },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        message: result.message,
        data: {
          user: result.user,
        },
      });

    } catch (error) {
      console.error('Create user error:', error);
      
      return NextResponse.json(
        { message: 'Failed to create user' },
        { status: 500 }
      );
    }
  }
);