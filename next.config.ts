import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir: process.env.SANAD_BUILD_DIR || ".next",
  serverExternalPackages: ["@prisma/client", "prisma"],
};

export default nextConfig;
