"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import { type ThemeProviderProps } from "next-themes"
import { AlertProvider } from "@/context/AlertContext"

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider {...props}>
      <AlertProvider>{children}</AlertProvider>
    </NextThemesProvider>
  )
}
