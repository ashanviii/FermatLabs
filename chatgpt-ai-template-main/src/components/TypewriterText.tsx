import React, { useState, useEffect } from 'react';
import { Text, Box, useColorModeValue } from '@chakra-ui/react';
import FormattedAnswer from './FormattedAnswer';

interface TypewriterTextProps {
  text: string;
  speed?: number; // milliseconds between each character
  onComplete?: () => void;
  showCursor?: boolean;
  useFormatting?: boolean;
}

export default function TypewriterText({ 
  text, 
  speed = 50, 
  onComplete,
  showCursor = true,
  useFormatting = true
}: TypewriterTextProps) {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  
  const textColor = useColorModeValue('navy.700', 'white');

  useEffect(() => {
    if (!text) return;
    
    // Reset states when text changes
    setDisplayedText('');
    setCurrentIndex(0);
    setIsComplete(false);
  }, [text]);

  useEffect(() => {
    if (!text || currentIndex >= text.length) {
      if (!isComplete && currentIndex >= text.length) {
        setIsComplete(true);
        onComplete?.();
      }
      return;
    }

    const timer = setTimeout(() => {
      setDisplayedText(text.slice(0, currentIndex + 1));
      setCurrentIndex(prev => prev + 1);
    }, speed);

    return () => clearTimeout(timer);
  }, [currentIndex, text, speed, onComplete, isComplete]);

  if (useFormatting && isComplete) {
    // Show formatted version when complete
    return <FormattedAnswer content={displayedText} />;
  }

  return (
    <Box position="relative">
      {useFormatting ? (
        <FormattedAnswer content={displayedText + (showCursor && !isComplete ? '|' : '')} />
      ) : (
        <Text 
          whiteSpace="pre-wrap" 
          fontSize="md" 
          fontWeight="500" 
          color={textColor}
        >
          {displayedText}
          {showCursor && !isComplete && (
            <Text
              as="span"
              animation="blink 1s infinite"
              sx={{
                '@keyframes blink': {
                  '0%, 50%': { opacity: 1 },
                  '51%, 100%': { opacity: 0 }
                }
              }}
            >
              |
            </Text>
          )}
        </Text>
      )}
    </Box>
  );
}