'use client';
import React, { ReactNode } from 'react';
import '../src/styles/App.css';
import '../src/styles/Contact.css';
import '../src/styles/Plugins.css';
import '../src/styles/MiniCalendar.css';
import { ChakraProvider } from '@chakra-ui/react';
import { AuthProvider } from '../src/contexts/AuthContext';
import { UserContextProvider } from '../src/contexts/UserContextContext';

// import dynamic from 'next/dynamic';
import theme from '../src/theme/theme';

const _NoSSR = ({ children }: any) => (
  <React.Fragment>{children}</React.Fragment>
);

// const NoSSR = dynamic(() => Promise.resolve(_NoSSR), {
//   ssr: false,
// });

export default function AppWrappers({ children }: { children: ReactNode }) {
  return (
    // <NoSSR>
    <ChakraProvider theme={theme}>
      <AuthProvider>
        <UserContextProvider>
          {children}
        </UserContextProvider>
      </AuthProvider>
    </ChakraProvider>
    // </NoSSR>
  );
}
