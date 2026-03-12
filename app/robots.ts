import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://kelas-smk.vercel.app';

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/api/',       
        '/admin/',     
        '/modul/',     
        '/pre-test/', 
        '/analitik-belajar/',
        '/dashboard/',
        '/profil/',
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}