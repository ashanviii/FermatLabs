'use client';
import React, { ReactNode } from 'react';
import '../src/styles/App.css';
import '../src/styles/Contact.css';
import '../src/styles/Plugins.css';
import '../src/styles/MiniCalendar.css';
import AppWrappers from './AppWrappers';
import { AuthProvider } from '../src/contexts/AuthContext';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body id="root">
        <AuthProvider>
          <AppWrappers>{children}</AppWrappers>
        </AuthProvider>
      </body>
    </html>
  );
}
