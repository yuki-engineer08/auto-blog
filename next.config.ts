import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },
};

async function buildContent(): Promise<NextConfig> {
  const isDev = process.argv.indexOf("dev") !== -1;
  const isBuild = process.argv.indexOf("build") !== -1;
  if (!process.env.VELITE_STARTED && (isDev || isBuild)) {
    process.env.VELITE_STARTED = "1";
    const { build } = await import("velite");
    await build({ watch: isDev, clean: !isDev });
  }
  return nextConfig;
}

export default buildContent();
