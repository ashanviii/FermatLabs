'use client';
import { Box, Flex, Text, Icon, VStack, HStack, Badge, Button, SimpleGrid } from '@chakra-ui/react';
import { MdHotel, MdStar, MdLocationOn, MdWifi, MdRestaurant, MdPool, MdFitnessCenter } from 'react-icons/md';
import { FaBed, FaDollarSign } from 'react-icons/fa';

export interface Hotel {
  id: string;
  name: string;
  rating: number;
  pricePerNight: number;
  location: string;
  distance: string;
  image?: string;
  amenities: string[];
  rooms: number;
  reviewCount: number;
  freeCancellation: boolean;
}

interface HotelBookingAgentProps {
  hotels: Hotel[];
  onSelectHotel: (hotel: Hotel) => void;
  destination?: string;
  checkIn?: string;
  checkOut?: string;
}

export default function HotelBookingAgent({ 
  hotels, 
  onSelectHotel,
  destination = 'Destination',
  checkIn,
  checkOut 
}: HotelBookingAgentProps) {
  const getAmenityIcon = (amenity: string) => {
    if (amenity.toLowerCase().includes('wifi')) return MdWifi;
    if (amenity.toLowerCase().includes('restaurant') || amenity.toLowerCase().includes('breakfast')) return MdRestaurant;
    if (amenity.toLowerCase().includes('pool')) return MdPool;
    if (amenity.toLowerCase().includes('gym') || amenity.toLowerCase().includes('fitness')) return MdFitnessCenter;
    return MdStar;
  };

  const calculateNights = () => {
    if (!checkIn || !checkOut) return 1;
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const nights = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return nights > 0 ? nights : 1;
  };

  const nights = calculateNights();

  return (
    <Box
      bg="rgba(255, 255, 255, 0.98)"
      backdropFilter="blur(20px)"
      borderRadius="24px"
      p={{ base: '24px', md: '32px' }}
      boxShadow="0 12px 40px rgba(0, 0, 0, 0.1)"
      border="1px solid"
      borderColor="rgba(200, 200, 220, 0.4)"
    >
      {/* Header */}
      <Flex align="center" justify="space-between" mb="24px" flexWrap="wrap" gap="12px">
        <VStack align="start" spacing="4px">
          <HStack>
            <Icon as={MdHotel} color="purple.600" w="24px" h="24px" />
            <Text fontSize="xl" fontWeight="700" color="gray.800">
              Hotels in {destination}
            </Text>
          </HStack>
          <Text fontSize="sm" color="gray.600">
            {hotels.length} properties found • {nights} night{nights > 1 ? 's' : ''}
          </Text>
        </VStack>

        {checkIn && checkOut && (
          <VStack align="end" spacing="2px">
            <Text fontSize="xs" color="gray.500" fontWeight="600">
              CHECK-IN
            </Text>
            <Text fontSize="sm" fontWeight="700" color="gray.800">
              {new Date(checkIn).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </Text>
            <Text fontSize="xs" color="gray.500" fontWeight="600" mt="4px">
              CHECK-OUT
            </Text>
            <Text fontSize="sm" fontWeight="700" color="gray.800">
              {new Date(checkOut).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </Text>
          </VStack>
        )}
      </Flex>

      {/* Hotel Cards */}
      <VStack spacing="16px" align="stretch">
        {hotels.map((hotel, index) => (
          <Box
            key={hotel.id}
            bg="white"
            borderRadius="16px"
            overflow="hidden"
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
            {/* Best Value Badge */}
            {index === 0 && (
              <Badge
                position="absolute"
                top="12px"
                right="12px"
                colorScheme="green"
                fontSize="xs"
                px="12px"
                py="4px"
                borderRadius="full"
                zIndex={1}
              >
                ⭐ Best Value
              </Badge>
            )}

            <Flex direction={{ base: 'column', md: 'row' }} p="20px" gap="20px">
              {/* Hotel Image Placeholder */}
              <Flex
                minW={{ base: '100%', md: '200px' }}
                h={{ base: '160px', md: '180px' }}
                bg="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                borderRadius="12px"
                align="center"
                justify="center"
              >
                <Icon as={MdHotel} color="white" w="60px" h="60px" opacity={0.8} />
              </Flex>

              {/* Hotel Info */}
              <Flex flex="1" direction="column" gap="12px">
                <VStack align="start" spacing="4px">
                  <Text fontSize="lg" fontWeight="700" color="gray.800">
                    {hotel.name}
                  </Text>
                  
                  <HStack spacing="8px">
                    <HStack spacing="2px">
                      {[...Array(5)].map((_, i) => (
                        <Icon
                          key={i}
                          as={MdStar}
                          color={i < hotel.rating ? 'yellow.400' : 'gray.300'}
                          w="16px"
                          h="16px"
                        />
                      ))}
                    </HStack>
                    <Text fontSize="xs" color="gray.600">
                      ({hotel.reviewCount} reviews)
                    </Text>
                  </HStack>

                  <HStack spacing="8px">
                    <Icon as={MdLocationOn} color="gray.500" w="14px" h="14px" />
                    <Text fontSize="sm" color="gray.600">
                      {hotel.location} • {hotel.distance}
                    </Text>
                  </HStack>
                </VStack>

                {/* Amenities */}
                <SimpleGrid columns={{ base: 2, md: 4 }} spacing="8px">
                  {hotel.amenities.slice(0, 4).map((amenity, idx) => (
                    <HStack key={idx} spacing="6px">
                      <Icon 
                        as={getAmenityIcon(amenity)} 
                        color="purple.500" 
                        w="14px" 
                        h="14px" 
                      />
                      <Text fontSize="xs" color="gray.700">
                        {amenity}
                      </Text>
                    </HStack>
                  ))}
                </SimpleGrid>

                {/* Badges */}
                <HStack spacing="8px" flexWrap="wrap">
                  {hotel.freeCancellation && (
                    <Badge colorScheme="green" fontSize="xs">
                      Free Cancellation
                    </Badge>
                  )}
                  {hotel.rooms <= 3 && (
                    <Badge colorScheme="red" fontSize="xs">
                      Only {hotel.rooms} room{hotel.rooms > 1 ? 's' : ''} left!
                    </Badge>
                  )}
                </HStack>
              </Flex>

              {/* Price & Action */}
              <VStack
                spacing="12px"
                justify="center"
                align={{ base: 'stretch', md: 'end' }}
                minW={{ base: 'auto', md: '180px' }}
              >
                <VStack spacing="2px" align={{ base: 'start', md: 'end' }}>
                  <Text fontSize="xs" color="gray.500">
                    from
                  </Text>
                  <Text fontSize="3xl" fontWeight="700" color="purple.600">
                    ${hotel.pricePerNight}
                  </Text>
                  <Text fontSize="xs" color="gray.600">
                    per night
                  </Text>
                  <Text fontSize="sm" fontWeight="600" color="gray.700" mt="4px">
                    ${hotel.pricePerNight * nights} total
                  </Text>
                </VStack>

                <Button
                  onClick={() => onSelectHotel(hotel)}
                  size="lg"
                  bgGradient="linear(to-r, purple.500, pink.500)"
                  color="white"
                  borderRadius="12px"
                  fontSize="md"
                  fontWeight="700"
                  w="100%"
                  _hover={{
                    bgGradient: 'linear(to-r, purple.600, pink.600)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 6px 20px rgba(147, 51, 234, 0.4)'
                  }}
                  _active={{
                    transform: 'translateY(0)'
                  }}
                >
                  Book Now
                </Button>
              </VStack>
            </Flex>
          </Box>
        ))}
      </VStack>
    </Box>
  );
}
