import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold">Selamat Datang</h1>
      <p className="mt-4">Halaman utama Anda.</p>
      <Link href="/login" className="mt-6 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
        Pergi ke Halaman Login
      </Link>
    </main>
  );
}
