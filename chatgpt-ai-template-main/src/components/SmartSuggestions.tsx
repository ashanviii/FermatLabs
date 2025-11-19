'use client';
import { Box, Flex, Text, Icon, SimpleGrid, VStack } from '@chakra-ui/react';
import { MdLightbulb, MdArrowForward } from 'react-icons/md';
import { FaPlane, FaPassport, FaFileAlt, FaCalendar } from 'react-icons/fa';

export interface Suggestion {
  id: string;
  title: string;
  description: string;
  icon?: any;
  action?: () => void;
}

interface SmartSuggestionsProps {
  suggestions: Suggestion[];
  onSuggestionClick?: (suggestion: Suggestion) => void;
}

export default function SmartSuggestions({ suggestions, onSuggestionClick }: SmartSuggestionsProps) {
  const getDefaultIcon = (index: number) => {
    const icons = [FaPassport, FaPlane, FaFileAlt, FaCalendar];
    return icons[index % icons.length];
  };

  return (
    <Box
      w="100%"
      maxW="960px"
      bg="white"
      border="1px solid"
      borderColor="gray.200"
      borderRadius="20px"
      p={{ base: '20px', md: '24px' }}
      boxShadow="0 4px 20px rgba(0, 0, 0, 0.08)"
    >
      {/* Header */}
      <Flex align="center" gap={3} mb={5}>
        <Icon as={MdLightbulb} w="24px" h="24px" color="yellow.500" />
        <Text fontSize={{ base: 'lg', md: 'xl' }} fontWeight="700" color="gray.800">
          Smart Suggestions
        </Text>
      </Flex>

      {/* Suggestions Grid */}
      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
        {suggestions.map((suggestion, index) => (
          <Box
            key={suggestion.id}
            p={4}
            borderRadius="12px"
            border="1px solid"
            borderColor="gray.200"
            bg="white"
            cursor="pointer"
            transition="all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
            _hover={{
              borderColor: 'purple.300',
              boxShadow: '0 4px 12px rgba(139, 92, 246, 0.15)',
              transform: 'translateY(-2px)',
              bg: 'purple.50'
            }}
            onClick={() => {
              if (onSuggestionClick) onSuggestionClick(suggestion);
              if (suggestion.action) suggestion.action();
            }}
          >
            <Flex align="flex-start" gap={3}>
              {/* Icon */}
              <Flex
                w="40px"
                h="40px"
                borderRadius="10px"
                bg="purple.100"
                align="center"
                justify="center"
                flexShrink={0}
              >
                <Icon
                  as={suggestion.icon || getDefaultIcon(index)}
                  w="20px"
                  h="20px"
                  color="purple.600"
                />
              </Flex>

              {/* Content */}
              <VStack align="flex-start" spacing={1} flex={1}>
                <Text
                  fontSize={{ base: 'sm', md: 'md' }}
                  fontWeight="600"
                  color="gray.800"
                >
                  {suggestion.title}
                </Text>
                <Text
                  fontSize="xs"
                  color="gray.600"
                  lineHeight="1.5"
                >
                  {suggestion.description}
                </Text>
              </VStack>

              {/* Arrow */}
              <Icon
                as={MdArrowForward}
                w="16px"
                h="16px"
                color="gray.400"
                transition="all 0.2s ease"
                sx={{
                  '.suggestion-card:hover &': {
                    transform: 'translateX(4px)',
                    color: 'purple.500'
                  }
                }}
              />
            </Flex>
          </Box>
        ))}
      </SimpleGrid>
    </Box>
  );
}
