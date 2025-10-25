import React, { useState, useEffect } from 'react';
import { Text, Flex, useColorModeValue } from '@chakra-ui/react';

interface ThinkingAnimationProps {
  text?: string;
  isTransitioning?: boolean;
}

export default function ThinkingAnimation({ text = 'Thinking', isTransitioning = false }: ThinkingAnimationProps) {
  const [dots, setDots] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const textColor = useColorModeValue('navy.700', 'white');

  useEffect(() => {
    // Delay the appearance for smooth transition
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, isTransitioning ? 200 : 0);

    return () => clearTimeout(timer);
  }, [isTransitioning]);

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => {
        if (prev === '...') {
          return '';
        }
        return prev + '.';
      });
    }, 600); // Change dots every 600ms

    return () => clearInterval(interval);
  }, []);

  return (
    <Flex 
      alignItems="center"
      gap="8px"
      opacity={isVisible ? 1 : 0}
      transform={isVisible ? 'translateY(0)' : 'translateY(10px)'}
      transition="all 0.5s cubic-bezier(0.4, 0, 0.2, 1)"
    >
      <Text 
        color={textColor} 
        fontSize="md" 
        fontWeight="500"
      >
        {text}
      </Text>
      
      {/* Animated dots */}
      <Flex gap="2px" minW="20px" alignItems="center" height="20px">
        {[0, 1, 2].map((index) => (
          <Text
            key={index}
            as="span"
            color={textColor}
            fontSize="lg"
            fontWeight="bold"
            animation={isVisible ? `bounce 1.4s ease-in-out ${index * 0.2}s infinite` : 'none'}
            sx={{
              '@keyframes bounce': {
                '0%, 80%, 100%': { 
                  transform: 'scale(0)',
                  opacity: 0.3
                },
                '40%': { 
                  transform: 'scale(1)',
                  opacity: 1
                }
              }
            }}
          >
            •
          </Text>
        ))}
      </Flex>
    </Flex>
  );
}