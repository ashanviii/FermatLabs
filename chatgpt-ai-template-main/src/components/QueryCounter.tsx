'use client';
import React from 'react';
import { Box, Flex, Text, Badge, Button, useColorModeValue } from '@chakra-ui/react';
import { MdStar, MdLock } from 'react-icons/md';

interface QueryCounterProps {
  remaining: number;
  isPro: boolean;
  onUpgrade?: () => void;
}

export const QueryCounter: React.FC<QueryCounterProps> = ({ remaining, isPro, onUpgrade }) => {
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.700', 'white');
  const warningColor = remaining <= 1 ? 'red.500' : remaining <= 2 ? 'orange.500' : 'green.500';

  if (isPro) {
    return (
      <Flex
        bg={bgColor}
        border="1px solid"
        borderColor={borderColor}
        borderRadius="full"
        px="16px"
        py="8px"
        align="center"
        gap="8px"
      >
        <MdStar color="gold" size="18px" />
        <Text fontSize="sm" fontWeight="600" color={textColor}>
          Pro Member
        </Text>
        <Badge colorScheme="purple" variant="subtle" borderRadius="full" px="8px">
          Unlimited
        </Badge>
      </Flex>
    );
  }

  return (
    <Flex
      bg={bgColor}
      border="1px solid"
      borderColor={borderColor}
      borderRadius="full"
      px="16px"
      py="8px"
      align="center"
      gap="12px"
    >
      <Flex align="center" gap="6px">
        <Text fontSize="sm" fontWeight="600" color={textColor}>
          Queries:
        </Text>
        <Badge colorScheme={remaining <= 1 ? 'red' : remaining <= 2 ? 'orange' : 'green'} borderRadius="full" px="8px">
          {remaining} / 5
        </Badge>
      </Flex>
      
      {remaining <= 2 && (
        <Button
          size="sm"
          colorScheme="purple"
          variant="solid"
          borderRadius="full"
          leftIcon={<MdStar />}
          onClick={onUpgrade}
          fontSize="xs"
          px="12px"
          h="28px"
        >
          Upgrade to Pro
        </Button>
      )}
    </Flex>
  );
};

interface QueryLimitModalProps {
  isOpen: boolean;
  onUpgrade?: () => void;
}

export const QueryLimitReachedBanner: React.FC<QueryLimitModalProps> = ({ isOpen, onUpgrade }) => {
  const bgColor = useColorModeValue('red.50', 'red.900');
  const borderColor = useColorModeValue('red.200', 'red.700');
  const textColor = useColorModeValue('red.800', 'red.100');

  if (!isOpen) return null;

  return (
    <Box
      bg={bgColor}
      border="2px solid"
      borderColor={borderColor}
      borderRadius="lg"
      p="20px"
      maxW="600px"
      textAlign="center"
      boxShadow="lg"
    >
      <Flex direction="column" align="center" gap="16px">
        <MdLock size="48px" color="currentColor" />
        <Box>
          <Text fontSize="xl" fontWeight="700" color={textColor} mb="8px">
            Query Limit Reached
          </Text>
          <Text fontSize="sm" color={textColor} mb="16px">
            You've used all 5 free queries. Upgrade to Pro for unlimited access!
          </Text>
        </Box>
        <Button
          size="lg"
          colorScheme="purple"
          variant="solid"
          borderRadius="full"
          leftIcon={<MdStar />}
          onClick={onUpgrade}
          w="full"
          maxW="300px"
        >
          Upgrade to Pro - Unlimited Queries
        </Button>
        <Text fontSize="xs" color={textColor} opacity={0.7}>
          Supporting our backend costs helps keep this service running! 💜
        </Text>
      </Flex>
    </Box>
  );
};
