"use client";

import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PlusCircle, Trash2, CheckCircle2, Edit3, Save, Settings2 } from "lucide-react";
import { authFetch } from "@/lib/authFetch";
import FeatureManager from "./FeatureManager";
import { Feature } from "./featureModal"; // Impor tipe Feature

// Impor TiptapEditor secara dinamis
const TiptapEditor = dynamic(() => import("@/components/TiptapEditor"), {
  ssr: false,
  loading: () => (
    <div className="p-4 border rounded-lg min-h-[50px] animate-pulse bg-gray-100 dark:bg-gray-700">
      Memuat editor...
    </div>
  ),
});

export interface FeatureWeight {
  featureId: string;
  weight: number;
}

interface Question {
  _id?: string;
  questionText: string;
  options: string[];
  answer: string;
  topikId?: string;
  // Tambahkan 'features' ke tipe Question
  features?: FeatureWeight[];
  durationPerQuestion?: number;
  subMateriId?: string;
}

interface SubMateri {
  _id: string;
  title: string;
}

interface Topik {
  _id: string;
  title: string;
}

interface TestFormProps {
  modulId?: string;
  topikId?: string;
  modulSlug?: string;
  topikSlug?: string;
  isEditing: boolean;
  initialQuestions?: Question[];
  initialDuration?: number;
  topics?: Topik[];
  subMateris?: SubMateri[];
  testType: "pre-test-global" | "post-test-modul" | "post-test-topik";
}

const emptyInitialQuestions: Question[] = [];

