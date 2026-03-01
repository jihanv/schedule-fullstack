import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse, type NextRequest } from "next/server";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const locales = ["en", "ja"] as const;
type Locale = (typeof locales)[number];
const defaultLocale: Locale = "en";

// next-intl uses a cookie called NEXT_LOCALE to remember user choice :contentReference[oaicite:1]{index=1}
const LOCALE_COOKIE = "NEXT_LOCALE";

function detectLocale(req: NextRequest): Locale {
  // 1) cookie (user preference)
  const cookieLocale = req.cookies.get(LOCALE_COOKIE)?.value;
  if (cookieLocale === "en" || cookieLocale === "ja") return cookieLocale;

  // 2) Accept-Language header (first visit)
  const accept = req.headers.get("accept-language") || "";
  if (accept.toLowerCase().includes("ja")) return "ja";

  // 3) fallback
  return defaultLocale;
}

// IMPORTANT: auth pages are public, now locale-prefixed
const isPublicRoute = createRouteMatcher([
  "/:locale",
  "/:locale/",
  "/:locale/signin(.*)",
  "/:locale/signup(.*)",
  "/api/webhooks/clerk",
  "/api/holidays(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  const { pathname } = req.nextUrl;

  if (pathname === "/") {
    const locale = detectLocale(req);
    return NextResponse.redirect(new URL(`/${locale}`, req.url));
  }

  // Optional: if someone hits "/signin" or "/signup" without locale, redirect them
  if (pathname === "/signin" || pathname === "/signup") {
    const locale = detectLocale(req);
    return NextResponse.redirect(new URL(`/${locale}${pathname}`, req.url));
  }

  // Protect everything except public routes
  if (!isPublicRoute(req)) {
    const locale = detectLocale(req);
    await auth.protect({
      unauthenticatedUrl: new URL(`/${locale}/signin`, req.url).toString(),
    });
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
