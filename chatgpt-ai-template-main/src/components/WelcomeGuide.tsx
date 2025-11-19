'use client';
import {
  Box,
  Flex,
  Text,
  Icon,
  VStack,
  HStack,
  SimpleGrid,
  Button,
  Circle,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Badge,
  Tooltip
} from '@chakra-ui/react';
import {
  MdFlight,
  MdHotel,
  MdDescription,
  MdRestaurant,
  MdDirectionsCar,
  MdTour,
  MdHealthAndSafety,
  MdLanguage,
  MdAttachMoney,
  MdWifi,
  MdWbSunny,
  MdSecurity,
  MdTrain,
  MdLocalActivity,
  MdHelpOutline,
  MdClose
} from 'react-icons/md';
import { FaPassport, FaMapMarkedAlt } from 'react-icons/fa';
import { useState } from 'react';

interface ServiceCard {
  icon: any;
  title: string;
  description: string;
  examples: string[];
  color: string;
  gradient: string;
  isPro?: boolean; // Mark services that require pro
}

const services: ServiceCard[] = [
  {
    icon: FaPassport,
    title: 'Visa & Immigration',
    description: 'Get visa requirements, processing times, and application guides',
    examples: [
      'Do I need a visa to visit Japan from the US?',
      'What documents are required for a UK tourist visa?',
      'How long does a Schengen visa take?'
    ],
    color: 'blue.500',
    gradient: 'linear(to-br, blue.400, blue.600)',
    isPro: false // Free service
  },
  {
    icon: MdFlight,
    title: 'Flight Search',
    description: 'Find best flight options, compare prices, and get booking tips',
    examples: [
      'Find flights from NYC to Tokyo in December',
      'Cheapest flights to London next month',
      'Best airlines for long-haul flights to Asia'
    ],
    color: 'purple.500',
    gradient: 'linear(to-br, purple.400, purple.600)',
    isPro: true // Requires Pro
  },
  {
    icon: MdHotel,
    title: 'Hotels & Stays',
    description: 'Discover accommodations, compare prices, and find deals',
    examples: [
      'Best hotels in Paris under $200/night',
      'Family-friendly resorts in Bali',
      'Boutique hotels near Times Square'
    ],
    color: 'pink.500',
    gradient: 'linear(to-br, pink.400, pink.600)',
    isPro: true // Requires Pro
  },
  {
    icon: MdRestaurant,
    title: 'Dining & Food',
    description: 'Find restaurants, local cuisine, and food recommendations',
    examples: [
      'Best sushi restaurants in Tokyo',
      'Where to eat authentic pasta in Rome',
      'Vegetarian restaurants in Bangkok'
    ],
    color: 'orange.500',
    gradient: 'linear(to-br, orange.400, orange.600)',
    isPro: true // Requires Pro
  },
  {
    icon: MdDirectionsCar,
    title: 'Car Rentals',
    description: 'Compare rental cars, rates, and get driving tips',
    examples: [
      'Cheap car rentals in Los Angeles',
      'SUV rental for road trip in Iceland',
      'Best car rental companies in Europe'
    ],
    color: 'green.500',
    gradient: 'linear(to-br, green.400, green.600)',
    isPro: true // Requires Pro
  },
  {
    icon: MdTour,
    title: 'Tours & Activities',
    description: 'Discover experiences, book tours, and plan adventures',
    examples: [
      'Best day tours in Barcelona',
      'Snorkeling tours in Hawaii',
      'Cultural experiences in India'
    ],
    color: 'teal.500',
    gradient: 'linear(to-br, teal.400, teal.600)',
    isPro: true // Requires Pro
  },
  {
    icon: MdHealthAndSafety,
    title: 'Health & Vaccines',
    description: 'Get vaccination requirements and health advisories',
    examples: [
      'What vaccines do I need for Brazil?',
      'Travel health insurance recommendations',
      'Malaria prevention for Kenya trip'
    ],
    color: 'red.500',
    gradient: 'linear(to-br, red.400, red.600)',
    isPro: true // Requires Pro
  },
  {
    icon: MdAttachMoney,
    title: 'Budget & Currency',
    description: 'Plan your budget, exchange rates, and money tips',
    examples: [
      'Daily budget for backpacking Thailand',
      'Best way to exchange currency in Europe',
      'Credit cards for international travel'
    ],
    color: 'yellow.500',
    gradient: 'linear(to-br, yellow.400, yellow.600)',
    isPro: true // Requires Pro
  },
  {
    icon: MdWifi,
    title: 'SIM & Connectivity',
    description: 'Find SIM cards, WiFi options, and stay connected',
    examples: [
      'Best SIM card for Japan tourists',
      'eSIM vs local SIM in Europe',
      'Pocket WiFi rental in South Korea'
    ],
    color: 'cyan.500',
    gradient: 'linear(to-br, cyan.400, cyan.600)',
    isPro: true // Requires Pro
  },
  {
    icon: MdWbSunny,
    title: 'Weather & Packing',
    description: 'Check weather forecasts and get packing lists',
    examples: [
      'Weather in Bali in August',
      'What to pack for Iceland in winter',
      'Best time to visit New Zealand'
    ],
    color: 'orange.400',
    gradient: 'linear(to-br, orange.300, orange.500)',
    isPro: true // Requires Pro
  },
  {
    icon: MdTrain,
    title: 'Transportation',
    description: 'Learn about local transport, train passes, and getting around',
    examples: [
      'How to use metro in Paris',
      'JR Pass worth it for Japan trip?',
      'Getting from airport to city center'
    ],
    color: 'indigo.500',
    gradient: 'linear(to-br, indigo.400, indigo.600)',
    isPro: true // Requires Pro
  },
  {
    icon: MdLanguage,
    title: 'Language & Culture',
    description: 'Learn key phrases and cultural tips',
    examples: [
      'Basic phrases for traveling in Spain',
      'Cultural etiquette in Japan',
      'Common scams to avoid in tourist areas'
    ],
    color: 'purple.400',
    gradient: 'linear(to-br, purple.300, purple.500)',
    isPro: true // Requires Pro
  }
];

