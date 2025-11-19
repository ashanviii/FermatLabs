'use client';
import { useState, useEffect } from 'react';
import { Box, Text } from '@chakra-ui/react';

interface RotatingPlaceholderProps {
  templates?: Array<{
    text: string;
    words: string[][];
  }>;
  speed?: number;
}

const defaultTemplates = [
  {
    text: "Do I need a visa to visit {}?",
    words: [["Japan", "France", "Canada", "Australia", "Germany", "Italy", "Spain", "Thailand", "Dubai", "Singapore"]]
  },
  {
    text: "What documents are required for {} visa?",
    words: [["UK tourist", "Schengen", "US", "Canadian", "Australian", "business", "student", "work"]]
  },
  {
    text: "How long does a {} visa take?",
    words: [["tourist", "business", "student", "work", "transit", "medical", "family", "retirement"]]
  },
  {
    text: "Can I get {} in {}?",
    words: [
      ["visa on arrival", "e-visa", "tourist visa", "business visa"],
      ["Thailand", "Dubai", "Turkey", "Indonesia", "Vietnam", "Egypt"]
    ]
  }
];

export default function RotatingPlaceholder({
  templates = defaultTemplates,
  speed = 2500
}: RotatingPlaceholderProps) {
  const [templateIndex, setTemplateIndex] = useState(0);
  const [currentIndices, setCurrentIndices] = useState<number[]>([0, 0]);
  const [isAnimating, setIsAnimating] = useState<number[]>([0, 0]);
  const [isFading, setIsFading] = useState(false);

  const currentTemplate = templates[templateIndex];

  // Change template periodically
  useEffect(() => {
    const templateInterval = setInterval(() => {
      setIsFading(true);
      setTimeout(() => {
        setTemplateIndex((prev) => (prev + 1) % templates.length);
        setCurrentIndices([0, 0]);
        setIsFading(false);
      }, 500);
    }, 8000); // Change template every 8 seconds

    return () => clearInterval(templateInterval);
  }, [templates.length]);

  // Rotate words within current template
  useEffect(() => {
    if (!currentTemplate.words) return;

    const intervals = currentTemplate.words.map((_, wordGroupIndex) => {
      return setInterval(() => {
        // Trigger animation
        setIsAnimating(prev => {
          const newState = [...prev];
          newState[wordGroupIndex] = 1;
          return newState;
        });

        // After animation, update the word
        setTimeout(() => {
          setCurrentIndices(prev => {
            const newIndices = [...prev];
            newIndices[wordGroupIndex] = 
              (newIndices[wordGroupIndex] + 1) % currentTemplate.words[wordGroupIndex].length;
            return newIndices;
          });

          // Reset animation state
          setTimeout(() => {
            setIsAnimating(prev => {
              const newState = [...prev];
              newState[wordGroupIndex] = 0;
              return newState;
            });
          }, 100);
        }, 300);
      }, speed + (wordGroupIndex * 700)); // Stagger the animations
    });

    return () => intervals.forEach(interval => clearInterval(interval));
  }, [speed, currentTemplate, templateIndex]);

  // Split the base text and insert rotating words
  const renderText = () => {
    const parts = currentTemplate.text.split('{}');
    const elements: JSX.Element[] = [];

    parts.forEach((part, index) => {
      if (part) {
        elements.push(
          <Text 
            key={`text-${index}`} 
            as="span" 
            color="gray.400"
            fontSize={{ base: 'sm', md: 'md' }}
          >
            {part}
          </Text>
        );
      }
      
      if (index < currentTemplate.words.length) {
        const wordGroupIndex = index;
        const currentWord = currentTemplate.words[wordGroupIndex][currentIndices[wordGroupIndex]];
        
        elements.push(
          <Box
            key={`word-${index}`}
            as="span"
            display="inline-block"
            position="relative"
            mx="3px"
            minW="50px"
            textAlign="center"
          >
            <Text
              as="span"
              background="linear-gradient(90deg, #9333ea 0%, #ec4899 50%, #9333ea 100%)"
              backgroundSize="200% auto"
              bgClip="text"
              color="transparent"
              fontWeight="700"
              display="inline-block"
              position="relative"
              fontSize={{ base: 'sm', md: 'md' }}
              style={{
                animation: isAnimating[wordGroupIndex] 
                  ? 'rotateWord 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)'
                  : 'none',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              {currentWord}
            </Text>
          </Box>
        );
      }
    });

    return elements;
  };

  return (
    <>
      <style jsx global>{`
        @keyframes rotateWord {
          0% {
            transform: translateY(0) rotateX(0deg) scale(1);
            opacity: 1;
            filter: blur(0px);
          }
          45% {
            transform: translateY(-20px) rotateX(90deg) scale(0.7);
            opacity: 0;
            filter: blur(4px);
          }
          55% {
            transform: translateY(20px) rotateX(-90deg) scale(0.7);
            opacity: 0;
            filter: blur(4px);
          }
          100% {
            transform: translateY(0) rotateX(0deg) scale(1);
            opacity: 1;
            filter: blur(0px);
          }
        }

        @keyframes fadeTemplate {
          0% { opacity: 1; transform: translateY(0); }
          50% { opacity: 0; transform: translateY(-5px); }
          100% { opacity: 1; transform: translateY(0); }
        }

        @keyframes shimmer {
          0% {
            background-position: -200% center;
          }
          100% {
            background-position: 200% center;
          }
        }
      `}</style>
      <Box
        as="span"
        display="inline-flex"
        alignItems="center"
        flexWrap="wrap"
        gap="2px"
        opacity={isFading ? 0.3 : 1}
        transition="opacity 0.5s ease"
        style={{
          animation: isFading ? 'fadeTemplate 1s ease-in-out' : 'none'
        }}
      >
        {renderText()}
      </Box>
    </>
  );
}
