import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import createMiddleware from "next-intl/middleware";
import { NextResponse } from "next/server";

const locales = ["en", "ja"] as const;

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

const isRedirectToDashboardRoute = createRouteMatcher([
  "/:locale",
  "/:locale/converter",
  "/:locale/signin(.*)",
  "/:locale/signup(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  const { pathname } = req.nextUrl;
  const { isAuthenticated } = await auth();

  if (isAuthenticated && isRedirectToDashboardRoute(req)) {
    return NextResponse.redirect(
      new URL(`/${pathname.split("/")[1]}/dashboard`, req.url),
    );
  }
  // Never run next-intl on API/trpc routes
  if (pathname.startsWith("/api") || pathname.startsWith("/trpc")) {
    if (!isPublicRoute(req)) {
      await auth.protect();
    }
    return NextResponse.next();
  }

  // Run i18n only for page routes
  const intlResponse = handleI18n(req);

  // If next-intl wants to redirect page routes like / -> /en, let it
  if (intlResponse.headers.get("location")) {
    return intlResponse;
  }

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
