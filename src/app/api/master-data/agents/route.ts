import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, requirePermissions } from '@/lib/auth/auth-middleware';
import { Permission } from '@/lib/auth/roles-permissions';
import { prisma } from '@/lib/database'

// GET /api/master-data/agents
export const GET = requireAuth(async (request: any) => {
  try {
    const { searchParams } = new URL(request.url)
    const branchId = searchParams.get('branchId')

    // Optimized query with selective field inclusion
    const agents = await prisma.salesAgent.findMany({
      where: branchId ? { branchId } : undefined,
      select: {
        id: true,
        agentNumber: true,
        name: true,
        branchId: true,
        isActive: true,
        createdAt: true,
        branch: {
          select: {
            id: true,
            name: true,
            code: true
          }
        },
        _count: {
          select: {
            mediaAgentData: true,
            salesReports: true
          }
        }
      },
      orderBy: [
        { branchId: 'asc' },
        { agentNumber: 'asc' }
      ]
    })

    const response = NextResponse.json({
      success: true,
      data: agents
    })

    // Add caching headers for performance
    response.headers.set('Cache-Control', 'public, max-age=300, s-maxage=600')
    response.headers.set('ETag', `agents-${Date.now()}`)
    
    return response
  } catch (error) {
    console.error('Error fetching agents:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch agents' },
      { status: 500 }
    )
  }
});

// POST /api/master-data/agents
export const POST = requirePermissions(Permission.MANAGE_BRANCHES)(async (request) => {
  try {
    const body = await request.json()
    const { agentNumber, name, branchId, isActive = true } = body

    // Validate required fields
    if (!agentNumber || !branchId) {
      return NextResponse.json(
        { success: false, error: 'Agent number and branch are required' },
        { status: 400 }
      )
    }

    // Check if agent number already exists
    const existingAgent = await prisma.salesAgent.findUnique({
      where: { agentNumber }
    })

    if (existingAgent) {
      return NextResponse.json(
        { success: false, error: 'Agent number already exists' },
        { status: 400 }
      )
    }

    // Verify branch exists
    const branch = await prisma.branch.findUnique({
      where: { id: branchId }
    })

    if (!branch) {
      return NextResponse.json(
        { success: false, error: 'Invalid branch selected' },
        { status: 400 }
      )
    }

    // Create new agent
    const agent = await prisma.salesAgent.create({
      data: {
        agentNumber,
        name: name || `Agent ${agentNumber}`,
        branchId,
        isActive,
        updated_at: new Date()
      },
      include: {
        branch: true
      }
    })

    return NextResponse.json({
      success: true,
      data: agent
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating agent:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create agent' },
      { status: 500 }
    )
  }
});

// PUT /api/master-data/agents
export const PUT = requirePermissions(Permission.MANAGE_BRANCHES)(async (request) => {
  try {
    const body = await request.json()
    const { id, agentNumber, name, branchId, isActive } = body

    // Validate required fields
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Agent ID is required' },
        { status: 400 }
      )
    }

    // Check if agent exists
    const existingAgent = await prisma.salesAgent.findUnique({
      where: { id }
    })

    if (!existingAgent) {
      return NextResponse.json(
        { success: false, error: 'Agent not found' },
        { status: 404 }
      )
    }

    // Check if new agent number conflicts
    if (agentNumber && agentNumber !== existingAgent.agentNumber) {
      const numberConflict = await prisma.salesAgent.findUnique({
        where: { agentNumber }
      })

      if (numberConflict) {
        return NextResponse.json(
          { success: false, error: 'Agent number already exists' },
          { status: 400 }
        )
      }
    }

    // Verify branch exists if changing
    if (branchId && branchId !== existingAgent.branchId) {
      const branch = await prisma.branch.findUnique({
        where: { id: branchId }
      })

      if (!branch) {
        return NextResponse.json(
          { success: false, error: 'Invalid branch selected' },
          { status: 400 }
        )
      }
    }

    // Update agent
    const updatedAgent = await prisma.salesAgent.update({
      where: { id },
      data: {
        ...(agentNumber && { agentNumber }),
        ...(name && { name }),
        ...(branchId && { branchId }),
        ...(typeof isActive === 'boolean' && { isActive }),
        updated_at: new Date()
      },
      include: {
        branch: true
      }
    })

    return NextResponse.json({
      success: true,
      data: updatedAgent
    })
  } catch (error) {
    console.error('Error updating agent:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update agent' },
      { status: 500 }
    )
  }
});

// DELETE /api/master-data/agents
export const DELETE = requirePermissions(Permission.MANAGE_BRANCHES)(async (request) => {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Agent ID is required' },
        { status: 400 }
      )
    }

    // Check if agent has dependencies
    const agent = await prisma.salesAgent.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            mediaAgentData: true,
            salesReports: true
          }
        }
      }
    })

    if (!agent) {
      return NextResponse.json(
        { success: false, error: 'Agent not found' },
        { status: 404 }
      )
    }

    // Check for dependencies
    const hasData = 
      agent._count.mediaAgentData > 0 ||
      agent._count.salesReports > 0

    if (hasData) {
      // Soft delete - mark as inactive
      await prisma.salesAgent.update({
        where: { id },
        data: { 
          isActive: false,
          updated_at: new Date()
        }
      })

      return NextResponse.json({
        success: true,
        message: 'Agent marked as inactive (has existing data)'
      })
    } else {
      // Hard delete - no dependencies
      await prisma.salesAgent.delete({
        where: { id }
      })

      return NextResponse.json({
        success: true,
        message: 'Agent deleted successfully'
      })
    }
  } catch (error) {
    console.error('Error deleting agent:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete agent' },
      { status: 500 }
    )
  }
});