export default function TestForm({
  testType,
  modulId,
  topikId,
  modulSlug,
  topikSlug,
  isEditing,
  initialQuestions = emptyInitialQuestions,
  initialDuration = 60,
  topics = [],
  subMateris = [],
}: TestFormProps) {
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [durationPerQuestion, setDurationPerQuestion] = useState(initialDuration);
  const [fetching, setFetching] = useState(isEditing);
  const [availableFeatures, setAvailableFeatures] = useState<Feature[]>([]);

  // state untuk melacak editor opsi mana yang aktif
  const [activeOption, setActiveOption] = useState<{
    qIndex: number;
    oIndex: number | null;
  }>({ qIndex: -1, oIndex: null });

  useEffect(() => {
    if (isEditing) {
      // Pastikan setiap soal memiliki array 'features'
      const questionsWithFeatures = initialQuestions.map(q => ({ ...q, features: q.features || [] }));
      setQuestions(questionsWithFeatures);
      setDurationPerQuestion(initialDuration);
      setFetching(false);
    } else {
      setQuestions([{ questionText: "", options: [""], answer: "", topikId: "", features: [], durationPerQuestion: 60, subMateriId: "" }]);
    }
  }, [isEditing, initialQuestions, initialDuration]);

  // Efek untuk memuat fitur yang tersedia saat komponen dimuat
  useEffect(() => {
    const fetchAvailableFeatures = async () => {
      try {
        const res = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/features`);
        if (res.ok) {
          const data = await res.json();
          setAvailableFeatures(data);
        }
      } catch (error) {
        console.error("Gagal memuat fitur yang tersedia:", error);
      }
    };
    fetchAvailableFeatures();
  }, []);
  // Efek untuk menyinkronkan fitur pada setiap soal ketika daftar fitur yang tersedia berubah
  useEffect(() => {
    if (availableFeatures.length > 0) {
      setQuestions(currentQuestions =>
        currentQuestions.map(q => {
          const existingFeaturesMap = new Map(q.features?.map(f => [f.featureId, f.weight]));

          // Buat array fitur baru yang sinkron dengan availableFeatures
          const syncedFeatures: FeatureWeight[] = availableFeatures.map(availableFeature => ({
            featureId: availableFeature._id,
            weight: existingFeaturesMap.get(availableFeature._id) ?? 0, // Gunakan bobot yang ada atau default 0
          }));

          // (Opsional) Urutkan berdasarkan nama fitur untuk konsistensi tampilan
          syncedFeatures.sort((a, b) => {
            const nameA = availableFeatures.find(f => f._id === a.featureId)?.name || '';
            const nameB = availableFeatures.find(f => f._id === b.featureId)?.name || '';
            return nameA.localeCompare(nameB);
          });
          return { ...q, features: syncedFeatures };
        })
      );
    }
  }, [availableFeatures]);
  const handleAddQuestion = () => {
    setQuestions([...questions, { questionText: "", options: [""], answer: "", topikId: "", features: [], durationPerQuestion: 60, subMateriId: "" }]);
  };

  const handleRemoveQuestion = (index: number) => {
    const updated = [...questions];
    updated.splice(index, 1);
    setQuestions(updated);
  };

  const handleAddOption = (qIndex: number) => {
    const updated = [...questions];
    updated[qIndex].options.push("");
    setQuestions(updated);
  };

  const handleRemoveOption = (qIndex: number, oIndex: number) => {
    const updated = [...questions];
    updated[qIndex].options.splice(oIndex, 1);
    setQuestions(updated);
  };

  const handleChangeQuestion = (qIndex: number, value: string) => {
    const updated = [...questions];
    updated[qIndex].questionText = value;
    setQuestions(updated);
  };

  const handleChangeOption = (qIndex: number, oIndex: number, value: string) => {
    const updated = [...questions];
    updated[qIndex].options[oIndex] = value;
    setQuestions(updated);
  };

  const handleSelectAnswer = (qIndex: number, option: string) => {
    const updated = [...questions];
    updated[qIndex].answer = option;
    setQuestions(updated);
  };

  const handleWeightChange = (qIndex: number, featureId: string, weight: number) => {
    const updated = [...questions];
    const questionFeatures = updated[qIndex].features || [];
    const featureIndex = questionFeatures.findIndex(f => f.featureId === featureId);

    if (featureIndex !== -1) {
      updated[qIndex].features![featureIndex].weight = isNaN(weight) || weight < 0 ? 0 : weight;
    }
    setQuestions(updated);
  };

  const handleSubmit = async () => {
    setLoading(true);

    // Validasi sebelum mengirim
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.answer || q.answer.trim() === "") {
        alert(`Soal ${i + 1} belum memiliki jawaban yang benar. Silakan pilih salah satu opsi sebagai jawaban.`);
        setLoading(false);
        return;
      }
    }

    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    let endpoint = "";
    let method = "";
    // Pastikan setiap pertanyaan menyertakan semua field yang relevan
    const questionsWithDetails = questions.map(q => ({
      questionText: q.questionText,
      options: q.options,
      answer: q.answer,
      features: q.features || [], // Pastikan features dikirim
      topikId: q.topikId || null,
      durationPerQuestion: q.durationPerQuestion || 60,
      subMateriId: q.subMateriId || null
    }));
    let body: any = { questions: questionsWithDetails };

    if (testType === "pre-test-global") {
      endpoint = isEditing ? `/api/questions/pre-test` : `/api/questions`;
      method = isEditing ? "PUT" : "POST"; // Pre-test bisa jadi dibuat pertama kali
      body = { ...body, testType: "pre-test-global" };
    } else if (testType === "post-test-topik" && modulId && topikId) {
      endpoint = isEditing
        ? `/api/questions/post-test-topik/${modulId}/${topikId}`
        : `/api/questions/post-test-topik`;
      method = isEditing ? "PUT" : "POST";
      body = { ...body, modulId, topikId, testType: "post-test-topik" };
    } else if (testType === "post-test-modul" && modulId) {
      endpoint = isEditing
        ? `/api/questions/post-test-modul/${modulId}`
        : `/api/questions/post-test-modul`;
      method = isEditing ? "PUT" : "POST";
      body = { ...body, modulId, testType: "post-test-modul" };
    } else {
      alert("Konteks tes tidak valid. Pastikan semua ID (modul/topik) tersedia.");
      setLoading(false);
      return;
    }

    const url = `${baseUrl}${endpoint}`;

    try {
      const response = await authFetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const result = await response.json();

      if (response.ok) {
        alert(`Post test berhasil ${isEditing ? "diperbarui" : "disimpan"}!`);

        if (testType === "pre-test-global") {
          router.push(`/admin/modul`);
        } else if (topikSlug) {
          router.push(`/admin/modul/${modulSlug}/${topikSlug}`);
        } else if (modulSlug) {
          router.push(`/admin/modul`);
        }
        router.refresh();
      } else {
        alert(`Gagal menyimpan: ${result.message}`);
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan jaringan.");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return <div className="text-center p-6">Memuat soal...</div>;
  }

  return (
    <>
      {/* Tombol untuk mengelola fitur/indikator */}
      <div className="mb-6 p-4 bg-slate-50 dark:bg-gray-800 border dark:border-gray-700 rounded-lg flex justify-between items-center">
        <p className="text-sm text-gray-600 dark:text-gray-300">Gunakan tombol ini untuk menambah atau mengubah daftar indikator yang akan dinilai.</p>
        <FeatureManager onFeaturesUpdate={setAvailableFeatures} />
      </div>


      {questions.map((q, qIndex) => (
        <Card
          key={q._id || qIndex}
          className="mb-6 border-slate-200 dark:border-slate-700"
        >
          <CardContent className="p-4 sm:p-6">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-lg font-medium text-gray-800 dark:text-white">
                Soal {qIndex + 1}
              </h2>
              {questions.length > 1 && (
                <button
                  onClick={() => handleRemoveQuestion(qIndex)}
                  className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-500"
                >
                  <Trash2 size={18} />
                </button>
              )}
            </div>

            {/* Pengaturan Waktu per Soal */}
            <div className="grid w-full max-w-xs items-center gap-1.5 mb-4">
              <Label htmlFor={`duration-${qIndex}`}>Waktu Pengerjaan</Label>
              <select
                id={`duration-${qIndex}`}
                value={q.durationPerQuestion || 60}
                onChange={(e) => {
                  const updated = [...questions];
                  updated[qIndex].durationPerQuestion = Number(e.target.value);
                  setQuestions(updated);
                }}
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
              >
                <option value={30}>30 Detik</option>
                <option value={45}>45 Detik</option>
                <option value={60}>1 Menit (Default)</option>
                <option value={90}>1 Menit 30 Detik</option>
                <option value={120}>2 Menit</option>
              </select>
            </div>

            {/* Dropdown untuk Topik Terkait (hanya untuk post-test-modul) */}
            {testType === "post-test-modul" && topics && topics.length > 0 && (
              <div className="grid w-full max-w-xs items-center gap-1.5 mb-4">
                <Label htmlFor={`topik-${qIndex}`}>Topik Terkait</Label>
                <select
                  id={`topik-${qIndex}`}
                  value={q.topikId || ""}
                  onChange={(e) => {
                    const updated = [...questions];
                    updated[qIndex].topikId = e.target.value;
                    setQuestions(updated);
                  }}
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                >
                  <option value="">-- Pilih Topik --</option>
                  {topics.map((topik) => (
                    <option key={topik._id} value={topik._id}>
                      {topik.title}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {/* Dropdown untuk Sub Topik */}
            {subMateris && subMateris.length > 0 && (
              <div className="grid w-full max-w-xs items-center gap-1.5 mb-4">
                <Label htmlFor={`submateri-${qIndex}`}>Sub Topik Terkait</Label>
                <select
                  id={`submateri-${qIndex}`}
                  value={q.subMateriId || ""}
                  onChange={(e) => {
                    const updated = [...questions];
                    updated[qIndex].subMateriId = e.target.value;
                    setQuestions(updated);
                  }}
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                >
                  <option value="">-- Pilih Sub Topik --</option>
                  {subMateris.map((sub) => (
                    <option key={sub._id} value={sub._id}>
                      {sub.title.replace(/^\d+\.\s*/, "")}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {/* Editor untuk soal */}
            <div className="mb-4">
              <TiptapEditor
                content={q.questionText}
                onChange={(value) => handleChangeQuestion(qIndex, value)}
                placeholder="Masukkan pertanyaan di sini..."
              />
            </div>

            {/* Bagian Fitur dan Bobot */}
            {availableFeatures.length > 0 && (
              <div className="mt-4 pt-4 border-t dark:border-gray-700">
                <Label className="font-semibold text-base mb-2 block">Indikator Penilaian</Label>
                <p className="text-xs text-gray-500 mb-3">Atur bobot untuk setiap indikator yang diukur oleh soal ini melalui menu pengaturan.</p>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="flex items-center gap-2">
                      <Settings2 size={16} />
                      Atur Bobot Indikator
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-80" align="start">
                    <DropdownMenuLabel>Bobot Indikator Soal Ini</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <div className="p-2 max-h-80 overflow-y-auto space-y-2">
                      {q.features?.map((featureWeight) => {
                        const feature = availableFeatures.find(f => f._id === featureWeight.featureId);
                        if (!feature) return null;

                        return (
                          <div key={feature._id} className="flex items-center justify-between gap-4">
                            <Label htmlFor={`weight-dd-${qIndex}-${feature._id}`} className="flex-grow text-sm font-normal">
                              {feature.name}
                            </Label>
                            <select
                              id={`weight-dd-${qIndex}-${feature._id}`}
                              value={featureWeight.weight}
                              onChange={(e) => handleWeightChange(qIndex, feature._id, parseFloat(e.target.value))}
                              className="w-24 h-8 text-xs text-center bg-gray-50 border border-gray-300 text-gray-900 rounded-md focus:ring-blue-500 focus:border-blue-500 block dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            >
                              {[...Array(11)].map((_, i) => <option key={i} value={(i * 0.1).toFixed(1)}>{(i * 0.1).toFixed(1)}</option>)}
                            </select>
                          </div>
                        );
                      })}
                      {q.features?.length === 0 && <p className="text-xs text-center text-gray-500 py-2">Tidak ada indikator.</p>}
                        </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}

            {/* Daftar opsi */}
            <div className="space-y-3 mt-6">
              {q.options.map((option, oIndex) => (
                <div
                  key={oIndex}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-2"
                >
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        checked={q.answer === option && q.answer !== ""}
                        onChange={() => handleSelectAnswer(qIndex, option)}
                        className="text-blue-600 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                      />
                      <span className="text-sm text-gray-600 dark:text-gray-300">
                        Opsi {oIndex + 1} {q.answer === option && q.answer !== "" && "(Jawaban Benar)"}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      {activeOption.qIndex === qIndex &&
                        activeOption.oIndex === oIndex ? (
                        <button
                          onClick={() =>
                            setActiveOption({ qIndex: -1, oIndex: null })
                          }
                          className="text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-500"
                        >
                          <Save size={16} />
                        </button>
                      ) : (
                        <button
                          onClick={() =>
                            setActiveOption({ qIndex, oIndex })
                          }
                          className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-500"
                        >
                          <Edit3 size={16} />
                        </button>
                      )}
                      {q.options.length > 1 && (
                        <button
                          onClick={() => handleRemoveOption(qIndex, oIndex)}
                          className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-500"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Jika opsi sedang diedit → tampilkan editor */}
                  {activeOption.qIndex === qIndex &&
                    activeOption.oIndex === oIndex ? (
                    <TiptapEditor
                      content={option}
                      onChange={(value) =>
                        handleChangeOption(qIndex, oIndex, value)
                      }
                      placeholder={`Masukkan isi opsi ${oIndex + 1}...`}
                    />
                  ) : (
                    <div
                      className="prose prose-sm dark:prose-invert max-w-none px-2 py-1"
                      dangerouslySetInnerHTML={{ __html: option || "<i>Kosong</i>" }}
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Tombol tambahan opsi */}
            <div className="flex justify-between items-center mt-4">
              <Button
                variant="outline"
                onClick={() => handleAddOption(qIndex)}
                className="flex items-center gap-2 text-xs sm:text-sm px-3 py-1.5 dark:text-gray-300 dark:hover:text-white"
              >
                <PlusCircle size={16} />
                Tambah Opsi
              </Button>

              {q.answer && (
                <div className="flex items-center text-green-600 dark:text-green-500 text-sm gap-1">
                  <CheckCircle2 size={14} />
                  <span
                    className="prose prose-sm dark:prose-invert"
                    dangerouslySetInnerHTML={{
                      __html: `Jawaban: ${q.answer || "<i>Belum dipilih</i>"}`,
                    }}
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Tombol akhir */}
      <div className="flex justify-between items-center">
        <Button
          onClick={handleAddQuestion}
          variant="outline"
          className="flex items-center gap-2 text-xs sm:text-sm px-3 py-1.5 dark:text-gray-300 dark:hover:text-white"
        >
          <PlusCircle size={18} />
          Tambah Soal
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm px-3 py-1.5 disabled:opacity-50"
        >
          {loading
            ? "Menyimpan..."
            : isEditing
              ? "Simpan Perubahan"
              : "Simpan Semua"}
        </Button>
      </div>
    </>
  );
}
