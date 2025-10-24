"use client";

import Link from "next/link";

interface Path {
  name: string;
  href: string;
}

interface Props {
  paths: Path[];
}

export default function Breadcrumb({ paths }: Props) {
  return (
    <nav className="text-sm text-gray-500 dark:text-gray-400" aria-label="breadcrumb">
      <ol className="inline-flex items-center space-x-1">
        {paths.map((path, idx) => (
          <li key={idx} className="inline-flex items-center">
            {idx < paths.length - 1 ? (
              <>
                <Link href={path.href} className="hover:text-blue-600 dark:hover:text-blue-400">
                  {path.name}
                </Link>
                <span className="mx-2">/</span>
              </>
            ) : (
              <span className="font-medium text-gray-800 dark:text-gray-200">{path.name}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
