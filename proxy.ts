import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import createMiddleware from "next-intl/middleware";
// import { NextResponse, type NextRequest } from "next/server";

const locales = ["en", "ja"] as const;
// type Locale = (typeof locales)[number];

const handleI18n = createMiddleware({
  locales,
  defaultLocale: "en",
  localePrefix: "always",
});

const isPublicRoute = createRouteMatcher([
  "/:locale",
  "/:locale/converter",
  "/:locale/signin(.*)",
  "/:locale/signup(.*)",
  "/api/webhooks/clerk",
  "/api/holidays(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  // Let next-intl handle / -> /en, /converter -> /en/converter, etc.
  const intlResponse = handleI18n(req);

  // If next-intl wants to redirect to a locale-prefixed URL, do that first
  if (intlResponse.headers.get("location")) {
    return intlResponse;
  }

  // Now we're on the locale-prefixed route, so auth checks make sense
  if (!isPublicRoute(req)) {
    await auth.protect();
  }

  return intlResponse;
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
