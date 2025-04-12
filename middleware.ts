import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isProtectedRoute = createRouteMatcher(["/dashboard(.*)", "/posts(.*)"]);

const isPublicRoute = createRouteMatcher([
  '/', // Allow homepage access
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/payments(.*)' // <--- Add your webhook route here
]);

export default clerkMiddleware((auth, req) => {
  if (!isPublicRoute(req)) {
    if (isProtectedRoute(req)) {
        auth().protect();
    }
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
