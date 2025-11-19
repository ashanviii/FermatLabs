'use client';
import {
  Box,
  Flex,
  Text,
  Icon,
  SimpleGrid,
  VStack,
  HStack,
  Circle,
  useColorModeValue
} from '@chakra-ui/react';
import {
  MdFlight,
  MdHotel,
  MdDescription,
  MdRestaurant,
  MdDirectionsCar,
  MdTour,
  MdAutoAwesome,
  MdSpeed,
  MdVerified
} from 'react-icons/md';
import { FaPassport, FaRobot } from 'react-icons/fa';

interface FeatureCardProps {
  icon: any;
  title: string;
  description: string;
  color: string;
  onClick?: () => void;
}

function FeatureCard({ icon, title, description, color, onClick }: FeatureCardProps) {
  return (
    <Box
      p={5}
      borderRadius="16px"
      bg="white"
      border="2px solid"
      borderColor="gray.100"
      cursor={onClick ? "pointer" : "default"}
      transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
      _hover={onClick ? {
        transform: "translateY(-6px)",
        borderColor: color,
        boxShadow: `0 12px 28px ${color}30`
      } : {}}
      onClick={onClick}
    >
      <VStack align="flex-start" spacing={3}>
        <Circle size="52px" bg={`${color.split('.')[0]}.50`}>
          <Icon as={icon} color={color} w="26px" h="26px" />
        </Circle>
        <Text fontSize="md" fontWeight="700" color="gray.800">
          {title}
        </Text>
        <Text fontSize="xs" color="gray.600" lineHeight="1.6">
          {description}
        </Text>
      </VStack>
    </Box>
  );
}

interface FeatureShowcaseProps {
  onServiceClick?: (service: string) => void;
}

export default function FeatureShowcase({ onServiceClick }: FeatureShowcaseProps) {
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const mainFeatures = [
    {
      icon: FaPassport,
      title: "Visa & Immigration",
      description: "Get instant visa requirements, processing times, and document checklists for any destination",
      color: "blue.500"
    },
    {
      icon: MdFlight,
      title: "Flight Search",
      description: "Compare flights, find the best deals, and get personalized recommendations from 200+ airlines",
      color: "purple.500"
    },
    {
      icon: MdHotel,
      title: "Hotels & Stays",
      description: "Discover perfect accommodations with real-time pricing, reviews, and availability",
      color: "pink.500"
    },
    {
      icon: MdRestaurant,
      title: "Dining Guide",
      description: "Find authentic restaurants, local cuisine, and food experiences curated for you",
      color: "orange.500"
    },
    {
      icon: MdDirectionsCar,
      title: "Car Rentals",
      description: "Compare rental cars from top providers with transparent pricing and insider tips",
      color: "green.500"
    },
    {
      icon: MdTour,
      title: "Tours & Activities",
      description: "Discover unique experiences, guided tours, and adventures for every traveler type",
      color: "teal.500"
    }
  ];

  const aiFeatures = [
    {
      icon: FaRobot,
      title: "Smart AI Agents",
      description: "Watch our AI agents work in real-time as they search, analyze, and compile your answer"
    },
    {
      icon: MdSpeed,
      title: "Lightning Fast",
      description: "Get comprehensive answers in seconds, not hours of research"
    },
    {
      icon: MdVerified,
      title: "Verified Info",
      description: "All information cross-referenced from trusted sources and real traveler experiences"
    }
  ];

  return (
    <Box
      w="100%"
      maxW="1200px"
      p={{ base: 4, md: 6 }}
    >
      <VStack spacing={8} align="stretch">
        {/* Hero Section */}
        <VStack spacing={3} textAlign="center" py={4}>
          <HStack justify="center" spacing={2}>
            <Icon 
              as={MdAutoAwesome} 
              w="32px" 
              h="32px" 
              color="purple.500"
              animation="pulse 2s ease-in-out infinite"
            />
            <Text 
              fontSize={{ base: "2xl", md: "3xl" }} 
              fontWeight="900"
              bgGradient="linear(to-r, purple.500, pink.500, purple.600)"
              bgClip="text"
            >
              Your All-in-One Travel Assistant
            </Text>
          </HStack>
          <Text 
            fontSize={{ base: "sm", md: "md" }} 
            color="gray.600" 
            maxW="600px"
            fontWeight="500"
          >
            From visas to flights, hotels to restaurants — ask anything about your trip and get intelligent, personalized answers instantly
          </Text>
        </VStack>

        {/* Main Services Grid */}
        <Box>
          <Text fontSize="lg" fontWeight="700" mb={4} color="gray.700">
            🌍 Complete Travel Services
          </Text>
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
            {mainFeatures.map((feature, index) => (
              <FeatureCard
                key={index}
                {...feature}
                onClick={() => onServiceClick && onServiceClick(feature.title)}
              />
            ))}
          </SimpleGrid>
        </Box>

        {/* AI Features */}
        <Box
          bg={bgColor}
          borderRadius="20px"
          p={6}
          border="2px solid"
          borderColor={borderColor}
        >
          <Text fontSize="lg" fontWeight="700" mb={4} color="gray.700">
            ✨ Powered by Advanced AI
          </Text>
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
            {aiFeatures.map((feature, index) => (
              <HStack key={index} align="flex-start" spacing={3}>
                <Circle size="40px" bg="purple.50">
                  <Icon as={feature.icon} color="purple.500" w="20px" h="20px" />
                </Circle>
                <VStack align="flex-start" spacing={1} flex={1}>
                  <Text fontSize="sm" fontWeight="700" color="gray.800">
                    {feature.title}
                  </Text>
                  <Text fontSize="xs" color="gray.600" lineHeight="1.5">
                    {feature.description}
                  </Text>
                </VStack>
              </HStack>
            ))}
          </SimpleGrid>
        </Box>

        {/* CTA */}
        <Box
          textAlign="center"
          p={6}
          borderRadius="16px"
          bgGradient="linear(to-r, purple.50, pink.50)"
          border="2px dashed"
          borderColor="purple.200"
        >
          <Text fontSize="md" fontWeight="700" color="gray.800" mb={2}>
            Ready to plan your perfect trip?
          </Text>
          <Text fontSize="sm" color="gray.600">
            Just type your question below or click "Show All Services" to explore
          </Text>
        </Box>
      </VStack>
    </Box>
  );
}
