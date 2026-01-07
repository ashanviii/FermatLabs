'use client';

import React, { ReactNode } from 'react';
import { ChakraProvider, Box } from '@chakra-ui/react';
import theme from '../../src/theme/theme';
import '../../src/styles/App.css';
import '../../src/styles/Landing.css';

export default function LandingLayout({ children }: { children: ReactNode }) {
  return (
    <ChakraProvider theme={theme}>
      <Box
        minH="100vh"
        w="100%"
        bg="#0a0a0f"
        overflowX="hidden"
      >
        {children}
      </Box>
    </ChakraProvider>
  );
}
