/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'images.samsung.com', // <— necesario para las URLs usadas arriba
      // agrega otros dominios si luego usas Cloudinary/Firebase/etc.
    ],
  },
};
export default nextConfig;
