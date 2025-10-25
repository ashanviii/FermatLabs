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
      <Text fontSize="2xl" fontWeight="bold" color={headingColor} mb={4} mt={6}>
        {children}
      </Text>
    ),
    h2: ({ children }: any) => (
      <Text fontSize="xl" fontWeight="bold" color={headingColor} mb={3} mt={5}>
        {children}
      </Text>
    ),
    h3: ({ children }: any) => (
      <Text fontSize="lg" fontWeight="semibold" color={headingColor} mb={2} mt={4}>
        {children}
      </Text>
    ),
    
    // Paragraphs
    p: ({ children }: any) => (
      <Text 
        fontSize="md" 
        lineHeight="1.7" 
        color={textColor} 
        mb={4}
        textAlign="justify"
      >
        {children}
      </Text>
    ),
    
    // Lists
    ul: ({ children }: any) => (
      <VStack align="stretch" spacing={2} mb={4} pl={4}>
        {children}
      </VStack>
    ),
    ol: ({ children }: any) => (
      <VStack align="stretch" spacing={2} mb={4} pl={4}>
        {children}
      </VStack>
    ),
    li: ({ children }: any) => (
      <Box display="flex" alignItems="flex-start">
        <Text color={listItemColor} mr={2} mt={0.5}>•</Text>
        <Text fontSize="md" lineHeight="1.6" color={textColor}>
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
            fontSize="sm"
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
          p={4}
          borderRadius="lg"
          mb={4}
          overflow="auto"
        >
          <Text
            fontFamily="mono"
            fontSize="sm"
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