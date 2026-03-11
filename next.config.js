/** @type {import('next').NextConfig} */
const nextConfig = {
  // Bundle the data files so they are available on Vercel's serverless functions
  outputFileTracingIncludes: {
    "/api/students": ["./src/data/**/*"],
  },
};
module.exports = nextConfig;