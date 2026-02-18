import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import createIntlMiddleware from "next-intl/middleware";
import { NextResponse } from "next/server";
import { hasLocale } from "next-intl";

// ✅ adjust path if needed
import { routing } from "./i18n/routing";

// next-intl middleware
const handleI18nRouting = createIntlMiddleware(routing);

// IMPORTANT: if your routes are now under /en and /ja,
// your public routes should include the locale segment.
const isPublicRoute = createRouteMatcher([
  "/:locale/signin(.*)",
  "/:locale/signup(.*)",
  "/api/webhooks/clerk",
]);

export default clerkMiddleware(async (auth, req) => {
  const { pathname } = req.nextUrl;

  // Skip next-intl for API routes (but still let Clerk run)
  const isApi = pathname.startsWith("/api") || pathname.startsWith("/trpc");

  // Figure out locale from the URL so unauthenticated redirects go to the right language
  const firstSegment = pathname.split("/")[1]; // e.g. "en" in "/en/..."
  const locale = hasLocale(routing.locales, firstSegment)
    ? firstSegment
    : routing.defaultLocale;

  if (!isPublicRoute(req)) {
    await auth.protect({
      unauthenticatedUrl: new URL(`/${locale}/signin`, req.url).toString(),
    });
  }

  if (isApi) {
    return NextResponse.next();
  }

  // Run next-intl routing (redirects/rewrites/locale cookie)
  return handleI18nRouting(req);
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
