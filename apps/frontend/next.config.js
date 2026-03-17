const path = require("path");
const { PHASE_DEVELOPMENT_SERVER } = require("next/constants");

module.exports = (phase) => {
  const isDevServer = phase === PHASE_DEVELOPMENT_SERVER;

  /** @type {import('next').NextConfig} */
  return {
    reactStrictMode: true,
    transpilePackages: ["@rex/types"],
    distDir: isDevServer ? ".next-dev" : ".next",
    outputFileTracingRoot: path.resolve(__dirname, "..", ".."),
  };
};
