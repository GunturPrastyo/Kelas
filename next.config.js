/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      // Izin untuk avatar dari Google
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        port: '',
        pathname: '/**',
      },
      // Izin untuk gambar yang di-upload dari backend
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '5000',
        pathname: '/uploads/**',
      },
      // Izin untuk avatar inisial dari ui-avatars.com
      {
        protocol: 'https',
        hostname: 'ui-avatars.com',
        port: '',
        pathname: '/api/**',
      },
      // Izin untuk avatar placeholder dari pravatar.cc
      {
        protocol: "https",
        hostname: "i.pravatar.cc",
      },
      // Izin untuk ikon dari icons8.com
      {
        protocol: 'https',
        hostname: 'img.icons8.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

module.exports = nextConfig;