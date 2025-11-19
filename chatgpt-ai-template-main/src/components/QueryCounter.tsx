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
        px={{ base: '12px', md: '16px' }}
        py={{ base: '6px', md: '8px' }}
        align="center"
        gap={{ base: '6px', md: '8px' }}
      >
        <MdStar color="gold" size="18px" />
        <Text fontSize={{ base: 'xs', md: 'sm' }} fontWeight="600" color={textColor}>
          Pro Member
        </Text>
        <Badge colorScheme="purple" variant="subtle" borderRadius="full" px={{ base: '6px', md: '8px' }} fontSize={{ base: '10px', md: '11px' }}>
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
      px={{ base: '12px', md: '16px' }}
      py={{ base: '6px', md: '8px' }}
      align="center"
      gap={{ base: '8px', md: '12px' }}
      flexWrap="wrap"
      justifyContent="center"
    >
      <Flex align="center" gap={{ base: '4px', md: '6px' }}>
        <Text fontSize={{ base: 'xs', md: 'sm' }} fontWeight="600" color={textColor}>
          Queries:
        </Text>
        <Badge colorScheme={remaining <= 1 ? 'red' : remaining <= 2 ? 'orange' : 'green'} borderRadius="full" px={{ base: '6px', md: '8px' }} fontSize={{ base: '10px', md: '11px' }}>
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
          fontSize={{ base: '10px', md: 'xs' }}
          px={{ base: '10px', md: '12px' }}
          h={{ base: '26px', md: '28px' }}
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
      p={{ base: '16px', md: '20px', lg: '24px' }}
      maxW="600px"
      textAlign="center"
      boxShadow="lg"
    >
      <Flex direction="column" align="center" gap={{ base: '12px', md: '16px' }}>
        <MdLock size="48px" color="currentColor" />
        <Box>
          <Text fontSize={{ base: 'lg', md: 'xl' }} fontWeight="700" color={textColor} mb={{ base: '6px', md: '8px' }}>
            Query Limit Reached
          </Text>
          <Text fontSize={{ base: 'sm', md: 'md' }} color={textColor} mb={{ base: '12px', md: '16px' }} px={{ base: '2', md: '0' }}>
            You've used all 5 free queries. Upgrade to Pro for unlimited access!
          </Text>
        </Box>
        <Button
          size={{ base: 'md', md: 'lg' }}
          colorScheme="purple"
          variant="solid"
          borderRadius="full"
          leftIcon={<MdStar />}
          onClick={onUpgrade}
          w="full"
          maxW={{ base: '280px', md: '320px' }}
        >
          Upgrade to Pro - Unlimited Queries
        </Button>
        <Text fontSize={{ base: '2xs', md: 'xs' }} color={textColor} opacity={0.7} px={{ base: '4', md: '0' }}>
          Supporting our backend costs helps keep this service running! 💜
        </Text>
      </Flex>
    </Box>
  );
};
