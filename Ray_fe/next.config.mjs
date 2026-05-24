/** @type {import('next').NextConfig} */
const nextConfig = {
  // Don't fail the production build on TypeScript errors. Helpful during
  // active development; consider tightening this for long-term production.
  typescript: {
    ignoreBuildErrors: true,
  },

  // Use plain <img> output instead of the Next image optimizer. This is the
  // simplest path on cloud platforms that don't ship the sharp binary
  // (Vercel works either way, Railway/Render are happier with unoptimized).
  images: {
    unoptimized: true,
  },

  // Silences the "Cross origin request detected" / "Blocked cross-origin
  // request" warnings when accessing the dev server from another machine on
  // your LAN (mobile device, second laptop, VM). Next.js expects exact
  // hostnames or wildcard patterns — CIDR ranges do not work. Add additional
  // IPs here if your LAN uses a different subnet.
  allowedDevOrigins: [
    'localhost',
    '127.0.0.1',
    '10.50.74.201',
    '192.168.1.18',
    '*.local',
  ],
}

export default nextConfig
