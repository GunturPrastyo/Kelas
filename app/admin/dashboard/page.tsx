import Image from "next/image"
import Link from "next/link"
import ModuleList from "@/components/ModuleList"

export default function DashboardPage() {
  return (
    <>
      {/* Overview */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">

        {/* Progres Belajar */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-gray-900 dark:to-gray-800 p-4 sm:p-5 rounded-xl shadow flex flex-row flex-wrap items-center justify-between gap-4">
          {/* Konten Teks */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-blue-600 rounded-lg w-10 h-10 flex items-center justify-center">
                <Image src="/progress1.png" width={40} height={40} className="w-full h-full object-contain p-1" alt="" />
              </div>
              <h2 className="text-lg font-semibold">Progres Belajar</h2>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                <div className="bg-blue-500 h-3 rounded-full" style={{ width: '45%' }}></div>
              </div>
              <p className="text-sm font-medium text-blue-600 dark:text-blue-400 flex-shrink-0">45%</p>
            </div>
          </div>
          {/* Gambar */}
          <div className="flex-shrink-1">
            <Image src="/progress.png" alt="Progress Illustration" width={128} height={128} className="w-24 h-24 sm:w-32 sm:h-32 object-contain" />
          </div>
        </div>

        {/* Jam Belajar */}
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-gray-900 dark:to-gray-800 p-5 rounded-xl shadow flex flex-row flex-wrap items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-purple-600 rounded-lg w-10 h-10 flex items-center justify-center">
                <Image src="/clock2.png" width={40} height={40} className="w-full h-full object-contain p-1" alt="" />
              </div>
              <h2 className="text-lg font-semibold">Jam Belajar</h2>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-purple-700 dark:text-purple-400">12 Jam</p>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Total waktu belajar hingga saat ini
            </p>
          </div>
          <div className="flex-shrink-1">
            <Image src="/clock.png" alt="Clock Illustration" width={128} height={128} className="w-24 h-24 sm:w-32 sm:h-32 object-contain" />
          </div>
        </div>

        {/* Rekomendasi */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-gray-900 dark:to-gray-800 p-5 rounded-xl shadow flex flex-col md:col-span-2 lg:col-span-1">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-green-600 rounded-lg w-10 h-10 flex items-center justify-center">
              <Image src="/target.png" width={40} height={40} className="w-full h-full object-contain p-1" alt="" />
            </div>
            <h2 className="text-lg font-semibold">Rekomendasi</h2>
          </div>

          {/* Konten di dalam card */}
          <div className="p-4 border border-green-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition max-w-2xl mx-auto w-full">
            <h3 className="font-medium text-green-700 dark:text-green-400">
              Mulai Modul: DOM Manipulation
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Berdasarkan hasil evaluasi, kamu siap ke materi berikutnya 🚀
            </p>
          </div>
        </div>
      </section>


      {/* Pre-Test + Analitik */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Pre-Test */}
        <div className="bg-gradient-to-r from-blue-50 via-indigo-100 to-indigo-200 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4 sm:p-6 rounded-xl shadow flex flex-wrap items-center gap-4 sm:gap-6">
          {/* Teks */}
          <div className="flex-1 text-left">
            <h2 className="text-lg sm:text-2xl font-semibold mb-3">Pre-Test Awal</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4 text-sm sm:text-base">
              Ikuti pre-test untuk memetakan level pengetahuanmu. <br />
              <span className="text-red-600 dark:text-red-400 font-medium">Hasil pre-test menentukan jalur belajar wajib.</span>
            </p>
            <Link href="/pre-test" className="inline-block px-4 sm:px-5 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition">
              Mulai Pre-Test
            </Link>
          </div>
          {/* Ilustrasi */}
          <div className="flex-shrink-0 max-w-full">
            <Image src="/pre-tes.png" alt="Quiz Illustration" width={160} height={160} className="w-20 h-20 sm:w-40 sm:h-40 object-contain" />
          </div>
        </div>

        {/* Analitik */}
        <div className="max-w-full bg-gradient-to-br from-indigo-200 via-purple-100 to-violet-300 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-6 rounded-xl shadow">
          <h2 className="text-xl font-semibold mb-6">Analitik Belajar</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
            {/* Modul Selesai */}
            <div className="p-4 rounded-lg shadow-lg bg-gradient-to-br from-blue-50 to-blue-100 dark:from-gray-700 dark:to-gray-800 shadow hover:shadow-md transition">
              <div className="flex flex-col items-center gap-2">
                <div className="bg-blue-600 rounded-full w-10 h-10 flex items-center justify-center">
                  <Image src="/book.png" width={40} height={40} className="w-full h-full object-contain p-1" alt="" />
                </div>
                <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">12</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">Modul Selesai</p>
              </div>
            </div>
            {/* Rata-rata Skor */}
            <div className="p-4 shadow-lg rounded-lg bg-gradient-to-br from-green-50 to-green-100 dark:from-gray-700 dark:to-gray-800 shadow hover:shadow-md transition">
              <div className="flex flex-col items-center gap-2">
                <div className="bg-green-600 rounded-full w-10 h-10 flex items-center justify-center">
                  <Image src="/score.png" width={40} height={40} className="w-full h-full object-contain p-1" alt="" />
                </div>
                <p className="text-2xl font-bold text-green-700 dark:text-green-400">78%</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">Rata-rata Skor</p>
              </div>
            </div>
            {/* Topik Terlemah */}
            <div className="max-w-full shadow-lg p-4 rounded-lg bg-gradient-to-br from-red-50 to-red-100 dark:from-gray-700 dark:to-gray-800 shadow hover:shadow-md transition">
              <div className="flex flex-col items-center gap-2 break-words">
                <div className="bg-red-600 rounded-full w-10 h-10 flex items-center justify-center">
                  <Image src="/thunder.png" width={40} height={40} className="w-full h-full object-contain p-1" alt="" />
                </div>
                <p className="text-md font-bold text-red-700 dark:text-red-400">DOM Manipulation</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">Topik Terlemah</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Learning Path */}
      <ModuleList />
    </>
  )
}