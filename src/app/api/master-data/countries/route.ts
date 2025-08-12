import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, requirePermissions } from '@/lib/auth/auth-middleware';
import { Permission } from '@/lib/auth/roles-permissions';
import { prisma } from '@/lib/database'

// GET /api/master-data/countries
export const GET = requireAuth(async (request: any) => {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // 'target' or 'destination'

    if (type === 'target') {
      const countries = await prisma.targetCountry.findMany({
        include: {
          _count: {
            select: {
              mediaCountryData: true,
              salesCountryData: true
            }
          }
        },
        orderBy: { name: 'asc' }
      })

      return NextResponse.json({
        success: true,
        data: countries
      })
    } else if (type === 'destination') {
      const countries = await prisma.destinationCountry.findMany({
        include: {
          _count: {
            select: {
              campaignDetails: true,
              dealDestinations: true
            }
          }
        },
        orderBy: { name: 'asc' }
      })

      return NextResponse.json({
        success: true,
        data: countries
      })
    } else {
      // Return both types
      const [targetCountries, destinationCountries] = await Promise.all([
        prisma.targetCountry.findMany({ orderBy: { name: 'asc' } }),
        prisma.destinationCountry.findMany({ orderBy: { name: 'asc' } })
      ])

      return NextResponse.json({
        success: true,
        data: {
          target: targetCountries,
          destination: destinationCountries
        }
      })
    }
  } catch (error) {
    console.error('Error fetching countries:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch countries' },
      { status: 500 }
    )
  }
});

// POST /api/master-data/countries
export const POST = requirePermissions(Permission.MANAGE_BRANCHES)(async (request) => {
  try {
    const body = await request.json()
    const { name, code, type } = body

    // Validate required fields
    if (!name || !code || !type) {
      return NextResponse.json(
        { success: false, error: 'Name, code, and type are required' },
        { status: 400 }
      )
    }

    if (!['target', 'destination'].includes(type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid country type' },
        { status: 400 }
      )
    }

    if (type === 'target') {
      // Check if code already exists
      const existing = await prisma.targetCountry.findUnique({
        where: { code }
      })

      if (existing) {
        return NextResponse.json(
          { success: false, error: 'Country code already exists' },
          { status: 400 }
        )
      }

      // Create target country
      const country = await prisma.targetCountry.create({
        data: {
          name,
          code,
          updated_at: new Date()
        }
      })

      return NextResponse.json({
        success: true,
        data: country
      }, { status: 201 })
    } else {
      // Check if code already exists
      const existing = await prisma.destinationCountry.findUnique({
        where: { code }
      })

      if (existing) {
        return NextResponse.json(
          { success: false, error: 'Country code already exists' },
          { status: 400 }
        )
      }

      // Create destination country
      const country = await prisma.destinationCountry.create({
        data: {
          name,
          code,
          updated_at: new Date()
        }
      })

      return NextResponse.json({
        success: true,
        data: country
      }, { status: 201 })
    }
  } catch (error) {
    console.error('Error creating country:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create country' },
      { status: 500 }
    )
  }
});

// PUT /api/master-data/countries
export const PUT = requirePermissions(Permission.MANAGE_BRANCHES)(async (request) => {
  try {
    const body = await request.json()
    const { id, name, code, type } = body

    // Validate required fields
    if (!id || !type) {
      return NextResponse.json(
        { success: false, error: 'ID and type are required' },
        { status: 400 }
      )
    }

    if (type === 'target') {
      // Check if country exists
      const existing = await prisma.targetCountry.findUnique({
        where: { id }
      })

      if (!existing) {
        return NextResponse.json(
          { success: false, error: 'Country not found' },
          { status: 404 }
        )
      }

      // Check code conflict
      if (code && code !== existing.code) {
        const codeConflict = await prisma.targetCountry.findUnique({
          where: { code }
        })

        if (codeConflict) {
          return NextResponse.json(
            { success: false, error: 'Country code already exists' },
            { status: 400 }
          )
        }
      }

      // Update country
      const updated = await prisma.targetCountry.update({
        where: { id },
        data: {
          ...(name && { name }),
          ...(code && { code }),
          updated_at: new Date()
        }
      })

      return NextResponse.json({
        success: true,
        data: updated
      })
    } else {
      // Check if country exists
      const existing = await prisma.destinationCountry.findUnique({
        where: { id }
      })

      if (!existing) {
        return NextResponse.json(
          { success: false, error: 'Country not found' },
          { status: 404 }
        )
      }

      // Check code conflict
      if (code && code !== existing.code) {
        const codeConflict = await prisma.destinationCountry.findUnique({
          where: { code }
        })

        if (codeConflict) {
          return NextResponse.json(
            { success: false, error: 'Country code already exists' },
            { status: 400 }
          )
        }
      }

      // Update country
      const updated = await prisma.destinationCountry.update({
        where: { id },
        data: {
          ...(name && { name }),
          ...(code && { code }),
          updated_at: new Date()
        }
      })

      return NextResponse.json({
        success: true,
        data: updated
      })
    }
  } catch (error) {
    console.error('Error updating country:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update country' },
      { status: 500 }
    )
  }
});

// DELETE /api/master-data/countries
export const DELETE = requirePermissions(Permission.MANAGE_BRANCHES)(async (request) => {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const type = searchParams.get('type')

    if (!id || !type) {
      return NextResponse.json(
        { success: false, error: 'ID and type are required' },
        { status: 400 }
      )
    }

    if (type === 'target') {
      // Check dependencies
      const country = await prisma.targetCountry.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              mediaCountryData: true,
              salesCountryData: true
            }
          }
        }
      })

      if (!country) {
        return NextResponse.json(
          { success: false, error: 'Country not found' },
          { status: 404 }
        )
      }

      const hasData = country._count.mediaCountryData > 0 || country._count.salesCountryData > 0

      if (hasData) {
        return NextResponse.json(
          { success: false, error: 'Cannot delete country with existing data' },
          { status: 400 }
        )
      }

      await prisma.targetCountry.delete({ where: { id } })
    } else {
      // Check dependencies
      const country = await prisma.destinationCountry.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              campaignDetails: true,
              dealDestinations: true
            }
          }
        }
      })

      if (!country) {
        return NextResponse.json(
          { success: false, error: 'Country not found' },
          { status: 404 }
        )
      }

      const hasData = country._count.campaignDetails > 0 || country._count.dealDestinations > 0

      if (hasData) {
        return NextResponse.json(
          { success: false, error: 'Cannot delete country with existing data' },
          { status: 400 }
        )
      }

      await prisma.destinationCountry.delete({ where: { id } })
    }

    return NextResponse.json({
      success: true,
      message: 'Country deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting country:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete country' },
      { status: 500 }
    )
  }
});