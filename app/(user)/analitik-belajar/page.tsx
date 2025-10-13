"use client"

import { useEffect, useRef } from "react"
import Image from "next/image"
import { Chart, registerables } from "chart.js"
Chart.register(...registerables)

export default function AnalitikBelajarPage() {
  const chartAktivitasRef = useRef<HTMLCanvasElement>(null)
  const chartNilaiRef = useRef<HTMLCanvasElement>(null)
  const chartPerbandinganRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    let chartAktivitasInstance: Chart | null = null
    let chartNilaiInstance: Chart | null = null
    let chartPerbandinganInstance: Chart | null = null
    
    // Aktivitas belajar
    if (chartAktivitasRef.current) {
      chartAktivitasInstance = new Chart(chartAktivitasRef.current, {
        type: "line",
        data: {
          labels: ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"],
          datasets: [
            {
              label: "Jam Belajar",
              data: [1.5, 2, 1, 2.5, 3, 2, 1.2],
              borderColor: "#2563eb",
              backgroundColor: "rgba(37,99,235,0.15)",
              fill: true,
              tension: 0.4,
              pointRadius: 5,
              pointBackgroundColor: "#2563eb",
            },
          ],
        },
        options: {
          plugins: { legend: { display: false } },
          scales: { 
            y: { 
              beginAtZero: true,
              ticks: {
                display: false
              }
            } 
          },
        },
      })
    }

    // Nilai per modul
    if (chartNilaiRef.current) {
      chartNilaiInstance = new Chart(chartNilaiRef.current, {
        type: "bar",
        data: {
          labels: ["Variabel", "Operator", "Kontrol", "Fungsi", "Array", "DOM"],
          datasets: [
            {
              data: [90, 80, 60, 72, 95, 0],
              backgroundColor: [
                "#3b82f6",
                "#06b6d4",
                "#f59e0b",
                "#a855f7",
                "#10b981",
                "#d1d5db",
              ],
              borderRadius: 8,
            },
          ],
        },
        options: {
          plugins: { legend: { display: false } },
          scales: { 
            y: { 
              beginAtZero: true, 
              max: 100,
              ticks: { display: false }
            } 
          },
        },
      })
    }

    // Perbandingan kelas
    if (chartPerbandinganRef.current) {
      chartPerbandinganInstance = new Chart(chartPerbandinganRef.current, {
        type: "radar",
        data: {
          labels: ["Variabel", "Kontrol", "Fungsi", "Array", "DOM", "Objek"],
          datasets: [
            {
              label: "Kamu",
              data: [90, 60, 72, 95, 80, 85],
              fill: true,
              backgroundColor: "rgba(59, 130, 246, 0.3)", // blue-500
              borderColor: "rgb(59, 130, 246)",
              pointBackgroundColor: "rgb(59, 130, 246)",
              pointBorderColor: "#fff",
              pointHoverBackgroundColor: "#fff",
              pointHoverBorderColor: "rgb(59, 130, 246)",
            },
            {
              label: "Rata-rata Kelas",
              data: [80, 65, 70, 85, 75, 75],
              fill: true,
              backgroundColor: "rgba(156, 163, 175, 0.3)", // gray-400
              borderColor: "rgb(156, 163, 175)",
              pointBackgroundColor: "rgb(156, 163, 175)",
              pointBorderColor: "#fff",
              pointHoverBackgroundColor: "#fff",
              pointHoverBorderColor: "rgb(156, 163, 175)",
            },
          ],
        },
        options: {
          scales: { 
            r: { 
              beginAtZero: true, 
              max: 100,
              ticks: { display: false }
            } 
          },
        },
      });
    }

    return () => {
      chartAktivitasInstance?.destroy()
      chartNilaiInstance?.destroy()
      chartPerbandinganInstance?.destroy()
    }
  }, [])

  return (
    <div className="space-y-10">
      {/* RINGKASAN */}
      <section>
        <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-3">Ringkasan Kemajuan</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Card 1 */}
          <div className="flex items-center gap-4 bg-gradient-to-r from-blue-400 to-indigo-500 dark:from-gray-700 dark:to-gray-800 text-white rounded-2xl p-5 shadow-md hover:scale-[1.02] transition-transform dark:shadow-lg dark:shadow-gray-800/40">
            <div className="flex-shrink-0">
              <Image
                src="/modules2.png"
                alt="Modul Icon"
                width={64}
                height={64}
                className="w-16 h-16 rounded-xl bg-white/20 p-2"
              />
            </div>
            <div>
              <p className="text-sm opacity-80">Modul Selesai</p>
              <h2 className="text-3xl font-bold mt-1">8 / 12</h2>
              <p className="text-sm mt-1">Kamu telah menyelesaikan 67%</p>
            </div>
          </div>

          {/* Card 2 */}
          <div className="flex items-center gap-4 bg-gradient-to-r from-green-400 to-emerald-500 dark:from-gray-700 dark:to-gray-800 text-white rounded-2xl p-5 shadow-md hover:scale-[1.02] transition-transform dark:shadow-lg dark:shadow-gray-800/40">
            <div className="flex-shrink-0">
              <Image src="/star.png" alt="Score Icon" width={64} height={64} className="w-16 h-16 rounded-xl bg-white/20 p-2" />
            </div>
            <div>
              <p className="text-sm opacity-80">Rata-rata Nilai</p>
              <h2 className="text-3xl font-bold mt-1">86%</h2>
              <p className="text-sm mt-1">Lebih tinggi dari rata-rata kelas</p>
            </div>
          </div>

          {/* Card 3 */}
          <div className="flex items-center gap-4 bg-gradient-to-r from-purple-400 to-fuchsia-500 dark:from-gray-700 dark:to-gray-800 text-white rounded-2xl p-5 shadow-md hover:scale-[1.02] transition-transform dark:shadow-lg dark:shadow-gray-800/40">
            <div className="flex-shrink-0">
              <Image
                src="https://img.icons8.com/fluency/96/time.png"
                alt="Time Icon"
                width={64}
                height={64}
                className="w-16 h-16 rounded-xl bg-white/20 p-2"
              />
            </div>
            <div>
              <p className="text-sm opacity-80">Total Waktu Belajar</p>
              <h2 className="text-3xl font-bold mt-1">12 jam</h2>
              <p className="text-sm mt-1">Rata-rata 1.5 jam per sesi</p>
            </div>
          </div>

          {/* Card 4 */}
          <div className="flex items-center gap-4 bg-gradient-to-r from-orange-400 to-amber-500 dark:from-gray-700 dark:to-gray-800 text-white rounded-2xl p-5 shadow-md hover:scale-[1.02] transition-transform dark:shadow-lg dark:shadow-gray-800/40">
            <div className="flex-shrink-0">
              <Image src="/streak.png" alt="Streak Icon" width={64} height={64} className="w-16 h-16 rounded-xl bg-white/20 p-2" />
            </div>
            <div>
              <p className="text-sm opacity-80">Streak Harian</p>
              <h2 className="text-3xl font-bold mt-1">6 </h2>
              <p className="text-sm mt-1">Hari berturut-turut aktif</p>
            </div>
          </div>
        </div>
      </section>

      {/* GRAFIK */}
      <section className="grid lg:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md">
          <h3 className="font-semibold text-gray-700 dark:text-gray-200 mb-3">Aktivitas Mingguan</h3>
          <canvas ref={chartAktivitasRef}></canvas>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md">
          <h3 className="font-semibold text-gray-700 dark:text-gray-200 mb-3">Nilai per Modul</h3>
          <canvas ref={chartNilaiRef}></canvas>
        </div>
      </section>

      {/* TOPIK YANG PERLU DIPERKUAT */}
      <section className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md">
        <h3 className="font-semibold text-gray-700 dark:text-gray-200 mb-3">Topik yang Perlu Diperkuat</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-100 dark:bg-gray-700 text-sm text-gray-600 dark:text-gray-400">
              <tr>
                <th className="p-3">Topik</th>
                <th className="p-3">Nilai</th>
                <th className="p-3">Kesalahan Umum</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <td className="p-3 flex items-center gap-3">
                  <Image src="https://img.icons8.com/fluency/48/decision.png" width={24} height={24} className="w-6 h-6" alt="icon-topik" />
                  Struktur Kontrol
                </td>
                <td className="p-3">60%</td>
                <td className="p-3 text-gray-600 dark:text-gray-400">Kondisi if-else kompleks</td>
                <td className="p-3"><span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-1 rounded">Perlu review</span></td>
              </tr>
              <tr className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <td className="p-3 flex items-center gap-3">
                  <Image src="https://img.icons8.com/fluency/48/settings-3.png" width={24} height={24} className="w-6 h-6" alt="icon-topik" />
                  Fungsi & Parameter
                </td>
                <td className="p-3">72%</td>
                <td className="p-3 text-gray-600 dark:text-gray-400">Scope variabel</td>
                <td className="p-3"><span className="bg-orange-100 text-orange-700 text-xs px-2 py-1 rounded">Butuh latihan</span></td>
              </tr>
              <tr className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <td className="p-3 flex items-center gap-3">
                  <Image src="https://img.icons8.com/fluency/48/repeat.png" width={24} height={24} className="w-6 h-6" alt="icon-topik" />
                  Array & Looping
                </td>
                <td className="p-3">95%</td>
                <td className="p-3 text-gray-600 dark:text-gray-400">-</td>
                <td className="p-3"><span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded">Sudah bagus</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* PERBANDINGAN DENGAN KELAS */}
      <section className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md">
        <h3 className="font-semibold text-gray-700 dark:text-gray-200 mb-3">
          Perbandingan dengan Rata-rata Kelas
        </h3>
        <div className="flex flex-col md:flex-row gap-6 items-center">
          <div className="flex-1 w-full">
            <canvas ref={chartPerbandinganRef}></canvas>
          </div>
          <div className="flex-1 space-y-3 text-gray-700 dark:text-gray-300">
            <p>
              <strong>Kamu</strong> berada di peringkat <b>5 dari 30</b>{" "}
              peserta.
            </p>
            <p>
              Rata-rata nilai kamu <b>lebih tinggi 8%</b> dari rata-rata kelas.
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Terus pertahankan konsistensimu.
            </p>
          </div>
        </div>
      </section>

      {/* REKOMENDASI */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 dark:from-gray-800 dark:to-gray-900 text-white p-6 rounded-2xl shadow-lg dark:shadow-gray-900/40">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold tracking-wide">🎯 Rekomendasi Pembelajaran</h3>
          <span className="text-sm bg-white/20 px-3 py-1 rounded-full">Diperbarui hari ini</span>
        </div>

        <ul className="space-y-3">
          <li className="flex items-center gap-4 p-4 bg-white/10 rounded-xl hover:bg-white/20 transition-all">
            <Image src="https://img.icons8.com/fluency/96/restart.png" width={64} height={64} className="w-16 h-16 rounded-lg object-contain bg-white/20 p-1" alt="gambar modul" />
            <div>
              <p className="font-semibold">Ulangi <b>Modul 3 – Struktur Kontrol</b></p>
              <p className="text-sm text-blue-100">Nilai kamu masih <b>60%</b>. Fokus pada logika percabangan bersarang.</p>
            </div>
          </li>

          <li className="flex items-center gap-4 p-4 bg-white/10 rounded-xl hover:bg-white/20 transition-all">
            <Image src="https://img.icons8.com/fluency/96/books.png" width={64} height={64} className="w-16 h-16 rounded-lg object-contain bg-white/20 p-1" alt="gambar modul" />
            <div>
              <p className="font-semibold">Perdalam topik <b>Fungsi dan Scope</b></p>
              <p className="text-sm text-blue-100">Coba latihan tambahan untuk memahami ruang lingkup variabel dengan lebih baik.</p>
            </div>
          </li>

          <li className="flex items-center gap-4 p-4 bg-white/10 rounded-xl hover:bg-white/20 transition-all">
            <Image src="https://img.icons8.com/fluency/96/goal.png" width={64} height={64} className="w-16 h-16 rounded-lg object-contain bg-white/20 p-1" alt="gambar modul" />
            <div>
              <p className="font-semibold">Lanjutkan ke <b>Modul 9 – DOM Manipulation</b></p>
              <p className="text-sm text-blue-100">Kamu sudah siap melangkah ke tahap lanjutan tentang interaksi elemen web.</p>
            </div>
          </li>
        </ul>
      </section>
    </div>
  )
}