interface WelcomeGuideProps {
  isOpen: boolean;
  onClose: () => void;
  onExampleClick?: (example: string) => void;
  isPro?: boolean;
  onUpgrade?: () => void;
}

export default function WelcomeGuide({ isOpen, onClose, onExampleClick, isPro = false, onUpgrade }: WelcomeGuideProps) {
  const [selectedService, setSelectedService] = useState<ServiceCard | null>(null);

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="6xl" scrollBehavior="inside">
      <ModalOverlay backdropFilter="blur(10px)" bg="blackAlpha.600" />
      <ModalContent borderRadius="24px" maxH="90vh">
        <ModalHeader>
          <Flex align="center" justify="space-between" pr={8}>
            <VStack align="flex-start" spacing={1}>
              <Text fontSize="2xl" fontWeight="800" bgGradient="linear(to-r, purple.500, pink.500)" bgClip="text">
                Welcome to Fermat Travel AI
              </Text>
              <Text fontSize="sm" fontWeight="500" color="gray.600">
                Your intelligent travel companion for everything you need
              </Text>
            </VStack>
            <VStack spacing={1} align="flex-end">
              <Badge colorScheme="blue" fontSize="xs" px={3} py={1} borderRadius="full">
                1 Free Service
              </Badge>
              <Badge colorScheme="purple" fontSize="xs" px={3} py={1} borderRadius="full">
                11 Pro Services
              </Badge>
            </VStack>
          </Flex>
        </ModalHeader>
        <ModalCloseButton />
        
        <ModalBody pb={6}>
          {!selectedService ? (
            <VStack spacing={6} align="stretch">
              {/* Quick Start Section */}
              <Box
                bg="purple.50"
                borderRadius="16px"
                p={6}
                border="2px solid"
                borderColor="purple.200"
              >
                <HStack spacing={3} mb={3}>
                  <Circle size="40px" bg="purple.500">
                    <Icon as={MdHelpOutline} color="white" w="20px" h="20px" />
                  </Circle>
                  <Text fontSize="lg" fontWeight="700" color="gray.800">
                    How to Get Started
                  </Text>
                </HStack>
                <VStack spacing={3} align="stretch" pl={2}>
                  <HStack>
                    <Circle size="24px" bg="purple.500" color="white" fontSize="xs" fontWeight="700">
                      1
                    </Circle>
                    <Text fontSize="sm" color="gray.700">
                      <strong>Choose a service</strong> from the cards below or type your question directly
                    </Text>
                  </HStack>
                  <HStack>
                    <Circle size="24px" bg="purple.500" color="white" fontSize="xs" fontWeight="700">
                      2
                    </Circle>
                    <Text fontSize="sm" color="gray.700">
                      <strong>Ask naturally</strong> - just like you'd ask a travel expert friend
                    </Text>
                  </HStack>
                  <HStack>
                    <Circle size="24px" bg="purple.500" color="white" fontSize="xs" fontWeight="700">
                      3
                    </Circle>
                    <Text fontSize="sm" color="gray.700">
                      <strong>Watch our AI agents work</strong> - they'll search, analyze, and provide detailed answers
                    </Text>
                  </HStack>
                </VStack>
              </Box>

              {/* Services Grid */}
              <Box>
                <Text fontSize="lg" fontWeight="700" mb={4} color="gray.800">
                  Explore All Services
                </Text>
                <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
                  {services.map((service, index) => {
                    const isLocked = service.isPro && !isPro;
                    return (
                      <Box
                        key={index}
                        p={5}
                        borderRadius="16px"
                        border="2px solid"
                        borderColor={isLocked ? "gray.300" : "gray.200"}
                        bg={isLocked ? "gray.50" : "white"}
                        cursor={isLocked ? "not-allowed" : "pointer"}
                        position="relative"
                        opacity={isLocked ? 0.7 : 1}
                        transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
                        _hover={!isLocked ? {
                          borderColor: service.color,
                          transform: 'translateY(-4px)',
                          boxShadow: `0 8px 24px ${service.color}40`
                        } : {}}
                        onClick={() => {
                          if (isLocked && onUpgrade) {
                            onUpgrade();
                          } else if (!isLocked) {
                            setSelectedService(service);
                          }
                        }}
                      >
                        {isLocked && (
                          <Badge
                            position="absolute"
                            top={2}
                            right={2}
                            colorScheme="purple"
                            fontSize="2xs"
                            px={2}
                            py={1}
                            borderRadius="full"
                          >
                            PRO
                          </Badge>
                        )}
                        <VStack align="flex-start" spacing={3}>
                          <Circle size="48px" bgGradient={service.gradient} opacity={isLocked ? 0.6 : 1}>
                            <Icon as={service.icon} color="white" w="24px" h="24px" />
                          </Circle>
                          <VStack align="flex-start" spacing={1}>
                            <Text fontSize="md" fontWeight="700" color="gray.800">
                              {service.title}
                            </Text>
                            <Text fontSize="xs" color="gray.600" lineHeight="1.5">
                              {service.description}
                            </Text>
                          </VStack>
                          <Text fontSize="xs" color={isLocked ? "purple.500" : service.color} fontWeight="600">
                            {isLocked ? "Upgrade to Pro →" : "Click to see examples →"}
                          </Text>
                        </VStack>
                      </Box>
                    );
                  })}
                </SimpleGrid>
              </Box>

              {/* Footer */}
              <Box textAlign="center" pt={4}>
                <Button
                  size="lg"
                  bgGradient="linear(to-r, purple.500, pink.500)"
                  color="white"
                  borderRadius="full"
                  px={8}
                  onClick={onClose}
                  _hover={{
                    bgGradient: "linear(to-r, purple.600, pink.600)",
                    transform: "translateY(-2px)",
                    boxShadow: "xl"
                  }}
                >
                  Start Exploring
                </Button>
              </Box>
            </VStack>
          ) : (
            // Service Detail View
            <VStack spacing={6} align="stretch">
              <Button
                leftIcon={<MdClose />}
                variant="ghost"
                size="sm"
                onClick={() => setSelectedService(null)}
                w="fit-content"
              >
                Back to all services
              </Button>

              <Box
                bg={`${selectedService.color.split('.')[0]}.50`}
                borderRadius="16px"
                p={6}
                border="2px solid"
                borderColor={selectedService.color}
              >
                <HStack spacing={4} mb={4}>
                  <Circle size="56px" bgGradient={selectedService.gradient}>
                    <Icon as={selectedService.icon} color="white" w="28px" h="28px" />
                  </Circle>
                  <VStack align="flex-start" spacing={1}>
                    <Text fontSize="xl" fontWeight="800" color="gray.800">
                      {selectedService.title}
                    </Text>
                    <Text fontSize="sm" color="gray.600">
                      {selectedService.description}
                    </Text>
                  </VStack>
                </HStack>

                <Text fontSize="md" fontWeight="700" mb={3} color="gray.800">
                  Try These Example Questions:
                </Text>

                <VStack spacing={3} align="stretch">
                  {selectedService.examples.map((example, index) => (
                    <Box
                      key={index}
                      p={4}
                      bg="white"
                      borderRadius="12px"
                      border="2px solid"
                      borderColor="gray.200"
                      cursor="pointer"
                      transition="all 0.2s"
                      _hover={{
                        borderColor: selectedService.color,
                        transform: "translateX(4px)",
                        boxShadow: "md"
                      }}
                      onClick={() => {
                        if (onExampleClick) {
                          onExampleClick(example);
                          onClose();
                        }
                      }}
                    >
                      <HStack justify="space-between">
                        <Text fontSize="sm" fontWeight="600" color="gray.700">
                          "{example}"
                        </Text>
                        <Icon as={MdFlight} color={selectedService.color} transform="rotate(-45deg)" />
                      </HStack>
                    </Box>
                  ))}
                </VStack>
              </Box>

              <Box textAlign="center">
                <Button
                  size="lg"
                  colorScheme={selectedService.color.split('.')[0]}
                  borderRadius="full"
                  px={8}
                  onClick={onClose}
                >
                  Ask Your Own Question
                </Button>
              </Box>
            </VStack>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
