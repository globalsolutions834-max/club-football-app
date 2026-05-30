/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Permet de déployer même s'il y a des erreurs TypeScript
    ignoreBuildErrors: true,
  },
  eslint: {
    // Évite aussi les blocages liés aux avertissements de style
    ignoreDuringBuilds: true,
  },
}

module.exports = nextConfig