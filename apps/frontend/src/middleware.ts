import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routes that require Studio access
const STUDIO_ROUTES = [
  "/workflows",
  "/admin",
  "/governance",
  "/compliance",
];

// Routes that Business users can access
// const BUSINESS_ROUTES = ["/dashboard", "/publications", "/executions"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip middleware for public routes
  if (pathname.startsWith("/api") || pathname.startsWith("/_next") || pathname === "/") {
    return NextResponse.next();
  }

  // Get user's interface access from cookie/session
  // For now, this is a placeholder - the actual implementation
  // would decode the JWT or check session
  const interfaceAccess = request.cookies.get("interfaceAccess")?.value || "studio";

  // If Business user tries to access Studio-only route
  if (interfaceAccess === "business") {
    for (const route of STUDIO_ROUTES) {
      if (pathname.startsWith(route)) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
