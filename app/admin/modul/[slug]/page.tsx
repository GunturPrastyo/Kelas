"use client";

import Link from "next/link";
import TopicCard from "@/components/TopicCard";
import Breadcrumb from "@/components/Breadcrumb";

const topics = [
  { id: 1, title: "Variabel & Tipe Data", slug: "variabel-tipe-data" },
  { id: 2, title: "Operator dan Ekspresi", slug: "operator-ekspresi" },
];

interface Props {
  params: { slug: string };
}

export default function ModulDetail({ params }: Props) {
  const { slug } = params;
  return (
    <div className="p-6">
      <Breadcrumb
        paths={[
          { name: "Modul", href: "/admin/modul" },
          { name: slug.replace(/-/g, " "), href: `/admin/modul/${slug}` },
        ]}
      />
      <div className="flex justify-between items-center mt-4 mb-6">
        <h1 className="text-2xl font-bold">Topik di Modul: {slug.replace(/-/g, " ")}</h1>
        <Link href={`/admin/modul/${slug}/tambah-topik`}>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            + Tambah Topik
          </button>
        </Link>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {topics.map((topik) => (
          <TopicCard key={topik.id} topik={topik} modulSlug={slug} />
        ))}
      </div>
    </div>
  );
}
