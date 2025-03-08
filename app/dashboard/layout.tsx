"use client";

import React from 'react';
import { ThemeProvider } from '../context/ThemeContext';
import AuthWrapper from '../components/AuthWrapper';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthWrapper>
      <ThemeProvider>
        {children}
      </ThemeProvider>
    </AuthWrapper>
  );
} 