import React from 'react';
import { Box, Text, VStack, useColorModeValue, Divider } from '@chakra-ui/react';
import ReactMarkdown from 'react-markdown';

interface FormattedAnswerProps {
  content: string;
}

export default function FormattedAnswer({ content }: FormattedAnswerProps) {
  const textColor = useColorModeValue('gray.700', 'white');
  const headingColor = useColorModeValue('gray.800', 'white');
  const codeBackgroundColor = useColorModeValue('gray.100', 'gray.700');
  const listItemColor = useColorModeValue('gray.600', 'gray.300');
  const blockquoteColor = useColorModeValue('gray.600', 'gray.400');
  const blockquoteBorder = useColorModeValue('gray.300', 'gray.600');

  // Custom components for ReactMarkdown
  const components = {
    // Headings
    h1: ({ children }: any) => (
      <Text fontSize={{ base: 'xl', md: '2xl' }} fontWeight="bold" color={headingColor} mb={{ base: 3, md: 4 }} mt={{ base: 5, md: 6 }}>
        {children}
      </Text>
    ),
    h2: ({ children }: any) => (
      <Text fontSize={{ base: 'lg', md: 'xl' }} fontWeight="bold" color={headingColor} mb={{ base: 2, md: 3 }} mt={{ base: 4, md: 5 }}>
        {children}
      </Text>
    ),
    h3: ({ children }: any) => (
      <Text fontSize={{ base: 'md', md: 'lg' }} fontWeight="semibold" color={headingColor} mb={2} mt={{ base: 3, md: 4 }}>
        {children}
      </Text>
    ),
    
    // Paragraphs
    p: ({ children }: any) => (
      <Text 
        fontSize={{ base: 'sm', md: 'md' }}
        lineHeight={{ base: '1.7', md: '1.8' }}
        color={textColor} 
        mb={{ base: 3, md: 4 }}
        letterSpacing="0.01em"
      >
        {children}
      </Text>
    ),
    
    // Lists
    ul: ({ children }: any) => (
      <VStack align="stretch" spacing={{ base: 1.5, md: 2 }} mb={{ base: 3, md: 4 }} pl={{ base: 3, md: 4 }}>
        {children}
      </VStack>
    ),
    ol: ({ children }: any) => (
      <VStack align="stretch" spacing={{ base: 1.5, md: 2 }} mb={{ base: 3, md: 4 }} pl={{ base: 3, md: 4 }}>
        {children}
      </VStack>
    ),
    li: ({ children }: any) => (
      <Box display="flex" alignItems="flex-start">
        <Text color={listItemColor} mr={2} mt={0.5}>•</Text>
        <Text fontSize={{ base: 'sm', md: 'md' }} lineHeight={{ base: '1.6', md: '1.65' }} color={textColor}>
          {children}
        </Text>
      </Box>
    ),
    
    // Code
    code: ({ children, className }: any) => {
      const isInline = !className;
      
      if (isInline) {
        return (
          <Text 
            as="span" 
            bg={codeBackgroundColor}
            px={2}
            py={1}
            borderRadius="md"
            fontSize={{ base: 'xs', md: 'sm' }}
            fontFamily="mono"
            color={textColor}
          >
            {children}
          </Text>
        );
      }
      
      return (
        <Box
          bg={codeBackgroundColor}
          p={{ base: 3, md: 4 }}
          borderRadius="lg"
          mb={{ base: 3, md: 4 }}
          overflow="auto"
        >
          <Text
            fontFamily="mono"
            fontSize={{ base: 'xs', md: 'sm' }}
            color={textColor}
            whiteSpace="pre-wrap"
          >
            {children}
          </Text>
        </Box>
      );
    },
    
    // Blockquotes
    blockquote: ({ children }: any) => (
      <Box
        borderLeft="4px solid"
        borderColor={blockquoteBorder}
        pl={4}
        py={2}
        mb={4}
        bg={useColorModeValue('gray.50', 'gray.800')}
        borderRadius="md"
      >
        <Text fontSize="md" color={blockquoteColor} fontStyle="italic">
          {children}
        </Text>
      </Box>
    ),
    
    // Horizontal rules
    hr: () => <Divider my={6} />,
    
    // Strong text
    strong: ({ children }: any) => (
      <Text as="span" fontWeight="bold" color={headingColor}>
        {children}
      </Text>
    ),
    
    // Emphasis
    em: ({ children }: any) => (
      <Text as="span" fontStyle="italic" color={textColor}>
        {children}
      </Text>
    ),
  };

  return (
    <Box>
      <ReactMarkdown components={components}>
        {content}
      </ReactMarkdown>
    </Box>
  );
}