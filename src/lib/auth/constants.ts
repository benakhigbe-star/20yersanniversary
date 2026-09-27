// Shared between server components/route handlers (guest.ts / admin.ts,
// which use next/headers) and middleware.ts (which uses NextRequest
// cookies directly and must NOT import next/headers).
export const GUEST_COOKIE_NAME = 'cp_guest_session';
export const ADMIN_COOKIE_NAME = 'cp_admin_session';
