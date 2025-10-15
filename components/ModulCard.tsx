"use client";

interface Props {
  modul: { title: string; overview: string; category: string; icon?: string };
}

export default function ModulCard({ modul }: Props) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-5 hover:shadow-lg border border-gray-200 dark:border-gray-700 transition-all">
      <div className="flex items-start space-x-4">
        <div className="w-12 h-12 flex items-center justify-center bg-blue-100 dark:bg-blue-900 rounded-lg overflow-hidden">
          {modul.icon ? (
            <img
              src={`${process.env.NEXT_PUBLIC_API_URL}/uploads/${modul.icon}`}
              alt={modul.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-xl font-bold text-blue-700 dark:text-blue-300">
              {modul.title.charAt(0).toUpperCase()}
            </span>
          )}
        </div>

        <div>
          <h3 className="text-lg font-semibold dark:text-white">{modul.title}</h3>
          <span className={`text-xs px-2 py-1 rounded-full ${modul.category === "mudah"
              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
              : modul.category === "sedang"
                ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
                : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
            }`}>
            {modul.category}
          </span>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300 line-clamp-3">{modul.overview}</p>
        </div>
      </div>
    </div>
  );
}
