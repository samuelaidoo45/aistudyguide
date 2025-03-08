"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { usePathname } from 'next/navigation';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');
  const pathname = usePathname();
  
  // Check if current path is the landing page
  const isLandingPage = pathname === '/';

  useEffect(() => {
    // Only apply stored theme if not on landing page
    if (!isLandingPage) {
      // Check if theme is stored in localStorage
      const storedTheme = localStorage.getItem('theme') as Theme | null;
      
      // Check if user prefers dark mode
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      
      // Set theme based on stored preference or system preference
      if (storedTheme) {
        setTheme(storedTheme);
      } else if (prefersDark) {
        setTheme('dark');
      }
    } else {
      // Force light mode for landing page
      setTheme('light');
    }
  }, [isLandingPage]);

  useEffect(() => {
    // Only update localStorage when theme changes and not on landing page
    if (!isLandingPage) {
      localStorage.setItem('theme', theme);
    }
    
    // Update document class for global CSS
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme, isLandingPage]);

  const toggleTheme = () => {
    // Only allow toggling if not on landing page
    if (!isLandingPage) {
      setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
} 