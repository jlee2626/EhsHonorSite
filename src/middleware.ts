import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const CANONICAL_HOST = "ehs-honor-site.vercel.app";

export function middleware(req: NextRequest) {
  const host = req.headers.get("host");

  // Redirect any other Vercel domain to the canonical one
  if (
    host &&
    host.endsWith(".vercel.app") &&
    host !== CANONICAL_HOST
  ) {
    const url = req.nextUrl.clone();
    url.host = CANONICAL_HOST;
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/:path*",
};
