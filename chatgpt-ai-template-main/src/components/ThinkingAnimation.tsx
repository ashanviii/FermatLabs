import React, { useState, useEffect } from 'react';
import { Text, Flex, useColorModeValue, VStack, HStack, Icon, Circle, Box } from '@chakra-ui/react';
import { MdAutoAwesome, MdSearch, MdAnalytics } from 'react-icons/md';

interface ThinkingAnimationProps {
  text?: string;
  isTransitioning?: boolean;
  detailed?: boolean;
}

export default function ThinkingAnimation({ text = 'Thinking', isTransitioning = false, detailed = false }: ThinkingAnimationProps) {
  const [dots, setDots] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const [currentPhase, setCurrentPhase] = useState(0);
  const textColor = useColorModeValue('navy.700', 'white');

  const phases = [
    { icon: MdSearch, text: 'Analyzing your question...', color: 'purple.500' },
    { icon: MdAutoAwesome, text: 'AI agents working...', color: 'pink.500' },
    { icon: MdAnalytics, text: 'Compiling answer...', color: 'blue.500' }
  ];

  useEffect(() => {
    // Smooth transition delay
    const timer = setTimeout(() => setIsVisible(true), isTransitioning ? 200 : 0);
    return () => clearTimeout(timer);
  }, [isTransitioning]);

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => (prev === '...' ? '' : prev + '.'));
    }, 600);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (detailed) {
      const phaseInterval = setInterval(() => {
        setCurrentPhase(prev => (prev + 1) % phases.length);
      }, 2000);
      return () => clearInterval(phaseInterval);
    }
  }, [detailed]);

  if (detailed) {
    return (
      <VStack
        spacing={4}
        opacity={isVisible ? 1 : 0}
        transform={isVisible ? 'translateY(0)' : 'translateY(10px)'}
        transition="all 0.5s cubic-bezier(0.4, 0, 0.2, 1)"
      >
        <HStack spacing={3}>
          <Circle 
            size="40px" 
            bg={phases[currentPhase].color}
            animation="pulse 2s ease-in-out infinite"
            sx={{
              '@keyframes pulse': {
                '0%, 100%': { transform: 'scale(1)', opacity: 1 },
                '50%': { transform: 'scale(1.1)', opacity: 0.8 }
              }
            }}
          >
            <Icon as={phases[currentPhase].icon} color="white" w="20px" h="20px" />
          </Circle>
          <Text color={textColor} fontSize={{ base: 'sm', md: 'md' }} fontWeight="600">
            {phases[currentPhase].text}
          </Text>
        </HStack>
        
        {/* Progress dots */}
        <HStack spacing={2}>
          {phases.map((_, index) => (
            <Box
              key={index}
              w="8px"
              h="8px"
              borderRadius="full"
              bg={index === currentPhase ? phases[currentPhase].color : 'gray.300'}
              transition="all 0.3s"
            />
          ))}
        </HStack>
      </VStack>
    );
  }

  return (
    <Flex
      alignItems="center"
      gap={{ base: '6px', md: '8px' }}
      opacity={isVisible ? 1 : 0}
      transform={isVisible ? 'translateY(0)' : 'translateY(10px)'}
      transition="all 0.5s cubic-bezier(0.4, 0, 0.2, 1)"
    >
      <Text color={textColor} fontSize={{ base: 'sm', md: 'md' }} fontWeight="500">
        {text}
      </Text>

      <Flex gap={{ base: '1px', md: '2px' }} minW="20px" alignItems="center" height="20px">
        {[0, 1, 2].map(index => (
          <Text
            key={index}
            as="span"
            color={textColor}
            fontSize={{ base: 'md', md: 'lg' }}
            fontWeight="bold"
            animation={isVisible ? `bounce 1.4s ease-in-out ${index * 0.2}s infinite` : 'none'}
            sx={{
              '@keyframes bounce': {
                '0%, 80%, 100%': {
                  transform: 'scale(0)',
                  opacity: 0.3,
                },
                '40%': {
                  transform: 'scale(1)',
                  opacity: 1,
                },
              },
            }}
          >
            •
          </Text>
        ))}
      </Flex>
    </Flex>
  );
}
