'use client';
import { Box, Flex, Text, Icon, Circle, VStack, HStack } from '@chakra-ui/react';
import { MdCheckCircle, MdRadioButtonUnchecked, MdAutoAwesome } from 'react-icons/md';
import { FaSearch, FaFileAlt, FaLightbulb, FaCheckCircle } from 'react-icons/fa';

export interface AgentStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'active' | 'completed';
  icon?: any;
}

interface AgentWorkflowProps {
  steps: AgentStep[];
  currentStep?: number;
}

export default function AgentWorkflow({ steps, currentStep = 0 }: AgentWorkflowProps) {
  const getStepIcon = (step: AgentStep, index: number) => {
    if (step.icon) return step.icon;
    
    const defaultIcons = [FaSearch, FaFileAlt, FaLightbulb, FaCheckCircle];
    return defaultIcons[index % defaultIcons.length];
  };

  const getStepColor = (status: string) => {
    switch (status) {
      case 'completed': return 'green.500';
      case 'active': return 'purple.500';
      default: return 'gray.300';
    }
  };

  const getStepBg = (status: string) => {
    switch (status) {
      case 'completed': return 'green.50';
      case 'active': return 'purple.50';
      default: return 'gray.50';
    }
  };

  return (
    <Box
      w="100%"
      maxW="1000px"
      bg="white"
      border="2px solid"
      borderColor="purple.100"
      borderRadius="24px"
      p={{ base: '24px', md: '36px' }}
      boxShadow="0 8px 32px rgba(139, 92, 246, 0.15), 0 2px 8px rgba(0, 0, 0, 0.08)"
      position="relative"
      overflow="hidden"
      transition="all 0.3s ease"
      _hover={{
        boxShadow: '0 12px 40px rgba(139, 92, 246, 0.2), 0 4px 12px rgba(0, 0, 0, 0.1)'
      }}
      _before={{
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '4px',
        bgGradient: 'linear(to-r, purple.400, pink.400, purple.500)',
        animation: 'shimmer 3s linear infinite',
      }}
      sx={{
        '@keyframes shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' }
        }
      }}
    >
      {/* Header */}
      <Flex align="center" gap={3} mb={8}>
        <Circle
          size="48px"
          bg="purple.500"
          boxShadow="0 4px 16px rgba(139, 92, 246, 0.4)"
        >
          <Icon 
            as={MdAutoAwesome} 
            w="26px" 
            h="26px" 
            color="white"
            animation="pulse 2s ease-in-out infinite"
            sx={{
              '@keyframes pulse': {
                '0%, 100%': { transform: 'scale(1) rotate(0deg)', opacity: 1 },
                '50%': { transform: 'scale(1.15) rotate(5deg)', opacity: 0.9 }
              }
            }}
          />
        </Circle>
        <Box>
          <Text fontSize={{ base: 'xl', md: '2xl' }} fontWeight="800" color="gray.800" lineHeight="1.2">
            AI Agent in Action
          </Text>
          <Text fontSize="sm" color="purple.600" fontWeight="600" mt={1}>
            Processing your travel request intelligently
          </Text>
        </Box>
      </Flex>

      {/* Steps */}
      <VStack align="stretch" spacing={0} position="relative">
        {steps.map((step, index) => (
          <Box key={step.id} position="relative">
            {/* Connector line */}
            {index < steps.length - 1 && (
              <Box
                position="absolute"
                left="19px"
                top="40px"
                bottom="-20px"
                w="2px"
                bg={step.status === 'completed' ? 'green.300' : 'gray.200'}
                transition="all 0.3s ease"
              />
            )}

            {/* Step Card */}
            <Flex
              align="flex-start"
              gap={5}
              p={{ base: 4, md: 5 }}
              mb={4}
              borderRadius="16px"
              bg={getStepBg(step.status)}
              border="2px solid"
              borderColor={step.status === 'active' ? 'purple.400' : step.status === 'completed' ? 'green.200' : 'gray.200'}
              transition="all 0.4s cubic-bezier(0.4, 0, 0.2, 1)"
              transform={step.status === 'active' ? 'scale(1.03) translateX(8px)' : 'scale(1)'}
              boxShadow={
                step.status === 'active' 
                  ? '0 8px 24px rgba(139, 92, 246, 0.25), 0 0 0 3px rgba(139, 92, 246, 0.1)' 
                  : step.status === 'completed'
                  ? '0 2px 8px rgba(34, 197, 94, 0.1)'
                  : 'none'
              }
              _hover={{
                transform: step.status === 'active' ? 'scale(1.03) translateX(8px)' : 'scale(1.01)',
                boxShadow: step.status === 'active' 
                  ? '0 12px 32px rgba(139, 92, 246, 0.3), 0 0 0 3px rgba(139, 92, 246, 0.15)'
                  : '0 4px 12px rgba(0, 0, 0, 0.1)'
              }}
              position="relative"
              overflow="hidden"
            >
              {/* Active step shimmer effect */}
              {step.status === 'active' && (
                <Box
                  position="absolute"
                  top="0"
                  left="-100%"
                  right="0"
                  bottom="0"
                  bgGradient="linear(to-r, transparent, rgba(255, 255, 255, 0.4), transparent)"
                  animation="shimmer 2s infinite"
                  sx={{
                    '@keyframes shimmer': {
                      '0%': { left: '-100%' },
                      '100%': { left: '100%' }
                    }
                  }}
                />
              )}

              {/* Step Icon */}
              <Circle
                size="52px"
                bg={step.status === 'completed' ? 'green.500' : step.status === 'active' ? 'purple.500' : 'gray.300'}
                color="white"
                flexShrink={0}
                position="relative"
                transition="all 0.4s ease"
                boxShadow={
                  step.status === 'active' 
                    ? '0 4px 16px rgba(139, 92, 246, 0.5)' 
                    : step.status === 'completed'
                    ? '0 2px 8px rgba(34, 197, 94, 0.4)'
                    : 'none'
                }
              >
                {step.status === 'completed' ? (
                  <Icon 
                    as={MdCheckCircle} 
                    w="28px" 
                    h="28px"
                    animation="scaleIn 0.3s ease-out"
                    sx={{
                      '@keyframes scaleIn': {
                        '0%': { transform: 'scale(0)' },
                        '50%': { transform: 'scale(1.2)' },
                        '100%': { transform: 'scale(1)' }
                      }
                    }}
                  />
                ) : step.status === 'active' ? (
                  <Icon 
                    as={getStepIcon(step, index)} 
                    w="24px" 
                    h="24px"
                    animation="bounce 1.2s ease-in-out infinite"
                    sx={{
                      '@keyframes bounce': {
                        '0%, 100%': { transform: 'translateY(0) scale(1)' },
                        '50%': { transform: 'translateY(-4px) scale(1.05)' }
                      }
                    }}
                  />
                ) : (
                  <Icon as={MdRadioButtonUnchecked} w="24px" h="24px" opacity={0.6} />
                )}
                
                {/* Enhanced pulse ring for active step */}
                {step.status === 'active' && (
                  <>
                    <Box
                      position="absolute"
                      top="-2px"
                      left="-2px"
                      right="-2px"
                      bottom="-2px"
                      borderRadius="full"
                      border="3px solid"
                      borderColor="purple.400"
                      animation="ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite"
                      sx={{
                        '@keyframes ping': {
                          '0%': { transform: 'scale(1)', opacity: 1 },
                          '75%, 100%': { transform: 'scale(1.6)', opacity: 0 }
                        }
                      }}
                    />
                    <Box
                      position="absolute"
                      top="-2px"
                      left="-2px"
                      right="-2px"
                      bottom="-2px"
                      borderRadius="full"
                      border="3px solid"
                      borderColor="purple.300"
                      animation="ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite 0.5s"
                      sx={{
                        '@keyframes ping': {
                          '0%': { transform: 'scale(1)', opacity: 1 },
                          '75%, 100%': { transform: 'scale(1.6)', opacity: 0 }
                        }
                      }}
                    />
                  </>
                )}
              </Circle>

              {/* Step Content */}
              <VStack align="flex-start" spacing={2} flex={1} zIndex={1}>
                <Text
                  fontSize={{ base: 'lg', md: 'xl' }}
                  fontWeight="800"
                  color={step.status === 'pending' ? 'gray.400' : step.status === 'active' ? 'purple.700' : 'gray.800'}
                  transition="all 0.3s ease"
                >
                  {step.title}
                </Text>
                <Text
                  fontSize={{ base: 'sm', md: 'md' }}
                  color={step.status === 'pending' ? 'gray.400' : step.status === 'active' ? 'purple.600' : 'gray.600'}
                  lineHeight="1.6"
                  fontWeight={step.status === 'active' ? '600' : '500'}
                >
                  {step.description}
                </Text>
                
                {/* Active step indicator with animated dots */}
                {step.status === 'active' && (
                  <Flex align="center" gap={2} mt={1}>
                    <Text fontSize="xs" fontWeight="700" color="purple.600">
                      PROCESSING
                    </Text>
                    <Flex gap={1}>
                      {[0, 1, 2].map((i) => (
                        <Circle
                          key={i}
                          size="4px"
                          bg="purple.500"
                          animation={`bounce 1.4s ease-in-out ${i * 0.2}s infinite`}
                          sx={{
                            '@keyframes bounce': {
                              '0%, 80%, 100%': { transform: 'scale(0)' },
                              '40%': { transform: 'scale(1)' }
                            }
                          }}
                        />
                      ))}
                    </Flex>
                  </Flex>
                )}
              </VStack>

              {/* Status Badge */}
              {step.status === 'completed' && (
                <Box
                  px={3}
                  py={1.5}
                  borderRadius="full"
                  bg="green.100"
                  border="1px solid"
                  borderColor="green.300"
                  alignSelf="flex-start"
                  animation="fadeIn 0.3s ease-out"
                  sx={{
                    '@keyframes fadeIn': {
                      '0%': { opacity: 0, transform: 'scale(0.8)' },
                      '100%': { opacity: 1, transform: 'scale(1)' }
                    }
                  }}
                >
                  <Flex align="center" gap={1.5}>
                    <Icon as={MdCheckCircle} w="14px" h="14px" color="green.600" />
                    <Text fontSize="xs" fontWeight="700" color="green.700">
                      DONE
                    </Text>
                  </Flex>
                </Box>
              )}
              
              {step.status === 'active' && (
                <Box
                  px={3}
                  py={1.5}
                  borderRadius="full"
                  bgGradient="linear(to-r, purple.500, pink.500)"
                  boxShadow="0 2px 8px rgba(139, 92, 246, 0.4)"
                  alignSelf="flex-start"
                  animation="pulse 2s ease-in-out infinite"
                  sx={{
                    '@keyframes pulse': {
                      '0%, 100%': { opacity: 1 },
                      '50%': { opacity: 0.8 }
                    }
                  }}
                >
                  <Text fontSize="xs" fontWeight="700" color="white">
                    ACTIVE
                  </Text>
                </Box>
              )}
              {step.status === 'completed' && (
                <Box
                  px={3}
                  py={1}
                  borderRadius="full"
                  bg="green.100"
                  border="1px solid"
                  borderColor="green.300"
                >
                  <Text fontSize="xs" fontWeight="600" color="green.700">
                    Done
                  </Text>
                </Box>
              )}
            </Flex>
          </Box>
        ))}
      </VStack>
    </Box>
  );
}
