import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, requirePermissions } from '@/lib/auth/auth-middleware';
import { Permission } from '@/lib/auth/roles-permissions';
import { prisma } from '@/lib/database'

// GET /api/master-data/platforms
export const GET = requireAuth(async (request: any) => {
  try {
    const platforms = await prisma.advertisingPlatform.findMany({
      include: {
        _count: {
          select: {
            campaignDetails: true
          }
        }
      },
      orderBy: { name: 'asc' }
    })

    return NextResponse.json({
      success: true,
      data: platforms
    })
  } catch (error) {
    console.error('Error fetching platforms:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch platforms' },
      { status: 500 }
    )
  }
});

// POST /api/master-data/platforms
export const POST = requirePermissions(Permission.MANAGE_BRANCHES)(async (request) => {
  try {
    const body = await request.json()
    const { name, code, isActive = true } = body

    // Validate required fields
    if (!name || !code) {
      return NextResponse.json(
        { success: false, error: 'Name and code are required' },
        { status: 400 }
      )
    }

    // Check if name already exists
    const existing = await prisma.advertisingPlatform.findUnique({
      where: { name }
    })

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Platform name already exists' },
        { status: 400 }
      )
    }

    // Create platform
    const platform = await prisma.advertisingPlatform.create({
      data: {
        name
      }
    })

    return NextResponse.json({
      success: true,
      data: platform
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating platform:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create platform' },
      { status: 500 }
    )
  }
});

// PUT /api/master-data/platforms
export const PUT = requirePermissions(Permission.MANAGE_BRANCHES)(async (request) => {
  try {
    const body = await request.json()
    const { id, name, code, isActive } = body

    // Validate required fields
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Platform ID is required' },
        { status: 400 }
      )
    }

    // Check if platform exists
    const existing = await prisma.advertisingPlatform.findUnique({
      where: { id }
    })

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Platform not found' },
        { status: 404 }
      )
    }

    // Check name conflict (only if changing)
    if (name && name !== existing.name) {
      const nameConflict = await prisma.advertisingPlatform.findUnique({
        where: { name }
      })

      if (nameConflict) {
        return NextResponse.json(
          { success: false, error: 'Platform name already exists' },
          { status: 400 }
        )
      }
    }

    // Update platform
    const updated = await prisma.advertisingPlatform.update({
      where: { id },
      data: {
        ...(name && { name })
      }
    })

    return NextResponse.json({
      success: true,
      data: updated
    })
  } catch (error) {
    console.error('Error updating platform:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update platform' },
      { status: 500 }
    )
  }
});

// DELETE /api/master-data/platforms
export const DELETE = requirePermissions(Permission.MANAGE_BRANCHES)(async (request) => {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Platform ID is required' },
        { status: 400 }
      )
    }

    // Check if platform has dependencies
    const platform = await prisma.advertisingPlatform.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            campaignDetails: true
          }
        }
      }
    })

    if (!platform) {
      return NextResponse.json(
        { success: false, error: 'Platform not found' },
        { status: 404 }
      )
    }

    // Check for dependencies
    if (platform._count.campaignDetails > 0) {
      // Soft delete - mark as inactive
      await prisma.advertisingPlatform.delete({
        where: { id }
      })

      return NextResponse.json({
        success: true,
        message: 'Platform marked as inactive (has existing campaigns)'
      })
    } else {
      // Hard delete - no dependencies
      await prisma.advertisingPlatform.delete({
        where: { id }
      })

      return NextResponse.json({
        success: true,
        message: 'Platform deleted successfully'
      })
    }
  } catch (error) {
    console.error('Error deleting platform:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete platform' },
      { status: 500 }
    )
  }
});