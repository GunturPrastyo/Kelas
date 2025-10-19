"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface Modul {
  _id: string;
  title: string;
  overview: string;
}

export default function ManajemenTestPage() {
  const [modules, setModules] = useState<Modul[]>([]);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/modul`)
      .then(res => res.json())
      .then(data => setModules(data));
  }, []);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Manajemen Test</h1>
        <Button className="bg-blue-600 text-white">+ Tambah Pre Test</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {modules.map((modul) => (
          <Link key={modul._id} href={`/admin/manajemen-test/${modul._id}`}>
            <div className="border rounded-xl p-4 hover:shadow-md cursor-pointer transition">
              <h2 className="font-semibold">{modul.title}</h2>
              <p className="text-sm text-gray-500 mt-2">{modul.overview}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
