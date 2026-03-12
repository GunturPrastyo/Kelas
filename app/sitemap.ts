import { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Ganti dengan URL produksi Anda jika berbeda
  const baseUrl = 'https://kelas-smk.vercel.app';

  // 1. Halaman statis (Hanya halaman publik yang bisa diakses tanpa login)
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 1,
    }
  ];
  
  return staticRoutes;
}