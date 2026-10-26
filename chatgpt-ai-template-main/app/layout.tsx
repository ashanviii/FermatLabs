'use client';
import React, { ReactNode } from 'react';
import { ChakraProvider } from '@chakra-ui/react';
import theme from '../src/theme/theme';
import '../src/styles/App.css';
import '../src/styles/Contact.css';
import '../src/styles/Plugins.css';
import '../src/styles/MiniCalendar.css';
import AppWrappers from './AppWrappers';
import { AuthProvider } from '../src/contexts/AuthContext';
import { UserContextProvider } from '../src/contexts/UserContextContext';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body id="root">
        <AuthProvider>
          <UserContextProvider>
            <AppWrappers>
              <ChakraProvider theme={theme}>{children}</ChakraProvider>
            </AppWrappers>
          </UserContextProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
