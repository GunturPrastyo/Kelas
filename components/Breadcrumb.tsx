"use client";

import Link from "next/link";
import { Home } from "lucide-react";

interface Path {
  name: string;
  href: string;
}

interface Props {
  paths: Path[];
}

export default function Breadcrumb({ paths }: Props) {
  return (
    <nav className="flex" aria-label="Breadcrumb">
      <ol className="inline-flex items-center space-x-1 md:space-x-2 rtl:space-x-reverse text-slate-700 dark:text-slate-300">
        {paths.map((path, idx) => (
          <li key={idx} className="inline-flex items-center">
            {idx === 0 ? (
              <Link href={path.href} className="inline-flex items-center text-sm font-medium hover:text-blue-600 dark:hover:text-blue-400">
                <Home className="w-4 h-4 me-2.5" />
                {path.name}
              </Link>
            ) : idx < paths.length - 1 ? (
              <div className="flex items-center">
                <svg className="rtl:rotate-180 w-3 h-3 text-slate-400 dark:text-slate-500 mx-1" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 9 4-4-4-4" /></svg>
                <Link href={path.href} className="ms-1 text-sm font-medium hover:text-blue-600 md:ms-2 dark:hover:text-blue-400">
                  {path.name}
                </Link>
              </div>
            ) : ( // Last item
              <div className="flex items-center">
                <svg className="rtl:rotate-180 w-3 h-3 text-slate-400 dark:text-slate-500 mx-1" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 9 4-4-4-4" /></svg>
                <span className="ms-1 text-sm font-medium text-gray-800 dark:text-gray-200 md:ms-2">{path.name}</span>
              </div>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
