"use client"

import React, { createContext, useState, useContext, ReactNode, Dispatch, SetStateAction } from 'react';

interface UIContextType {
  isSidebarCollapsed: boolean;
  toggleSidebar: () => void;
  isMobileDrawerOpen: boolean;
  toggleMobileDrawer: () => void;
  searchQuery: string;
  setSearchQuery: Dispatch<SetStateAction<string>>;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export const UIProvider = ({ children }: { children: ReactNode }) => {
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const toggleSidebar = () => setSidebarCollapsed(!isSidebarCollapsed);
  const toggleMobileDrawer = () => setMobileDrawerOpen(!isMobileDrawerOpen);

  const value = { isSidebarCollapsed, toggleSidebar, isMobileDrawerOpen, toggleMobileDrawer, searchQuery, setSearchQuery };

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
};

export const useUI = () => {
  const context = useContext(UIContext);
  if (context === undefined) {
    throw new Error('useUI must be used within a UIProvider');
  }
  return context;
};