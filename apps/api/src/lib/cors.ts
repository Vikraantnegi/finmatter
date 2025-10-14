import { NextResponse } from 'next/server';

// Get allowed origins from environment or default to localhost for development
const getAllowedOrigins = () => {
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
    'http://localhost:3001',
    'http://localhost:3000',
    'http://127.0.0.1:3001',
    'http://127.0.0.1:3000',
  ];

  // Add production origins if in production
  if (process.env.NODE_ENV === 'production') {
    allowedOrigins.push(
      'https://finmatter.vercel.app',
      'https://www.finmatter.vercel.app',
    );
  }

  return allowedOrigins;
};

export function createCorsResponse(
  data: any,
  options: {
    status?: number;
    headers?: Record<string, string>;
    origin?: string;
  } = {},
) {
  const allowedOrigins = getAllowedOrigins();
  const allowedOrigin =
    options.origin && allowedOrigins.includes(options.origin)
      ? options.origin
      : allowedOrigins[0];

  const response = NextResponse.json(data, {
    status: options.status || 200,
    headers: {
      'Access-Control-Allow-Origin': allowedOrigin,
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers':
        'Content-Type, Authorization, Origin, X-Requested-With, Accept',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Max-Age': '86400',
      ...options.headers,
    },
  });

  return response;
}

export function handleCorsPreflight(origin?: string) {
  const allowedOrigins = getAllowedOrigins();
  const allowedOrigin =
    origin && allowedOrigins.includes(origin) ? origin : allowedOrigins[0];

  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': allowedOrigin,
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers':
        'Content-Type, Authorization, Origin, X-Requested-With, Accept',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Max-Age': '86400',
    },
  });
}
