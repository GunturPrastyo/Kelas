"use client"

import React, { createContext, useState, useContext, ReactNode } from 'react';

interface UIContextType {
  isSidebarCollapsed: boolean;
  toggleSidebar: () => void;
  isMobileDrawerOpen: boolean;
  toggleMobileDrawer: () => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export const UIProvider = ({ children }: { children: ReactNode }) => {
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const toggleSidebar = () => setSidebarCollapsed(!isSidebarCollapsed);
  const toggleMobileDrawer = () => setMobileDrawerOpen(!isMobileDrawerOpen);

  return (
    <UIContext.Provider value={{ isSidebarCollapsed, toggleSidebar, isMobileDrawerOpen, toggleMobileDrawer }}>
      {children}
    </UIContext.Provider>
  );
};

export const useUI = () => {
  const context = useContext(UIContext);
  if (context === undefined) {
    throw new Error('useUI must be used within a UIProvider');
  }
  return context;
};