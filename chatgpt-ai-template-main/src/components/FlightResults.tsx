'use client';
import { Box, Flex, Text, Icon, VStack, HStack, Badge, Button, Divider } from '@chakra-ui/react';
import { MdFlight, MdAccessTime, MdAttachMoney, MdAirlineSeatReclineNormal } from 'react-icons/md';
import { FaPlane, FaClock, FaSuitcase } from 'react-icons/fa';

export interface Flight {
  id: string;
  airline: string;
  airlineLogo?: string;
  flightNumber: string;
  departure: {
    airport: string;
    code: string;
    time: string;
  };
  arrival: {
    airport: string;
    code: string;
    time: string;
  };
  duration: string;
  stops: number;
  price: number;
  cabin: string;
  seats: number;
  baggage: string;
}

interface FlightResultsProps {
  flights: Flight[];
  isLoading?: boolean;
  onSelectFlight: (flight: Flight) => void;
}

export default function FlightResults({ flights, isLoading = false, onSelectFlight }: FlightResultsProps) {
  if (isLoading) {
    return (
      <Box
        bg="rgba(255, 255, 255, 0.95)"
        backdropFilter="blur(20px)"
        borderRadius="24px"
        p="32px"
        textAlign="center"
      >
        <Text fontSize="lg" color="gray.600">
          Searching for flights...
        </Text>
      </Box>
    );
  }

  if (flights.length === 0) {
    return (
      <Box
        bg="rgba(255, 255, 255, 0.95)"
        backdropFilter="blur(20px)"
        borderRadius="24px"
        p="32px"
        textAlign="center"
      >
        <Icon as={MdFlight} w="48px" h="48px" color="gray.400" mb="16px" />
        <Text fontSize="lg" fontWeight="600" color="gray.700">
          No flights found
        </Text>
        <Text fontSize="sm" color="gray.600" mt="8px">
          Try adjusting your search criteria
        </Text>
      </Box>
    );
  }

  return (
    <Box
      bg="rgba(255, 255, 255, 0.98)"
      backdropFilter="blur(20px)"
      borderRadius="24px"
      p={{ base: '20px', md: '32px' }}
      boxShadow="0 12px 40px rgba(0, 0, 0, 0.1)"
      border="1px solid"
      borderColor="rgba(200, 200, 220, 0.4)"
    >
      {/* Header */}
      <Flex align="center" justify="space-between" mb="24px">
        <VStack align="start" spacing="4px">
          <Text fontSize="xl" fontWeight="700" color="gray.800">
            Available Flights
          </Text>
          <Text fontSize="sm" color="gray.600">
            {flights.length} option{flights.length !== 1 ? 's' : ''} found
          </Text>
        </VStack>
        <Badge colorScheme="green" fontSize="sm" px="12px" py="4px" borderRadius="full">
          Best Prices
        </Badge>
      </Flex>

      {/* Flight Cards */}
      <VStack spacing="16px" align="stretch">
        {flights.map((flight, index) => (
          <Box
            key={flight.id}
            bg="white"
            borderRadius="16px"
            p={{ base: '16px', md: '20px' }}
            border="2px solid"
            borderColor="gray.200"
            _hover={{
              borderColor: 'purple.300',
              boxShadow: '0 8px 24px rgba(102, 126, 234, 0.15)',
              transform: 'translateY(-2px)'
            }}
            transition="all 0.3s ease"
            position="relative"
          >
            {/* Best Deal Badge */}
            {index === 0 && (
              <Badge
                position="absolute"
                top="-10px"
                right="20px"
                colorScheme="purple"
                fontSize="xs"
                px="12px"
                py="4px"
                borderRadius="full"
                boxShadow="0 4px 12px rgba(102, 126, 234, 0.3)"
              >
                ⭐ Best Deal
              </Badge>
            )}

            <Flex direction={{ base: 'column', md: 'row' }} gap="20px">
              {/* Flight Info */}
              <Flex flex="1" direction="column" gap="16px">
                {/* Airline */}
                <Flex align="center" gap="12px">
                  <Flex
                    bg="purple.100"
                    borderRadius="8px"
                    w="40px"
                    h="40px"
                    align="center"
                    justify="center"
                  >
                    <Icon as={FaPlane} color="purple.600" w="20px" h="20px" />
                  </Flex>
                  <VStack align="start" spacing="0">
                    <Text fontSize="md" fontWeight="700" color="gray.800">
                      {flight.airline}
                    </Text>
                    <Text fontSize="xs" color="gray.500">
                      {flight.flightNumber}
                    </Text>
                  </VStack>
                  <Badge ml="auto" colorScheme={flight.stops === 0 ? 'green' : 'orange'} fontSize="xs">
                    {flight.stops === 0 ? 'Non-stop' : `${flight.stops} stop${flight.stops > 1 ? 's' : ''}`}
                  </Badge>
                </Flex>

                {/* Route */}
                <Flex align="center" gap="12px">
                  <VStack spacing="2px" align="start" flex="1">
                    <Text fontSize="2xl" fontWeight="700" color="gray.800">
                      {flight.departure.time}
                    </Text>
                    <Text fontSize="sm" fontWeight="600" color="gray.600">
                      {flight.departure.code}
                    </Text>
                    <Text fontSize="xs" color="gray.500" noOfLines={1}>
                      {flight.departure.airport}
                    </Text>
                  </VStack>

                  <VStack spacing="4px" flex="1" px="12px">
                    <Icon as={MdFlight} color="purple.400" w="24px" h="24px" transform="rotate(90deg)" />
                    <Text fontSize="xs" color="gray.600" fontWeight="600">
                      {flight.duration}
                    </Text>
                    <Box w="100%" h="2px" bg="purple.200" borderRadius="full" />
                  </VStack>

                  <VStack spacing="2px" align="end" flex="1">
                    <Text fontSize="2xl" fontWeight="700" color="gray.800">
                      {flight.arrival.time}
                    </Text>
                    <Text fontSize="sm" fontWeight="600" color="gray.600">
                      {flight.arrival.code}
                    </Text>
                    <Text fontSize="xs" color="gray.500" noOfLines={1}>
                      {flight.arrival.airport}
                    </Text>
                  </VStack>
                </Flex>

                {/* Flight Details */}
                <HStack spacing="16px" flexWrap="wrap">
                  <HStack spacing="6px">
                    <Icon as={MdAirlineSeatReclineNormal} color="gray.500" w="16px" h="16px" />
                    <Text fontSize="xs" color="gray.600" fontWeight="600">
                      {flight.cabin}
                    </Text>
                  </HStack>
                  <HStack spacing="6px">
                    <Icon as={FaSuitcase} color="gray.500" w="14px" h="14px" />
                    <Text fontSize="xs" color="gray.600" fontWeight="600">
                      {flight.baggage}
                    </Text>
                  </HStack>
                  <HStack spacing="6px">
                    <Icon as={MdAccessTime} color="gray.500" w="16px" h="16px" />
                    <Text fontSize="xs" color="gray.600" fontWeight="600">
                      {flight.seats} seats left
                    </Text>
                  </HStack>
                </HStack>
              </Flex>

              <Divider 
                orientation={{ base: 'horizontal', md: 'vertical' }} 
                borderColor="gray.200"
              />

              {/* Price & Action */}
              <VStack 
                spacing="16px" 
                justify="center" 
                align={{ base: 'stretch', md: 'center' }}
                minW={{ base: 'auto', md: '200px' }}
              >
                <VStack spacing="4px">
                  <Text fontSize="xs" color="gray.500" fontWeight="600">
                    Total Price
                  </Text>
                  <Text fontSize="3xl" fontWeight="700" color="purple.600">
                    ${flight.price}
                  </Text>
                  <Text fontSize="xs" color="gray.500">
                    per person
                  </Text>
                </VStack>

                <Button
                  onClick={() => onSelectFlight(flight)}
                  size="lg"
                  bgGradient="linear(to-r, blue.500, purple.600)"
                  color="white"
                  borderRadius="12px"
                  fontSize="md"
                  fontWeight="700"
                  w="100%"
                  _hover={{
                    bgGradient: 'linear(to-r, blue.600, purple.700)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 20px rgba(102, 126, 234, 0.4)'
                  }}
                  _active={{
                    transform: 'translateY(0)'
                  }}
                >
                  Select Flight
                </Button>

                {flight.seats <= 5 && (
                  <HStack spacing="4px">
                    <Box w="6px" h="6px" borderRadius="full" bg="red.500" />
                    <Text fontSize="xs" color="red.600" fontWeight="600">
                      Only {flight.seats} seats left!
                    </Text>
                  </HStack>
                )}
              </VStack>
            </Flex>
          </Box>
        ))}
      </VStack>
    </Box>
  );
}
