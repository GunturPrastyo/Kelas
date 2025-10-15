"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ModulCard from "@/components/ModulCard";

interface Modul {
  _id: string;
  title: string;
  icon?: string;
  category: string;
  overview: string;
  slug: string;
}

export default function ModulPage() {
  const [modules, setModules] = useState<Modul[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/modul`)
      .then((res) => res.json())
      .then((data) => {
        setModules(data);
        setLoading(false);
      })
      .catch(console.error);
  }, []);

  if (loading) return <p>Loading...</p>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Manajemen Modul</h1>
        <Link
          href="/admin/modul/tambah-modul"
          className="bg-blue-700 text-white px-4 py-2 rounded-lg hover:bg-blue-800"
        >
          + Tambah Modul
        </Link>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {modules.map((modul) => (
          <Link key={modul._id} href={`/admin/modul/${modul.slug}`}>
            <ModulCard modul={modul} />
          </Link>
        ))}
      </div>
    </div>
  );
}
