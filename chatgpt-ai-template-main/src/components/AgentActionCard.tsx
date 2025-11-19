'use client';
import { Box, Flex, Text, Icon, VStack, HStack, Badge } from '@chakra-ui/react';
import { MdSearch, MdAnalytics, MdTipsAndUpdates, MdCheckCircle } from 'react-icons/md';
import { useEffect, useState } from 'react';

export interface AgentAction {
  type: 'searching' | 'analyzing' | 'thinking' | 'completed';
  title: string;
  description: string;
  details?: string[];
}

interface AgentActionCardProps {
  action: AgentAction;
  autoProgress?: boolean;
}

export default function AgentActionCard({ action, autoProgress = false }: AgentActionCardProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (autoProgress && action.type !== 'completed') {
      const interval = setInterval(() => {
        setProgress(prev => (prev >= 100 ? 0 : prev + 2));
      }, 100);
      return () => clearInterval(interval);
    }
  }, [autoProgress, action.type]);

  const getActionIcon = () => {
    switch (action.type) {
      case 'searching': return MdSearch;
      case 'analyzing': return MdAnalytics;
      case 'thinking': return MdTipsAndUpdates;
      case 'completed': return MdCheckCircle;
      default: return MdTipsAndUpdates;
    }
  };

  const getActionColor = () => {
    switch (action.type) {
      case 'searching': return 'blue';
      case 'analyzing': return 'orange';
      case 'thinking': return 'purple';
      case 'completed': return 'green';
      default: return 'gray';
    }
  };

  const color = getActionColor();

  return (
    <Box
      w="100%"
      maxW="960px"
      bg="white"
      border="1px solid"
      borderColor={`${color}.200`}
      borderRadius="16px"
      overflow="hidden"
      boxShadow={`0 4px 16px rgba(0, 0, 0, 0.06)`}
      transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
      _hover={{
        boxShadow: `0 8px 24px rgba(0, 0, 0, 0.1)`,
        transform: 'translateY(-2px)'
      }}
    >
      {/* Progress Bar */}
      {action.type !== 'completed' && (
        <Box
          h="3px"
          w="100%"
          bg={`${color}.100`}
          position="relative"
          overflow="hidden"
        >
          <Box
            h="100%"
            w={autoProgress ? `${progress}%` : '100%'}
            bgGradient={`linear(to-r, ${color}.400, ${color}.600)`}
            transition="width 0.1s linear"
            animation={!autoProgress ? "shimmer 2s linear infinite" : "none"}
            sx={{
              '@keyframes shimmer': {
                '0%': { transform: 'translateX(-100%)' },
                '100%': { transform: 'translateX(100%)' }
              }
            }}
          />
        </Box>
      )}

      <Flex
        p={{ base: '16px', md: '20px' }}
        align="flex-start"
        gap={4}
      >
        {/* Icon */}
        <Flex
          w="48px"
          h="48px"
          borderRadius="12px"
          bg={`${color}.100`}
          align="center"
          justify="center"
          flexShrink={0}
          position="relative"
        >
          <Icon
            as={getActionIcon()}
            w="24px"
            h="24px"
            color={`${color}.600`}
            animation={action.type !== 'completed' ? "spin 2s linear infinite" : "none"}
            sx={{
              '@keyframes spin': {
                '0%': { transform: 'rotate(0deg)' },
                '100%': { transform: 'rotate(360deg)' }
              }
            }}
          />
          
          {/* Pulse effect for active actions */}
          {action.type !== 'completed' && (
            <Box
              position="absolute"
              top="0"
              left="0"
              right="0"
              bottom="0"
              borderRadius="12px"
              border="2px solid"
              borderColor={`${color}.300`}
              animation="ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite"
              sx={{
                '@keyframes ping': {
                  '0%': { transform: 'scale(1)', opacity: 1 },
                  '75%, 100%': { transform: 'scale(1.3)', opacity: 0 }
                }
              }}
            />
          )}
        </Flex>

        {/* Content */}
        <VStack align="flex-start" spacing={2} flex={1}>
          <HStack spacing={3}>
            <Text
              fontSize={{ base: 'md', md: 'lg' }}
              fontWeight="700"
              color="gray.800"
            >
              {action.title}
            </Text>
            <Badge
              colorScheme={color}
              px={2}
              py={1}
              borderRadius="full"
              fontSize="xs"
              fontWeight="600"
            >
              {action.type === 'completed' ? 'Completed' : 'Processing'}
            </Badge>
          </HStack>

          <Text
            fontSize={{ base: 'sm', md: 'md' }}
            color="gray.600"
            lineHeight="1.6"
          >
            {action.description}
          </Text>

          {/* Details */}
          {action.details && action.details.length > 0 && (
            <VStack align="stretch" spacing={1} mt={2} w="100%">
              {action.details.map((detail, index) => (
                <Flex
                  key={index}
                  align="center"
                  gap={2}
                  p={2}
                  borderRadius="8px"
                  bg="gray.50"
                  opacity={0}
                  animation={`fadeIn 0.3s ease-out ${index * 0.1}s forwards`}
                  sx={{
                    '@keyframes fadeIn': {
                      'from': { opacity: 0, transform: 'translateX(-10px)' },
                      'to': { opacity: 1, transform: 'translateX(0)' }
                    }
                  }}
                >
                  <Box
                    w="4px"
                    h="4px"
                    borderRadius="full"
                    bg={`${color}.500`}
                  />
                  <Text fontSize="sm" color="gray.700">
                    {detail}
                  </Text>
                </Flex>
              ))}
            </VStack>
          )}
        </VStack>
      </Flex>
    </Box>
  );
}
