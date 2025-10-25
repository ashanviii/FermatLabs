import React, { useState, useEffect } from 'react';
import { Text, Flex, useColorModeValue } from '@chakra-ui/react';

interface ThinkingAnimationProps {
  text?: string;
}

export default function ThinkingAnimation({ text = 'Thinking' }: ThinkingAnimationProps) {
  const [dots, setDots] = useState('');
  const textColor = useColorModeValue('navy.700', 'white');

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
            animation={`bounce 1.4s ease-in-out ${index * 0.2}s infinite`}
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
      
      {/* Subtle pulse effect on the text */}
      <Text
        as="span"
        animation="textPulse 2s ease-in-out infinite"
        sx={{
          '@keyframes textPulse': {
            '0%, 100%': { opacity: 1 },
            '50%': { opacity: 0.7 }
          }
        }}
      >
        
      </Text>
    </Flex>
  );
}