import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const prisma = new PrismaClient()

// Registration request schema
const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  role: z.enum(['ADMIN', 'MEDIA_BUYER'], 'Invalid role'),
  branchId: z.string().optional()
}).refine((data) => {
  // Media buyers should not have branchId
  if (data.role === 'MEDIA_BUYER' && data.branchId) {
    return false;
  }
  return true;
}, {
  message: "Media buyers should not be assigned to specific branches",
  path: ["branchId"]
})

// Helper function to verify SUPER_ADMIN access
async function verifySuperAdminAccess(request: NextRequest) {
  try {
    const userHeader = request.headers.get('x-user-data')
    if (!userHeader) {
      return null
    }

    const userData = JSON.parse(userHeader)
    
    const user = await prisma.user.findUnique({
      where: { id: userData.id }
    })

    if (!user || user.role !== 'SUPER_ADMIN') {
      return null
    }

    return user
  } catch (error) {
    console.error('Error verifying super admin access:', error)
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify SUPER_ADMIN access
    const adminUser = await verifySuperAdminAccess(request)
    if (!adminUser) {
      return NextResponse.json(
        { error: 'Super Administrator access required' },
        { status: 403 }
      )
    }

    const body = await request.json()
    
    // Validate request data
    const validatedData = registerSchema.parse(body)
    const { email, password, name, role, branchId } = validatedData

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      )
    }

    // For media buyers, branchId should be null
    let finalBranchId = null;
    
    if (role === 'ADMIN' && branchId) {
      // Verify branch exists for admin users
      const branch = await prisma.branch.findUnique({
        where: { id: branchId }
      })

      if (!branch) {
        return NextResponse.json(
          { error: 'Invalid branch ID' },
          { status: 400 }
        )
      }
      finalBranchId = branchId;
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12)

    // Create user using Prisma create method
    const newUser = await prisma.user.create({
      data: {
        email: email.toLowerCase().trim(),
        passwordHash,
        name,
        role: role as any,
        branchId: finalBranchId, // null for media buyers, branchId for admins
        isActive: true,
        createdBy: adminUser.id,
      },
      include: {
        branch: {
          select: {
            name: true,
            code: true
          }
        }
      }
    })

    return NextResponse.json({
      message: 'User registered successfully',
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        branchId: newUser.branchId,
        branch: newUser.branch
      }
    }, { status: 201 })

  } catch (error) {
    console.error('Registration error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Validation error',
          details: error.errors
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// GET endpoint to fetch branches for the registration form
export async function GET(request: NextRequest) {
  try {
    // Verify SUPER_ADMIN access
    const adminUser = await verifySuperAdminAccess(request)
    if (!adminUser) {
      return NextResponse.json(
        { error: 'Super Administrator access required' },
        { status: 403 }
      )
    }

    // Fetch all branches
    const branches = await prisma.branch.findMany({
      select: {
        id: true,
        name: true,
        code: true
      },
      orderBy: {
        name: 'asc'
      }
    })

    return NextResponse.json({ branches })

  } catch (error) {
    console.error('Error fetching branches:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}