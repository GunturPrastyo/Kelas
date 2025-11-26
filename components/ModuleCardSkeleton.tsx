"use client";

const ModuleCardSkeleton = () => {
    return (
        <div className="relative sm:static">
            {/* Skeleton untuk nomor urut mobile */}
            <div className="absolute top-5 left-0 z-10 w-12 h-12 flex items-center justify-center md:hidden">
                <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-5 flex flex-col ml-12 sm:ml-0 h-full animate-pulse">
                {/* Header Skeleton */}
                <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gray-200 dark:bg-gray-700"></div>
                        <div className="space-y-2">
                            {/* Skeleton untuk nomor modul desktop */}
                            <div className="hidden sm:block h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded-md mb-2"></div>
                            {/* Skeleton untuk judul */}
                            <div className="h-5 w-36 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
                            {/* Skeleton untuk badge kategori */}
                            <div className="h-5 w-20 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
                        </div>
                    </div>
                    {/* Skeleton untuk badge status */}
                    <div className="h-6 w-20 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                </div>

                {/* Skeleton untuk overview (flex-grow) */}
                <div className="space-y-2 flex-grow mb-4">
                    <div className="h-3 w-full bg-gray-200 dark:bg-gray-700 rounded-md"></div>
                    <div className="h-3 w-5/6 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
                </div>

                {/* Skeleton untuk Info User & Waktu */}
                <div className="flex items-center gap-4 mb-4">
                    <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
                    <div className="h-4 w-28 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
                </div>

                {/* Skeleton untuk progress bar dan detail topik */}
                <div className="mb-4">
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5"></div>
                    <div className="h-3 w-32 bg-gray-200 dark:bg-gray-700 rounded-md mt-1.5"></div>
                </div>

                {/* Skeleton untuk tombol */}
                <div className="mt-auto w-full h-11 bg-gray-300 dark:bg-gray-600 rounded-lg"></div>
            </div>
        </div>
    );
};

export default ModuleCardSkeleton;