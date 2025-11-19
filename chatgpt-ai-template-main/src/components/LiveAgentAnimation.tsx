import React, { useState, useEffect } from 'react';
import { Box, Flex, Text, VStack, HStack, Icon } from '@chakra-ui/react';
import { keyframes } from '@emotion/react';
import { 
  MdCheckCircle, 
  MdRadioButtonChecked, 
  MdCircle,
  MdAutoAwesome,
  MdSearch,
  MdAnalytics,
} from 'react-icons/md';

interface AgentStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'active' | 'completed';
}

interface LiveAgentAnimationProps {
  steps: AgentStep[];
  currentStep: number;
  compact?: boolean;
}

// Smooth pulse animation for active step
const pulseAnimation = keyframes`
  0%, 100% { 
    transform: scale(1);
    opacity: 1;
  }
  50% { 
    transform: scale(1.15);
    opacity: 0.8;
  }
`;

// Shimmer effect for active step background
const shimmerAnimation = keyframes`
  0% {
    background-position: -1000px 0;
  }
  100% {
    background-position: 1000px 0;
  }
`;

// Three dots bouncing animation
const bounceAnimation = keyframes`
  0%, 80%, 100% {
    transform: scale(0);
    opacity: 0.3;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
`;

// Glow animation
const glowAnimation = keyframes`
  0%, 100% {
    box-shadow: 0 0 5px rgba(128, 90, 213, 0.3), 0 0 10px rgba(128, 90, 213, 0.2);
  }
  50% {
    box-shadow: 0 0 15px rgba(128, 90, 213, 0.6), 0 0 25px rgba(128, 90, 213, 0.4);
  }
`;

export default function LiveAgentAnimation({ 
  steps, 
  currentStep,
  compact = false 
}: LiveAgentAnimationProps) {
  const [dots, setDots] = useState('');
  const activeStep = steps[currentStep];

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => (prev === '...' ? '' : prev + '.'));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  if (!activeStep) return null;

  // Get icon based on step content
  const getStepIcon = () => {
    const title = activeStep.title.toLowerCase();
    if (title.includes('search') || title.includes('finding')) return MdSearch;
    if (title.includes('analyz') || title.includes('evaluat')) return MdAnalytics;
    return MdAutoAwesome;
  };

  const StepIcon = getStepIcon();

  return (
    <VStack
      spacing={4}
      w="full"
      py={6}
      px={5}
      borderRadius="2xl"
      bg="rgba(0, 0, 0, 0.6)"
      backdropFilter="blur(20px)"
      border="1px solid"
      borderColor="purple.400"
      position="relative"
      overflow="hidden"
      boxShadow="0 8px 32px rgba(128, 90, 213, 0.3)"
      _before={{
        content: '""',
        position: 'absolute',
        top: 0,
        left: '-100%',
        width: '100%',
        height: '100%',
        background: 'linear-gradient(90deg, transparent, rgba(128, 90, 213, 0.2), transparent)',
        animation: `${shimmerAnimation} 3s linear infinite`,
      }}
    >
      {/* Header with three dots */}
      <HStack justify="space-between" w="full" position="relative" zIndex={1}>
        <HStack spacing={3}>
          <Box
            p={2}
            borderRadius="lg"
            bg="purple.500"
            animation={`${pulseAnimation} 2s ease-in-out infinite`}
          >
            <Icon as={StepIcon} color="white" w="20px" h="20px" />
          </Box>
          <VStack align="start" spacing={0}>
            <HStack spacing={2}>
              <Text 
                fontSize="sm" 
                fontWeight="700" 
                color="white"
                letterSpacing="wide"
              >
                AI AGENT WORKING
              </Text>
              {/* Three dots animation */}
              <Flex gap="2px" alignItems="center" height="20px">
                {[0, 1, 2].map(index => (
                  <Text
                    key={index}
                    as="span"
                    color="purple.300"
                    fontSize="lg"
                    fontWeight="bold"
                    animation={`${bounceAnimation} 1.4s ease-in-out ${index * 0.2}s infinite`}
                  >
                    •
                  </Text>
                ))}
              </Flex>
            </HStack>
            <Text fontSize="xs" color="gray.300" fontWeight="600">
              Step {currentStep + 1} of {steps.length}
            </Text>
          </VStack>
        </HStack>
      </HStack>

      {/* Current Step Display - Sleek & Modern */}
      <Box
        w="full"
        p={4}
        borderRadius="xl"
        bg="rgba(0, 0, 0, 0.3)"
        border="1px solid"
        borderColor="purple.400"
        position="relative"
        overflow="hidden"
        backdropFilter="blur(10px)"
        _before={{
          content: '""',
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: '4px',
          bg: 'linear-gradient(180deg, #805AD5, #D53F8C)',
          animation: `${pulseAnimation} 2s ease-in-out infinite`,
        }}
      >
        <VStack align="start" spacing={2} pl={3}>
          <Text
            fontSize="md"
            fontWeight="700"
            color="white"
            lineHeight="1.4"
          >
            {activeStep.title}
          </Text>
          <Text
            fontSize="sm"
            color="gray.200"
            lineHeight="1.5"
          >
            {activeStep.description}
          </Text>
        </VStack>
      </Box>

      {/* Mini progress indicators for all steps */}
      <HStack spacing={2} w="full" justify="center" position="relative" zIndex={1}>
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isActive = index === currentStep;
          const isPending = index > currentStep;

          return (
            <Box
              key={step.id}
              position="relative"
              role="group"
            >
              <Box
                w={isActive ? "32px" : "12px"}
                h="12px"
                borderRadius="full"
                bg={
                  isCompleted 
                    ? 'green.400' 
                    : isActive 
                    ? 'purple.400' 
                    : 'gray.600'
                }
                transition="all 0.3s ease"
                animation={isActive ? `${pulseAnimation} 2s ease-in-out infinite` : 'none'}
              />
              {/* Tooltip on hover */}
              <Box
                position="absolute"
                bottom="calc(100% + 8px)"
                left="50%"
                transform="translateX(-50%)"
                bg="gray.800"
                color="white"
                px={3}
                py={2}
                borderRadius="md"
                fontSize="xs"
                whiteSpace="nowrap"
                opacity={0}
                pointerEvents="none"
                transition="opacity 0.2s"
                _groupHover={{ opacity: 1 }}
                zIndex="tooltip"
                boxShadow="lg"
              >
                {step.title}
                <Box
                  position="absolute"
                  top="100%"
                  left="50%"
                  transform="translateX(-50%)"
                  width={0}
                  height={0}
                  borderLeft="4px solid transparent"
                  borderRight="4px solid transparent"
                  borderTop="4px solid"
                  borderTopColor="gray.800"
                />
              </Box>
            </Box>
          );
        })}
      </HStack>

      {/* Progress bar */}
      <Box w="full" h="3px" bg="whiteAlpha.200" borderRadius="full" overflow="hidden" position="relative" zIndex={1}>
        <Box
          h="full"
          bg="linear-gradient(90deg, #805AD5, #D53F8C, #805AD5)"
          backgroundSize="200% 100%"
          animation={`${shimmerAnimation} 2s linear infinite`}
          w={`${((currentStep + 1) / steps.length) * 100}%`}
          transition="width 0.5s ease-out"
        />
      </Box>
    </VStack>
  );
}
