import React, { useState, useEffect } from 'react';
import {
  Box,
  Circle,
  Text,
  VStack,
  HStack,
  Progress,
  Fade,
  ScaleFade,
  useColorModeValue,
} from '@chakra-ui/react';
import { SearchIcon } from '@chakra-ui/icons';

interface CompactSearchIndicatorProps {
  isSearching: boolean;
  query: string;
  onComplete?: () => void;
}

const CompactSearchIndicator: React.FC<CompactSearchIndicatorProps> = ({
  isSearching,
  query,
  onComplete
}) => {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('blue.200', 'blue.600');

  const steps = [
    '🔍 Searching...',
    '🌐 Finding results...',
    '✨ Almost done...',
    '✅ Complete!'
  ];

  useEffect(() => {
    if (isSearching) {
      setProgress(0);
      setCurrentStep(steps[0]);
      
      // Simulate search progress
      const timer = setInterval(() => {
        setProgress(prev => {
          const newProgress = prev + 25;
          const stepIndex = Math.floor(newProgress / 25);
          if (stepIndex < steps.length) {
            setCurrentStep(steps[stepIndex]);
          }
          
          if (newProgress >= 100) {
            clearInterval(timer);
            setTimeout(() => {
              if (onComplete) onComplete();
            }, 500);
            return 100;
          }
          return newProgress;
        });
      }, 800);

      return () => clearInterval(timer);
    }
  }, [isSearching]);

  if (!isSearching) return null;

  return (
    <Box
      position="fixed"
      top="30px"
      right="30px"
      zIndex={9999}
    >
      {/* Simple Search Circle */}
      <Circle
        size="40px"
        bg="blue.500"
        color="white"
        boxShadow="0 4px 12px rgba(59, 130, 246, 0.4)"
        sx={{
          animation: 'pulse 2s infinite',
          '@keyframes pulse': {
            '0%': { transform: 'scale(1)', opacity: 0.9 },
            '50%': { transform: 'scale(1.1)', opacity: 1 },
            '100%': { transform: 'scale(1)', opacity: 0.9 }
          }
        }}
      >
        <SearchIcon boxSize={4} />
      </Circle>
      
      {/* Small status text below */}
      <Text
        fontSize="xs"
        color="blue.600"
        textAlign="center"
        mt={2}
        fontWeight="bold"
      >
        Searching...
      </Text>
    </Box>
  );
};

export default CompactSearchIndicator;