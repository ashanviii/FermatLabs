'use client';
import { Box, Flex, Text, Icon, VStack, HStack, Input, Button, Select, Badge } from '@chakra-ui/react';
import { MdFlight, MdSwapVert, MdCalendarToday, MdPerson } from 'react-icons/md';
import { FaPlane, FaExchangeAlt } from 'react-icons/fa';
import { useState } from 'react';

export interface FlightSearchData {
  from: string;
  to: string;
  departDate: string;
  returnDate?: string;
  passengers: number;
  cabin: string;
  tripType: 'one-way' | 'round-trip' | 'multi-city';
}

interface FlightSearchFormProps {
  onSearch: (data: FlightSearchData) => void;
  isLoading?: boolean;
}

export default function FlightSearchForm({ onSearch, isLoading = false }: FlightSearchFormProps) {
  const [tripType, setTripType] = useState<'one-way' | 'round-trip' | 'multi-city'>('round-trip');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [departDate, setDepartDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [passengers, setPassengers] = useState(1);
  const [cabin, setCabin] = useState('economy');

  const handleSearch = () => {
    onSearch({
      from,
      to,
      departDate,
      returnDate: tripType === 'round-trip' ? returnDate : undefined,
      passengers,
      cabin,
      tripType
    });
  };

  const swapLocations = () => {
    const temp = from;
    setFrom(to);
    setTo(temp);
  };

  return (
    <Box
      bg="rgba(255, 255, 255, 0.98)"
      backdropFilter="blur(20px)"
      borderRadius="24px"
      p={{ base: '24px', md: '32px' }}
      boxShadow="0 12px 40px rgba(0, 0, 0, 0.1)"
      border="1px solid"
      borderColor="rgba(200, 200, 220, 0.4)"
      position="relative"
      overflow="hidden"
    >
      {/* Gradient Header Bar */}
      <Box
        position="absolute"
        top="0"
        left="0"
        right="0"
        h="4px"
        bgGradient="linear(to-r, blue.400, purple.500, pink.400)"
      />

      {/* Header */}
      <Flex align="center" mb="28px" gap="12px">
        <Flex
          bg="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
          borderRadius="12px"
          w="48px"
          h="48px"
          align="center"
          justify="center"
          boxShadow="0 4px 12px rgba(102, 126, 234, 0.3)"
        >
          <Icon as={FaPlane} color="white" w="24px" h="24px" />
        </Flex>
        <VStack align="start" spacing="0">
          <Text fontSize="lg" fontWeight="700" color="gray.800">
            Search Flights
          </Text>
          <Text fontSize="sm" color="gray.600">
            Find the best deals instantly
          </Text>
        </VStack>
      </Flex>

      {/* Trip Type Selector */}
      <HStack spacing="8px" mb="24px">
        {['round-trip', 'one-way', 'multi-city'].map((type) => (
          <Button
            key={type}
            size="sm"
            variant={tripType === type ? 'solid' : 'outline'}
            colorScheme={tripType === type ? 'purple' : 'gray'}
            onClick={() => setTripType(type as any)}
            borderRadius="full"
            fontSize="xs"
            fontWeight="600"
            textTransform="capitalize"
            px="16px"
          >
            {type.replace('-', ' ')}
          </Button>
        ))}
      </HStack>

      <VStack spacing="20px" align="stretch">
        {/* From/To Section */}
        <Flex gap="12px" direction={{ base: 'column', md: 'row' }}>
          <Box flex="1" position="relative">
            <Text fontSize="xs" fontWeight="600" color="gray.600" mb="8px">
              FROM
            </Text>
            <Input
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              placeholder="City or Airport"
              size="lg"
              borderRadius="12px"
              border="2px solid"
              borderColor="gray.200"
              _focus={{
                borderColor: 'purple.400',
                boxShadow: '0 0 0 3px rgba(102, 126, 234, 0.1)'
              }}
              _hover={{
                borderColor: 'gray.300'
              }}
            />
          </Box>

          {/* Swap Button */}
          <Flex align="end" justify="center" pb="4px">
            <Button
              onClick={swapLocations}
              size="sm"
              borderRadius="full"
              bg="purple.100"
              color="purple.600"
              _hover={{
                bg: 'purple.200',
                transform: 'rotate(180deg)'
              }}
              transition="all 0.3s ease"
              w="40px"
              h="40px"
              minW="40px"
              p="0"
            >
              <Icon as={FaExchangeAlt} w="18px" h="18px" />
            </Button>
          </Flex>

          <Box flex="1">
            <Text fontSize="xs" fontWeight="600" color="gray.600" mb="8px">
              TO
            </Text>
            <Input
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="City or Airport"
              size="lg"
              borderRadius="12px"
              border="2px solid"
              borderColor="gray.200"
              _focus={{
                borderColor: 'purple.400',
                boxShadow: '0 0 0 3px rgba(102, 126, 234, 0.1)'
              }}
              _hover={{
                borderColor: 'gray.300'
              }}
            />
          </Box>
        </Flex>

        {/* Date Section */}
        <Flex gap="12px" direction={{ base: 'column', md: 'row' }}>
          <Box flex="1">
            <Text fontSize="xs" fontWeight="600" color="gray.600" mb="8px">
              DEPARTURE
            </Text>
            <Input
              type="date"
              value={departDate}
              onChange={(e) => setDepartDate(e.target.value)}
              size="lg"
              borderRadius="12px"
              border="2px solid"
              borderColor="gray.200"
              _focus={{
                borderColor: 'purple.400',
                boxShadow: '0 0 0 3px rgba(102, 126, 234, 0.1)'
              }}
            />
          </Box>

          {tripType === 'round-trip' && (
            <Box flex="1">
              <Text fontSize="xs" fontWeight="600" color="gray.600" mb="8px">
                RETURN
              </Text>
              <Input
                type="date"
                value={returnDate}
                onChange={(e) => setReturnDate(e.target.value)}
                size="lg"
                borderRadius="12px"
                border="2px solid"
                borderColor="gray.200"
                _focus={{
                  borderColor: 'purple.400',
                  boxShadow: '0 0 0 3px rgba(102, 126, 234, 0.1)'
                }}
              />
            </Box>
          )}
        </Flex>

        {/* Passengers and Cabin */}
        <Flex gap="12px" direction={{ base: 'column', md: 'row' }}>
          <Box flex="1">
            <Text fontSize="xs" fontWeight="600" color="gray.600" mb="8px">
              PASSENGERS
            </Text>
            <Select
              value={passengers}
              onChange={(e) => setPassengers(Number(e.target.value))}
              size="lg"
              borderRadius="12px"
              border="2px solid"
              borderColor="gray.200"
              _focus={{
                borderColor: 'purple.400',
                boxShadow: '0 0 0 3px rgba(102, 126, 234, 0.1)'
              }}
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                <option key={num} value={num}>{num} {num === 1 ? 'Passenger' : 'Passengers'}</option>
              ))}
            </Select>
          </Box>

          <Box flex="1">
            <Text fontSize="xs" fontWeight="600" color="gray.600" mb="8px">
              CABIN CLASS
            </Text>
            <Select
              value={cabin}
              onChange={(e) => setCabin(e.target.value)}
              size="lg"
              borderRadius="12px"
              border="2px solid"
              borderColor="gray.200"
              _focus={{
                borderColor: 'purple.400',
                boxShadow: '0 0 0 3px rgba(102, 126, 234, 0.1)'
              }}
            >
              <option value="economy">Economy</option>
              <option value="premium-economy">Premium Economy</option>
              <option value="business">Business</option>
              <option value="first">First Class</option>
            </Select>
          </Box>
        </Flex>

        {/* Search Button */}
        <Button
          onClick={handleSearch}
          isLoading={isLoading}
          size="lg"
          bgGradient="linear(to-r, blue.500, purple.600)"
          color="white"
          borderRadius="12px"
          fontSize="md"
          fontWeight="700"
          h="56px"
          _hover={{
            bgGradient: 'linear(to-r, blue.600, purple.700)',
            transform: 'translateY(-2px)',
            boxShadow: '0 8px 24px rgba(102, 126, 234, 0.4)'
          }}
          _active={{
            transform: 'translateY(0)'
          }}
          transition="all 0.2s ease"
          isDisabled={!from || !to || !departDate}
        >
          <Icon as={MdFlight} mr="8px" w="20px" h="20px" />
          Search Flights
        </Button>
      </VStack>
    </Box>
  );
}
