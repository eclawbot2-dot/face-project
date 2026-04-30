import { NextRequest, NextResponse } from "next/server";

// Security headers applied to every response. CSP is intentionally permissive
// for inline styles (Next.js dev + tailwind) but blocks third-party script
// origins and frame embedding.
const securityHeaders: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
  "X-DNS-Prefetch-Control": "off",
  "Content-Security-Policy": [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    "connect-src 'self' https:",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; "),
};

export function middleware(req: NextRequest) {
  const res = NextResponse.next();
  for (const [k, v] of Object.entries(securityHeaders)) {
    res.headers.set(k, v);
  }
  return res;
}

export const config = {
  matcher: [
    // Apply to everything except static asset paths.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff2?)$).*)",
  ],
};
