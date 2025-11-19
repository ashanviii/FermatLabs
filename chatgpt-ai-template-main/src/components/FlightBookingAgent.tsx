'use client';
import { Box, Flex, Text, Icon, VStack, HStack, Badge, Progress, Button } from '@chakra-ui/react';
import { MdFlight, MdSearch, MdCompareArrows, MdCheckCircle, MdAccessTime } from 'react-icons/md';
import { FaPlane, FaCalendar, FaUsers, FaDollarSign } from 'react-icons/fa';
import { useEffect, useState } from 'react';

export interface FlightBookingStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'active' | 'completed';
  icon: any;
  details?: string[];
}

interface FlightBookingAgentProps {
  steps: FlightBookingStep[];
  currentStep: number;
  onComplete?: () => void;
}

export default function FlightBookingAgent({ steps, currentStep, onComplete }: FlightBookingAgentProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const progressPercent = ((currentStep + 1) / steps.length) * 100;
    setProgress(progressPercent);

    if (currentStep >= steps.length - 1 && onComplete) {
      setTimeout(() => onComplete(), 1000);
    }
  }, [currentStep, steps.length, onComplete]);

  const getStepIcon = (step: FlightBookingStep) => {
    if (step.status === 'completed') return MdCheckCircle;
    return step.icon || MdFlight;
  };

  const getStepColor = (status: string) => {
    switch (status) {
      case 'completed': return 'green.400';
      case 'active': return 'blue.400';
      default: return 'gray.500';
    }
  };

  return (
    <Box
      bg="rgba(255, 255, 255, 0.95)"
      backdropFilter="blur(20px)"
      borderRadius="24px"
      p={{ base: '20px', md: '32px' }}
      boxShadow="0 8px 32px rgba(0, 0, 0, 0.08)"
      border="1px solid"
      borderColor="rgba(200, 200, 220, 0.3)"
      position="relative"
      overflow="hidden"
      _before={{
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '4px',
        bgGradient: 'linear(to-r, blue.400, purple.500, pink.400)',
        animation: 'shimmer 2s linear infinite'
      }}
      sx={{
        '@keyframes shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' }
        }
      }}
    >
      {/* Header */}
      <Flex align="center" mb="24px" gap="12px">
        <Flex
          bg="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
          borderRadius="12px"
          w="48px"
          h="48px"
          align="center"
          justify="center"
          boxShadow="0 4px 12px rgba(102, 126, 234, 0.3)"
        >
          <Icon as={FaPlane} color="white" w="24px" h="24px" />
        </Flex>
        <VStack align="start" spacing="0">
          <Text fontSize="lg" fontWeight="700" color="gray.800">
            Flight Booking Agent
          </Text>
          <Text fontSize="sm" color="gray.600">
            Finding the best flights for you
          </Text>
        </VStack>
        <Badge
          ml="auto"
          colorScheme="purple"
          fontSize="xs"
          px="12px"
          py="4px"
          borderRadius="full"
        >
          AI Powered
        </Badge>
      </Flex>

      {/* Progress Bar */}
      <Box mb="28px">
        <Flex justify="space-between" mb="8px">
          <Text fontSize="sm" fontWeight="600" color="gray.700">
            Progress
          </Text>
          <Text fontSize="sm" fontWeight="700" color="purple.600">
            {Math.round(progress)}%
          </Text>
        </Flex>
        <Progress
          value={progress}
          size="sm"
          borderRadius="full"
          colorScheme="purple"
          bg="gray.200"
          hasStripe
          isAnimated
        />
      </Box>

      {/* Workflow Steps */}
      <VStack spacing="16px" align="stretch">
        {steps.map((step, index) => (
          <Flex
            key={step.id}
            align="start"
            gap="16px"
            p="16px"
            borderRadius="16px"
            bg={step.status === 'active' ? 'rgba(102, 126, 234, 0.05)' : 'transparent'}
            border="1px solid"
            borderColor={step.status === 'active' ? 'purple.200' : 'transparent'}
            transition="all 0.3s ease"
            position="relative"
            _hover={{
              bg: step.status === 'completed' ? 'rgba(72, 187, 120, 0.05)' : 'rgba(102, 126, 234, 0.05)'
            }}
          >
            {/* Step Icon */}
            <Flex
              minW="40px"
              h="40px"
              borderRadius="12px"
              align="center"
              justify="center"
              bg={step.status === 'active' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 
                  step.status === 'completed' ? 'green.400' : 'gray.300'}
              position="relative"
              boxShadow={step.status === 'active' ? '0 0 20px rgba(102, 126, 234, 0.4)' : 'none'}
              transition="all 0.3s ease"
            >
              <Icon
                as={getStepIcon(step)}
                color="white"
                w="20px"
                h="20px"
                animation={step.status === 'active' ? 'spin 2s linear infinite' : 'none'}
                sx={{
                  '@keyframes spin': {
                    '0%': { transform: 'rotate(0deg)' },
                    '100%': { transform: 'rotate(360deg)' }
                  }
                }}
              />
              {step.status === 'active' && (
                <Box
                  position="absolute"
                  top="-2px"
                  right="-2px"
                  bottom="-2px"
                  left="-2px"
                  borderRadius="12px"
                  border="2px solid"
                  borderColor="purple.400"
                  animation="pulse 2s ease-in-out infinite"
                  sx={{
                    '@keyframes pulse': {
                      '0%, 100%': { opacity: 0.4, transform: 'scale(1)' },
                      '50%': { opacity: 1, transform: 'scale(1.05)' }
                    }
                  }}
                />
              )}
            </Flex>

            {/* Step Content */}
            <VStack align="start" spacing="4px" flex="1">
              <HStack>
                <Text
                  fontSize="md"
                  fontWeight="700"
                  color={step.status === 'completed' ? 'green.600' : 
                         step.status === 'active' ? 'purple.700' : 'gray.600'}
                >
                  {step.title}
                </Text>
                {step.status === 'active' && (
                  <Badge colorScheme="purple" fontSize="xs">
                    In Progress
                  </Badge>
                )}
                {step.status === 'completed' && (
                  <Badge colorScheme="green" fontSize="xs">
                    Done
                  </Badge>
                )}
              </HStack>
              <Text fontSize="sm" color="gray.600">
                {step.description}
              </Text>
              
              {/* Step Details */}
              {step.details && step.details.length > 0 && step.status === 'active' && (
                <VStack align="start" spacing="6px" mt="8px" pl="12px">
                  {step.details.map((detail, idx) => (
                    <HStack key={idx} spacing="8px">
                      <Box
                        w="6px"
                        h="6px"
                        borderRadius="full"
                        bg="purple.400"
                        animation="pulse 1.5s ease-in-out infinite"
                        sx={{
                          animationDelay: `${idx * 0.2}s`
                        }}
                      />
                      <Text fontSize="xs" color="gray.700" fontWeight="500">
                        {detail}
                      </Text>
                    </HStack>
                  ))}
                </VStack>
              )}
            </VStack>

            {/* Step Number Badge */}
            <Badge
              colorScheme={step.status === 'completed' ? 'green' : 
                          step.status === 'active' ? 'purple' : 'gray'}
              fontSize="xs"
              borderRadius="full"
              px="8px"
            >
              {index + 1}
            </Badge>
          </Flex>
        ))}
      </VStack>
    </Box>
  );
}
