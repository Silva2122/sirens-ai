import type { NextConfig } from "next";

/**
 * Для GitHub Pages собираем статический экспорт в out/.
 * Сайт живёт в подпапке /sirens-ai, поэтому basePath приходит из переменной
 * окружения: при обычной разработке она пуста и ничего не меняется.
 */
const basePath = process.env.PAGES_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "export",
  trailingSlash: true,
  basePath,
  images: { unoptimized: true },
};

export default nextConfig;
