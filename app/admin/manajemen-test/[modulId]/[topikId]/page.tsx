"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function TambahTestPage() {
  const [form, setForm] = useState({
    title: "",
    questionText: "",
    options: ["", "", "", ""],
    answer: "",
  });

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/question`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    alert("Soal berhasil ditambahkan!");
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-xl font-bold mb-4">Tambah Soal Post Test</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          placeholder="Pertanyaan"
          className="border p-2 w-full rounded"
          value={form.questionText}
          onChange={(e) => setForm({ ...form, questionText: e.target.value })}
        />
        {form.options.map((opt, i) => (
          <input
            key={i}
            placeholder={`Pilihan ${i + 1}`}
            className="border p-2 w-full rounded"
            value={opt}
            onChange={(e) => {
              const newOpt = [...form.options];
              newOpt[i] = e.target.value;
              setForm({ ...form, options: newOpt });
            }}
          />
        ))}
        <input
          placeholder="Jawaban benar"
          className="border p-2 w-full rounded"
          value={form.answer}
          onChange={(e) => setForm({ ...form, answer: e.target.value })}
        />
        <Button type="submit" className="bg-blue-600 text-white w-full">
          Simpan Soal
        </Button>
      </form>
    </div>
  );
}
