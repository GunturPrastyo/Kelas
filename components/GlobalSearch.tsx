"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Loader2, X } from 'lucide-react';
import { authFetch } from '@/lib/authFetch';
import Link from 'next/link';
import Image from 'next/image';
import { useDebounce } from './useDebounce'; // Menggunakan path relatif

interface Topic {
    _id: string;
    title: string;
    slug: string;
    isLocked: boolean;
}

interface Module {
    _id: string;
    title: string;
    slug: string;
    overview: string;
    icon: string;
    isLocked: boolean;
    topics: Topic[];
}

interface SearchResult {
    type: 'module' | 'topic';
    id: string;
    title: string;
    slug: string;
    isLocked: boolean;
    context: string; // Module title for topic, or overview for module
    icon?: string;
    moduleSlug?: string;
}

export default function GlobalSearch() {
    const [query, setQuery] = useState('');
    const [allModules, setAllModules] = useState<Module[]>([]);
    const [filteredResults, setFilteredResults] = useState<SearchResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isDropdownVisible, setIsDropdownVisible] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);

    const debouncedQuery = useDebounce(query, 300);

    // 1. Fetch semua modul sekali saja saat komponen dimuat
    useEffect(() => {
        const fetchAllModules = async () => {
            try {
                const res = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/modul/progress`);
                if (res.ok) {
                    const data = await res.json();
                    setAllModules(data);
                }
            } catch (error) {
                console.error("Gagal memuat modul untuk pencarian:", error);
            }
        };
        fetchAllModules();
    }, []);

    // 2. Lakukan filter ketika query yang sudah di-debounce berubah
    useEffect(() => {
        if (debouncedQuery.length > 1) {
            setIsLoading(true);
            const lowerCaseQuery = debouncedQuery.toLowerCase();
            const results: SearchResult[] = [];

            allModules.forEach(module => {
                // Cari di modul
                if (module.title.toLowerCase().includes(lowerCaseQuery) || module.overview.toLowerCase().includes(lowerCaseQuery)) {
                    results.push({
                        type: 'module',
                        id: module._id,
                        title: module.title,
                        slug: module.slug,
                        isLocked: module.isLocked,
                        context: module.overview,
                        icon: module.icon,
                    });
                }

                // Cari di topik dalam modul
                // Tambahkan pengecekan untuk memastikan module.topics ada dan merupakan array
                if (Array.isArray(module.topics)) {
                    module.topics.forEach(topic => {
                        if (topic.title.toLowerCase().includes(lowerCaseQuery)) {
                            results.push({
                                type: 'topic',
                                id: topic._id,
                                title: topic.title,
                                slug: topic.slug,
                                isLocked: topic.isLocked,
                                context: `Topik dalam: ${module.title}`,
                                moduleSlug: module.slug,
                                icon: module.icon, // Gunakan ikon modul untuk topiknya
                            });
                        }
                    });
                }
            });

            setFilteredResults(results);
            setIsLoading(false);
            setIsDropdownVisible(true);
        } else {
            setFilteredResults([]);
            setIsDropdownVisible(false);
        }
    }, [debouncedQuery, allModules]);

    // 3. Handle klik di luar komponen untuk menutup dropdown
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setIsDropdownVisible(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleReset = () => {
        setQuery('');
        setFilteredResults([]);
        setIsDropdownVisible(false);
    };

    return (
        <div className="relative w-full max-w-full" ref={searchRef} suppressHydrationWarning>
            <div className="relative" suppressHydrationWarning>
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => { // Mengubah filteredModules menjadi filteredResults
                        if (filteredResults.length > 0) setIsDropdownVisible(true);
                    }}
                    placeholder="Mau belajar apa hari ini?"
                    className="w-full py-2.5 pl-10  border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
                {query && (
                    <button onClick={handleReset} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600">
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                    </button>
                )}
            </div>

            {isDropdownVisible && debouncedQuery.length > 1 && (
                <div className="absolute mt-2 w-full bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50 max-h-96 overflow-y-auto">
                    {filteredResults.length > 0 ? (
                        <ul>
                            {filteredResults.map(result => {
                                const href = result.type === 'module'
                                    ? `/modul/${result.slug}` // URL untuk modul
                                    : `/modul/${result.moduleSlug}#${result.id}`; // URL untuk topik menggunakan hash (#) dengan ID topik

                                const content = (
                                    <div className={`flex items-center gap-4 p-3 transition-colors ${result.isLocked ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                                        {result.icon && (
                                            <Image
                                                src={`${process.env.NEXT_PUBLIC_API_URL}/uploads/${result.icon}`}
                                                alt={result.title}
                                                width={40}
                                                height={40}
                                                className="w-10 h-10 object-cover rounded-md bg-gray-100 dark:bg-gray-700 p-1 flex-shrink-0"
                                            />
                                        )}
                                        <div className="min-w-0">
                                            <p className="font-semibold text-sm text-gray-800 dark:text-gray-100 truncate">{result.title}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{result.context}</p>
                                        </div>
                                    </div>
                                );

                                return (
                                <li key={`${result.type}-${result.id}`}>
                                    {result.isLocked ? (
                                        content
                                    ) : (
                                        <Link href={href} onClick={() => setIsDropdownVisible(false)}>
                                            {content}
                                        </Link>
                                    )}
                                </li>
                                );
                            })}
                        </ul>
                    ) : (
                        <div className="p-4 text-center text-sm text-gray-500">
                            Tidak ada modul yang cocok dengan "{query}".
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}