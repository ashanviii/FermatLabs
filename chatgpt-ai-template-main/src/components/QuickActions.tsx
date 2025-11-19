'use client';
import {
  Box,
  Flex,
  Text,
  Icon,
  SimpleGrid,
  HStack,
  VStack,
  Badge,
  useColorModeValue
} from '@chakra-ui/react';
import {
  MdFlight,
  MdHotel,
  MdDescription,
  MdRestaurant,
  MdTour,
  MdDirectionsCar
} from 'react-icons/md';
import { FaPassport } from 'react-icons/fa';

interface QuickAction {
  icon: any;
  label: string;
  query: string;
  color: string;
  badge?: string;
}

const quickActions: QuickAction[] = [
  {
    icon: FaPassport,
    label: "Visa Check",
    query: "Do I need a visa to visit Japan from the United States?",
    color: "blue.500",
    badge: "Popular"
  },
  {
    icon: MdFlight,
    label: "Find Flights",
    query: "Find me the best flights from New York to London in December",
    color: "purple.500"
  },
  {
    icon: MdHotel,
    label: "Book Hotel",
    query: "Recommend hotels in Paris near the Eiffel Tower under $200 per night",
    color: "pink.500"
  },
  {
    icon: MdRestaurant,
    label: "Find Food",
    query: "Best authentic Italian restaurants in Rome",
    color: "orange.500"
  },
  {
    icon: MdTour,
    label: "Plan Tours",
    query: "What are the best day tours in Barcelona?",
    color: "teal.500"
  },
  {
    icon: MdDirectionsCar,
    label: "Rent Car",
    query: "Compare car rental prices in Los Angeles for a week",
    color: "green.500"
  }
];

interface QuickActionsProps {
  onActionClick: (query: string) => void;
}

export default function QuickActions({ onActionClick }: QuickActionsProps) {
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  return (
    <Box
      w="100%"
      maxW="1000px"
      bg={bgColor}
      borderRadius="20px"
      p={{ base: 5, md: 6 }}
      border="2px solid"
      borderColor={borderColor}
      boxShadow="0 4px 20px rgba(0, 0, 0, 0.06)"
    >
      <VStack spacing={4} align="stretch">
        {/* Header */}
        <Flex align="center" justify="space-between">
          <HStack spacing={2}>
            <Text fontSize={{ base: "md", md: "lg" }} fontWeight="700" color="gray.800">
              ⚡ Quick Actions
            </Text>
            <Badge colorScheme="purple" fontSize="2xs" px={2} py={0.5} borderRadius="full">
              Try these
            </Badge>
          </HStack>
          <Text fontSize="xs" color="gray.500">
            Click to auto-fill
          </Text>
        </Flex>

        {/* Actions Grid */}
        <SimpleGrid columns={{ base: 2, md: 3, lg: 6 }} spacing={3}>
          {quickActions.map((action, index) => (
            <Box
              key={index}
              position="relative"
              p={4}
              borderRadius="14px"
              bg="white"
              border="2px solid"
              borderColor="gray.100"
              cursor="pointer"
              transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
              _hover={{
                transform: "translateY(-4px)",
                borderColor: action.color,
                boxShadow: `0 8px 20px ${action.color}30`,
                bg: `${action.color.split('.')[0]}.50`
              }}
              onClick={() => onActionClick(action.query)}
            >
              {action.badge && (
                <Badge
                  position="absolute"
                  top={-2}
                  right={-2}
                  colorScheme="red"
                  fontSize="2xs"
                  px={2}
                  borderRadius="full"
                >
                  {action.badge}
                </Badge>
              )}
              <VStack spacing={2}>
                <Box
                  p={2.5}
                  borderRadius="12px"
                  bg={`${action.color.split('.')[0]}.50`}
                >
                  <Icon as={action.icon} color={action.color} w="20px" h="20px" />
                </Box>
                <Text 
                  fontSize="xs" 
                  fontWeight="600" 
                  color="gray.700"
                  textAlign="center"
                  lineHeight="1.3"
                >
                  {action.label}
                </Text>
              </VStack>
            </Box>
          ))}
        </SimpleGrid>

        {/* Footer hint */}
        <Text fontSize="2xs" color="gray.500" textAlign="center" pt={1}>
          Or type your own question in the search box below
        </Text>
      </VStack>
    </Box>
  );
}
