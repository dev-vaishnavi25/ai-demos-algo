/** @type {import('next').NextConfig} */
const nextConfig = {
  // Transformers.js ships optional Node-only backends (sharp, onnxruntime-node).
  // We run models in the browser via a Web Worker, so stub these out of the bundle.
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      sharp$: false,
      'onnxruntime-node$': false,
    };
    return config;
  },
};

export default nextConfig;
