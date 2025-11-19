import React from 'react';
import { Box, Text, Flex, Icon, useColorModeValue } from '@chakra-ui/react';
import { MdAutoAwesome } from 'react-icons/md';
import FormattedAnswer from './FormattedAnswer';

interface AnswerContainerProps {
  content: string;
  isThinking?: boolean;
  children?: React.ReactNode;
}

export default function AnswerContainer({ content, isThinking = false, children }: AnswerContainerProps) {
  const borderColor = useColorModeValue('gray.200', 'whiteAlpha.200');
  const headerBg = useColorModeValue('gray.50', 'gray.800');
  const iconColor = useColorModeValue('purple.500', 'purple.300');
  
  return (
    <Box
      w="100%"
      maxW="960px"
      bg="white"
      border="1px solid"
      borderColor={borderColor}
      borderRadius="24px"
      boxShadow="0 4px 24px rgba(0, 0, 0, 0.08)"
      overflow="hidden"
      position="relative"
      transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
      _hover={{
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.12)",
        transform: "translateY(-2px)"
      }}
      _before={{
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '4px',
        bgGradient: 'linear(to-r, purple.500, pink.500, orange.400)',
        backgroundSize: '200% 100%',
        animation: isThinking ? 'shimmer 2s linear infinite' : 'none'
      }}
      sx={{
        '@keyframes shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' }
        }
      }}
    >
      {/* Header */}
      <Flex
        align="center"
        gap={{ base: '8px', md: '12px' }}
        px={{ base: '20px', md: '32px' }}
        py={{ base: '14px', md: '18px' }}
        bg={headerBg}
        borderBottom="1px solid"
        borderColor={borderColor}
      >
        <Icon 
          as={MdAutoAwesome} 
          color={iconColor} 
          w={{ base: '18px', md: '20px' }} 
          h={{ base: '18px', md: '20px' }}
          animation={isThinking ? "spin 2s linear infinite" : "none"}
          sx={{
            '@keyframes spin': {
              '0%': { transform: 'rotate(0deg)' },
              '100%': { transform: 'rotate(360deg)' }
            }
          }}
        />
        <Text fontSize={{ base: 'sm', md: 'md' }} fontWeight="600" color="gray.600">
          {isThinking ? 'Fermat is thinking...' : 'Fermat\'s Response'}
        </Text>
      </Flex>

      {/* Content */}
      <Box p={{ base: '24px', md: '36px', lg: '40px' }}>
        {children || <FormattedAnswer content={content} />}
      </Box>
    </Box>
  );
}