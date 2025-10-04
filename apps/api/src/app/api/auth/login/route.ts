import { NextRequest, NextResponse } from 'next/server'
import { createFinMatterError, ValidationError } from '@finmatter/shared'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    // Validation
    if (!email || !password) {
      throw new ValidationError('Email and password are required', 'auth')
    }

    // TODO: Implement actual authentication logic
    // For now, return a mock response
    const mockResponse = {
      user: {
        id: '1',
        email: email,
        firstName: 'John',
        lastName: 'Doe',
        role: 'user',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      session: {
        id: 'session-1',
        userId: '1',
        token: 'mock-jwt-token',
        refreshToken: 'mock-refresh-token',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        createdAt: new Date(),
        lastUsedAt: new Date(),
      }
    }

    return NextResponse.json({
      success: true,
      data: mockResponse,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Login error:', error)
    
    if (error instanceof ValidationError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: error.message,
            field: error.field
          },
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Login failed'
        },
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}
