import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database'
import { requirePermissions, requireAuth } from '@/lib/auth/auth-middleware'
import { Permission } from '@/lib/auth/roles-permissions'

// GET /api/master-data/branches - Admin only
export const GET = requireAuth(async (request: any) => {

  try {
    const branches = await prisma.branch.findMany({
      include: {
        _count: {
          select: {
            users: true,
            salesAgents: true,
            mediaReports: true,
            salesReports: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })

    const response = NextResponse.json({
      success: true,
      data: branches
    })

    // Add caching headers for performance
    response.headers.set('Cache-Control', 'public, max-age=600, s-maxage=1200')
    response.headers.set('ETag', `branches-${Date.now()}`)
    
    return response
  } catch (error) {
    console.error('Error fetching branches:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch branches' },
      { status: 500 }
    )
  }
})

// POST /api/master-data/branches - Admin only
export const POST = requirePermissions(Permission.MANAGE_BRANCHES)(async (request: any) => {

  try {
    const body = await request.json()
    const { name, code } = body

    // Validate required fields
    if (!name || !code) {
      return NextResponse.json(
        { success: false, error: 'Name and code are required' },
        { status: 400 }
      )
    }

    // Check if code already exists
    const existingBranch = await prisma.branch.findUnique({
      where: { code }
    })

    if (existingBranch) {
      return NextResponse.json(
        { success: false, error: 'Branch code already exists' },
        { status: 400 }
      )
    }

    // Create new branch
    const branch = await prisma.branch.create({
      data: {
        name,
        code,
        updated_at: new Date()
      }
    })

    // Log audit trail
    // TODO: Add audit logging when user authentication is implemented

    return NextResponse.json({
      success: true,
      data: branch
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating branch:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create branch' },
      { status: 500 }
    )
  }
})

// PUT /api/master-data/branches - Admin only
export const PUT = requirePermissions(Permission.MANAGE_BRANCHES)(async (request: any) => {

  try {
    const body = await request.json()
    const { id, name, code } = body

    // Validate required fields
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Branch ID is required' },
        { status: 400 }
      )
    }

    // Check if branch exists
    const existingBranch = await prisma.branch.findUnique({
      where: { id }
    })

    if (!existingBranch) {
      return NextResponse.json(
        { success: false, error: 'Branch not found' },
        { status: 404 }
      )
    }

    // Check if new code conflicts with another branch
    if (code && code !== existingBranch.code) {
      const codeConflict = await prisma.branch.findUnique({
        where: { code }
      })

      if (codeConflict) {
        return NextResponse.json(
          { success: false, error: 'Branch code already exists' },
          { status: 400 }
        )
      }
    }

    // Update branch
    const updatedBranch = await prisma.branch.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(code && { code }),
        updated_at: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      data: updatedBranch
    })
  } catch (error) {
    console.error('Error updating branch:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update branch' },
      { status: 500 }
    )
  }
})

// DELETE /api/master-data/branches - Admin only  
export const DELETE = requirePermissions(Permission.MANAGE_BRANCHES)(async (request: any) => {

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Branch ID is required' },
        { status: 400 }
      )
    }

    // Check if branch has dependencies
    const branch = await prisma.branch.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            users: true,
            salesAgents: true,
            mediaReports: true,
            salesReports: true
          }
        }
      }
    })

    if (!branch) {
      return NextResponse.json(
        { success: false, error: 'Branch not found' },
        { status: 404 }
      )
    }

    // Check for dependencies
    const hasData = 
      branch._count.users > 0 ||
      branch._count.salesAgents > 0 ||
      branch._count.mediaReports > 0 ||
      branch._count.salesReports > 0

    if (hasData) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Cannot delete branch with existing data. Please reassign or delete related records first.' 
        },
        { status: 400 }
      )
    }

    // Delete branch
    await prisma.branch.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Branch deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting branch:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete branch' },
      { status: 500 }
    )
  }
})