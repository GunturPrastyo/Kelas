"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";

interface Topik {
  _id: string;
  title: string;
  slug: string;
}

export default function ModulDetailPage() {
  const { modulId } = useParams();
  const [topiks, setTopiks] = useState<Topik[]>([]);
  const [modul, setModul] = useState<any>(null);

  useEffect(() => {
    async function fetchData() {
      const modulRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/modul/${modulId}`);
      const topikRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/topik?modulId=${modulId}`);
      setModul(await modulRes.json());
      setTopiks(await topikRes.json());
    }
    fetchData();
  }, [modulId]);

  return (
    <div className="p-6">
      <div className="flex justify-between mb-4">
        <h1 className="text-xl font-bold">{modul?.title}</h1>
        <Button className="bg-green-600 text-white">+ Tambah Post Test Modul</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {topiks.map((t) => (
          <Link key={t._id} href={`/admin/manajemen-test/${modulId}/${t._id}`}>
            <div className="border rounded-xl p-4 hover:shadow-md cursor-pointer">
              <h2 className="font-medium">{t.title}</h2>
              <p className="text-sm text-gray-500 mt-2">Tambah post test untuk topik ini</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
