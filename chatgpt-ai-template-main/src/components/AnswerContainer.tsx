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
      maxW="880px"
      bg="white"
      border="1px solid"
      borderColor={borderColor}
      borderRadius="24px"
      boxShadow="lg"
      overflow="hidden"
      position="relative"
      _before={{
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '4px',
        bg: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
      }}
    >
      {/* Header */}
      <Flex
        align="center"
        gap="10px"
        px="32px"
        py="16px"
        bg={headerBg}
        borderBottom="1px solid"
        borderColor={borderColor}
      >
        <Icon as={MdAutoAwesome} color={iconColor} w="20px" h="20px" />
        <Text fontSize="sm" fontWeight="600" color="gray.600">
          {isThinking ? 'Fermat is thinking...' : 'Fermat\'s Response'}
        </Text>
      </Flex>

      {/* Content */}
      <Box p="32px">
        {children || <FormattedAnswer content={content} />}
      </Box>
    </Box>
  );
}