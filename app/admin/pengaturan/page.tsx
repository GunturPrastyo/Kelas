"use client";

import { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { authFetch } from '@/lib/authFetch';
import { useAlert } from '@/context/AlertContext';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2, UploadCloud } from 'lucide-react';
import Breadcrumb from '@/components/Breadcrumb';

interface Settings {
    siteTitle?: string;
    siteDescription?: string;
    siteKeywords?: string;
    logoUrl?: string;
    faviconUrl?: string;
}

export default function PengaturanPage() {
    const [settings, setSettings] = useState<Settings>({});
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [faviconFile, setFaviconFile] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [faviconPreview, setFaviconPreview] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { showAlert } = useAlert();

    useEffect(() => {
        const fetchSettings = async () => {
            setLoading(true);
            try {
                const res = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/settings`);
                if (res.ok) {
                    const data = await res.json();
                    setSettings(data);
                    if (data.logoUrl) {
                        setLogoPreview(data.logoUrl.startsWith('http') ? data.logoUrl : `${process.env.NEXT_PUBLIC_API_URL}${data.logoUrl}`);
                    }
                    if (data.faviconUrl) {
                        setFaviconPreview(data.faviconUrl.startsWith('http') ? data.faviconUrl : `${process.env.NEXT_PUBLIC_API_URL}${data.faviconUrl}`);
                    }
                } else {
                    showAlert({ title: "Gagal Memuat", message: "Gagal memuat pengaturan website." });
                }
            } catch (error) {
                console.error("Error fetching settings:", error);
                showAlert({ title: "Error", message: "Terjadi kesalahan saat memuat pengaturan." });
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, [showAlert]);

    const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setSettings(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>, type: 'logo' | 'favicon') => {
        const file = e.target.files?.[0];
        if (file) {
            const previewUrl = URL.createObjectURL(file);
            if (type === 'logo') {
                setLogoFile(file);
                setLogoPreview(previewUrl);
            } else {
                setFaviconFile(file);
                setFaviconPreview(previewUrl);
            }
        }
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        const formData = new FormData();
        formData.append('siteTitle', settings.siteTitle || '');
        formData.append('siteDescription', settings.siteDescription || '');
        formData.append('siteKeywords', settings.siteKeywords || '');

        if (logoFile) {
            formData.append('logo', logoFile);
        }
        if (faviconFile) {
            formData.append('favicon', faviconFile);
        }

        try {
            const res = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/settings`, {
                method: 'PUT',
                body: formData,
            });

            if (res.ok) {
                const contentType = res.headers.get("content-type");
                if (contentType && contentType.indexOf("application/json") !== -1) {
                    const updatedData = await res.json();
                    showAlert({ title: "Berhasil", message: "Pengaturan website berhasil diperbarui." });
                    // Optionally update previews if backend returns new URLs
                    if (updatedData.logoUrl) {
                        setLogoPreview(updatedData.logoUrl.startsWith('http') ? updatedData.logoUrl : `${process.env.NEXT_PUBLIC_API_URL}${updatedData.logoUrl}`);
                    }
                    if (updatedData.faviconUrl) {
                        setFaviconPreview(updatedData.faviconUrl.startsWith('http') ? updatedData.faviconUrl : `${process.env.NEXT_PUBLIC_API_URL}${updatedData.faviconUrl}`);
                    }
                } else {
                     showAlert({ title: "Berhasil", message: "Pengaturan website berhasil diperbarui, namun respons tidak terduga." });
                }
            } else {
                const contentType = res.headers.get("content-type");
                if (contentType && contentType.indexOf("application/json") !== -1) {
                    const errorData = await res.json();
                    showAlert({ title: "Gagal", message: `Gagal menyimpan pengaturan: ${errorData.message}` });
                } else {
                    const errorText = await res.text();
                    showAlert({ title: "Gagal", message: `Gagal menyimpan pengaturan. Server memberikan respons tak terduga.` });
                    console.error("Unexpected server response:", errorText);
                }
            }
        } catch (error) {
            console.error("Error saving settings:", error);
            showAlert({ title: "Error", message: "Terjadi kesalahan saat menyimpan pengaturan." });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="space-y-6 mt-22">
                <div className="h-10 w-1/4 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse"></div>
                <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse"></div>
                <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 mt-22">
            <Breadcrumb paths={[{ name: "Dashboard", href: "/admin/dashboard" }, { name: "Pengaturan", href: "/admin/pengaturan" }]} />
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Pengaturan Website</h1>
            
            <form onSubmit={handleSubmit} className="space-y-8">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
                    <h2 className="text-lg font-semibold mb-4">Identitas & SEO</h2>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="siteTitle" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Judul Website</label>
                            <Input
                                id="siteTitle"
                                name="siteTitle"
                                value={settings.siteTitle || ''}
                                onChange={handleInputChange}
                                placeholder="Contoh: KELAS - Platform E-Learning Personalisasi"
                                className="mt-1"
                            />
                        </div>
                        <div>
                            <label htmlFor="siteDescription" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Deskripsi Website</label>
                            <Textarea
                                id="siteDescription"
                                name="siteDescription"
                                value={settings.siteDescription || ''}
                                onChange={handleInputChange}
                                placeholder="Deskripsi singkat tentang website untuk mesin pencari (SEO)."
                                className="mt-1"
                                rows={3}
                            />
                        </div>
                        <div>
                            <label htmlFor="siteKeywords" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Kata Kunci (Keywords)</label>
                            <Input
                                id="siteKeywords"
                                name="siteKeywords"
                                value={settings.siteKeywords || ''}
                                onChange={handleInputChange}
                                placeholder="e-learning, personalisasi, javascript, pemrograman (pisahkan dengan koma)"
                                className="mt-1"
                            />
                            <p className="mt-1 text-xs text-gray-500">Pisahkan setiap kata kunci dengan koma.</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
                    <h2 className="text-lg font-semibold mb-4">Branding</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Logo Website</label>
                            <div className="mt-2 flex items-center gap-4">
                                {logoPreview && <img src={logoPreview} alt="Logo Preview" className="h-12 w-auto bg-gray-100 dark:bg-gray-700 p-1 rounded-md" />}
                                <label htmlFor="logo-upload" className="cursor-pointer bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600">
                                    <span>Ganti Logo</span>
                                    <input id="logo-upload" name="logo" type="file" className="sr-only" accept="image/png, image/jpeg, image/webp, image/svg+xml" onChange={(e) => handleFileChange(e, 'logo')} />
                                </label>
                            </div>
                            <p className="mt-1 text-xs text-gray-500">Rekomendasi: file .png transparan atau .svg.</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Favicon</label>
                            <div className="mt-2 flex items-center gap-4">
                                {faviconPreview && <img src={faviconPreview} alt="Favicon Preview" className="h-8 w-8 rounded-md" />}
                                <label htmlFor="favicon-upload" className="cursor-pointer bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600">
                                    <span>Ganti Favicon</span>
                                    <input id="favicon-upload" name="favicon" type="file" className="sr-only" accept="image/x-icon, image/png, image/svg+xml" onChange={(e) => handleFileChange(e, 'favicon')} />
                                </label>
                            </div>
                            <p className="mt-1 text-xs text-gray-500">Rekomendasi: file .ico atau .png ukuran 32x32.</p>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end">
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Simpan Pengaturan
                    </Button>
                </div>
            </form>
        </div>
    );
}