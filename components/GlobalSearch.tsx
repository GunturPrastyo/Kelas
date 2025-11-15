"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Loader2, X } from 'lucide-react';
import { authFetch } from '@/lib/authFetch';
import Link from 'next/link';
import Image from 'next/image';
import { useDebounce } from './useDebounce'; // Menggunakan path relatif

interface Module {
    _id: string;
    title: string;
    slug: string;
    overview: string;
    icon: string;
}

export default function GlobalSearch() {
    const [query, setQuery] = useState('');
    const [allModules, setAllModules] = useState<Module[]>([]);
    const [filteredModules, setFilteredModules] = useState<Module[]>([]);
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
            const results = allModules.filter(module =>
                module.title.toLowerCase().includes(lowerCaseQuery) ||
                module.overview.toLowerCase().includes(lowerCaseQuery)
            );
            setFilteredModules(results);
            setIsLoading(false);
            setIsDropdownVisible(true);
        } else {
            setFilteredModules([]);
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
        setFilteredModules([]);
        setIsDropdownVisible(false);
    };

    return (
        <div className="relative w-full max-w-full" ref={searchRef}>
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => {
                        if (filteredModules.length > 0) setIsDropdownVisible(true);
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
                    {filteredModules.length > 0 ? (
                        <ul>
                            {filteredModules.map(module => (
                                <li key={module._id}>
                                    <Link href={`/modul/${module.slug}`} onClick={() => setIsDropdownVisible(false)} className="flex items-center gap-4 p-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                                        <Image
                                            src={`${process.env.NEXT_PUBLIC_API_URL}/uploads/${module.icon}`}
                                            alt={module.title}
                                            width={40}
                                            height={40}
                                            className="w-10 h-10 object-cover rounded-md bg-gray-100 dark:bg-gray-700 p-1 flex-shrink-0"
                                        />
                                        <div className="min-w-0">
                                            <p className="font-semibold text-sm text-gray-800 dark:text-gray-100 truncate">{module.title}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{module.overview}</p>
                                        </div>
                                    </Link>
                                </li>
                            ))}
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