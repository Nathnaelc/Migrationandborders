/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.module.rules.push({
      test: /\.csv$/,
      loader: 'csv-loader',
      options: {
        dynamicTyping: true,
        header: true,
        skipEmptyLines: true
      }
    });
    return config;
  },
  experimental: {
    turbo: {
      rules: {
        '*.csv': ['csv-loader']
      }
    }
  }
};

export default nextConfig;