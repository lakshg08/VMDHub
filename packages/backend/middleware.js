import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': process.env.CORS_ORIGIN || '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'vmdhub-jwt-secret-change-me'
);

const PUBLIC_ROUTES = ['/api/auth/login', '/api/health'];
// All methods blocked for staff
const ADMIN_ALL_PREFIXES = ['/api/pl', '/api/gst'];
// Only write methods blocked for staff (GET allowed so staff can use vendor dropdowns)
const ADMIN_WRITE_PREFIXES = ['/api/vendors'];

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  if (request.method === 'OPTIONS') {
    return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
  }

  if (PUBLIC_ROUTES.includes(pathname)) {
    const response = NextResponse.next();
    Object.entries(CORS_HEADERS).forEach(([k, v]) => response.headers.set(k, v));
    return response;
  }

  const auth = request.headers.get('authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: CORS_HEADERS });
  }

  let payload;
  try {
    const result = await jwtVerify(token, SECRET);
    payload = result.payload;
  } catch {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401, headers: CORS_HEADERS });
  }

  const isAdminOnly =
    ADMIN_ALL_PREFIXES.some(prefix => pathname.startsWith(prefix)) ||
    (ADMIN_WRITE_PREFIXES.some(prefix => pathname.startsWith(prefix)) && request.method !== 'GET');
  if (isAdminOnly && payload.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403, headers: CORS_HEADERS });
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-user-role', payload.role);
  requestHeaders.set('x-user-id', String(payload.id));

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  Object.entries(CORS_HEADERS).forEach(([k, v]) => response.headers.set(k, v));
  return response;
}

export const config = {
  matcher: '/api/:path*',
};
