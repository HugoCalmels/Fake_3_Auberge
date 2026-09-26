import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";
const apiOrigin = new URL(
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001",
).origin;

// Sources autorisées : le site, l'API, Stripe (paiement) et Google Maps (carte).
// Active aussi en dev pour que les tests e2e détectent un oubli avant la prod.
const contentSecurityPolicy = [
  "default-src 'self'",
  // 'unsafe-inline' : scripts d'hydratation Next ; 'unsafe-eval' : dev uniquement (HMR)
  `script-src 'self' 'unsafe-inline' https://js.stripe.com${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: ${apiOrigin} https://*.stripe.com https://*.googleapis.com https://*.gstatic.com https://*.google.com`,
  "font-src 'self' data:",
  `connect-src 'self' ${apiOrigin} https://api.stripe.com https://*.stripe.com${isDev ? " ws: wss:" : ""}`,
  "frame-src https://js.stripe.com https://hooks.stripe.com https://www.google.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(self \"https://js.stripe.com\")",
  },
];

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
