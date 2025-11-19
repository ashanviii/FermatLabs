'use client';
import { Box, Flex, Text, Icon, VStack, HStack, Badge, Button } from '@chakra-ui/react';
import { MdTimeline, MdFlight, MdHotel, MdRestaurant, MdMap, MdAccessTime } from 'react-icons/md';
import { FaMapMarkedAlt, FaCamera, FaUtensils } from 'react-icons/fa';

export interface ItineraryDay {
  day: number;
  date: string;
  activities: Activity[];
  meals?: {
    breakfast?: string;
    lunch?: string;
    dinner?: string;
  };
  accommodation?: string;
}

export interface Activity {
  id: string;
  time: string;
  title: string;
  description: string;
  location: string;
  duration: string;
  type: 'flight' | 'hotel' | 'sightseeing' | 'restaurant' | 'activity' | 'transport';
  cost?: number;
  bookingRequired?: boolean;
}

interface ItineraryPlannerProps {
  days: ItineraryDay[];
  destination: string;
  startDate: string;
  endDate: string;
  onEditDay?: (dayNumber: number) => void;
  onBookActivity?: (activityId: string) => void;
}

export default function ItineraryPlanner({ 
  days, 
  destination, 
  startDate, 
  endDate,
  onEditDay,
  onBookActivity
}: ItineraryPlannerProps) {
  const getActivityIcon = (type: Activity['type']) => {
    switch (type) {
      case 'flight': return MdFlight;
      case 'hotel': return MdHotel;
      case 'restaurant': return MdRestaurant;
      case 'sightseeing': return FaCamera;
      default: return MdMap;
    }
  };

  const getActivityColor = (type: Activity['type']) => {
    switch (type) {
      case 'flight': return 'blue';
      case 'hotel': return 'purple';
      case 'restaurant': return 'orange';
      case 'sightseeing': return 'green';
      default: return 'gray';
    }
  };

  const totalCost = days.reduce((total, day) => {
    return total + day.activities.reduce((dayTotal, activity) => {
      return dayTotal + (activity.cost || 0);
    }, 0);
  }, 0);

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
      <Flex align="center" justify="space-between" mb="28px" flexWrap="wrap" gap="12px">
        <VStack align="start" spacing="4px">
          <HStack>
            <Icon as={FaMapMarkedAlt} color="purple.600" w="24px" h="24px" />
            <Text fontSize="xl" fontWeight="700" color="gray.800">
              Your {destination} Itinerary
            </Text>
          </HStack>
          <Text fontSize="sm" color="gray.600">
            {new Date(startDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} - {new Date(endDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </Text>
        </VStack>

        <VStack align="end" spacing="2px">
          <Text fontSize="xs" color="gray.500" fontWeight="600">
            TOTAL COST
          </Text>
          <Text fontSize="2xl" fontWeight="700" color="purple.600">
            ${totalCost}
          </Text>
          <Text fontSize="xs" color="gray.600">
            {days.length} day{days.length > 1 ? 's' : ''}
          </Text>
        </VStack>
      </Flex>

      {/* Timeline */}
      <VStack spacing="24px" align="stretch" position="relative">
        {/* Vertical Line */}
        <Box
          position="absolute"
          left="19px"
          top="24px"
          bottom="24px"
          w="2px"
          bg="purple.200"
          zIndex={0}
        />

        {days.map((day, dayIndex) => (
          <Box key={day.day} position="relative">
            {/* Day Header */}
            <Flex
              align="center"
              gap="16px"
              mb="16px"
              bg="white"
              borderRadius="16px"
              p="16px"
              border="2px solid"
              borderColor="purple.300"
              boxShadow="0 4px 12px rgba(147, 51, 234, 0.1)"
              position="relative"
              zIndex={1}
            >
              <Flex
                minW="40px"
                h="40px"
                borderRadius="full"
                bg="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                align="center"
                justify="center"
                color="white"
                fontWeight="700"
                fontSize="lg"
              >
                {day.day}
              </Flex>

              <VStack align="start" spacing="2px" flex="1">
                <Text fontSize="lg" fontWeight="700" color="gray.800">
                  Day {day.day}
                </Text>
                <Text fontSize="sm" color="gray.600">
                  {new Date(day.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                </Text>
              </VStack>

              {day.accommodation && (
                <Badge colorScheme="purple" fontSize="xs" px="12px" py="4px">
                  🏨 {day.accommodation}
                </Badge>
              )}

              {onEditDay && (
                <Button
                  size="sm"
                  variant="ghost"
                  colorScheme="purple"
                  onClick={() => onEditDay(day.day)}
                >
                  Edit
                </Button>
              )}
            </Flex>

            {/* Activities */}
            <VStack spacing="12px" align="stretch" pl="56px">
              {day.activities.map((activity) => (
                <Flex
                  key={activity.id}
                  bg="white"
                  borderRadius="12px"
                  p="16px"
                  border="1px solid"
                  borderColor="gray.200"
                  gap="12px"
                  _hover={{
                    borderColor: 'purple.200',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.06)'
                  }}
                  transition="all 0.2s ease"
                >
                  {/* Time */}
                  <VStack spacing="2px" minW="60px" align="start">
                    <Icon as={MdAccessTime} color="gray.500" w="14px" h="14px" />
                    <Text fontSize="sm" fontWeight="700" color="gray.800">
                      {activity.time}
                    </Text>
                    <Text fontSize="xs" color="gray.500">
                      {activity.duration}
                    </Text>
                  </VStack>

                  {/* Activity Icon */}
                  <Flex
                    minW="40px"
                    h="40px"
                    borderRadius="10px"
                    bg={`${getActivityColor(activity.type)}.100`}
                    align="center"
                    justify="center"
                  >
                    <Icon
                      as={getActivityIcon(activity.type)}
                      color={`${getActivityColor(activity.type)}.600`}
                      w="20px"
                      h="20px"
                    />
                  </Flex>

                  {/* Activity Details */}
                  <VStack align="start" spacing="4px" flex="1">
                    <Text fontSize="md" fontWeight="700" color="gray.800">
                      {activity.title}
                    </Text>
                    <Text fontSize="sm" color="gray.600">
                      {activity.description}
                    </Text>
                    <HStack spacing="12px" mt="4px">
                      <HStack spacing="4px">
                        <Icon as={MdMap} color="gray.500" w="14px" h="14px" />
                        <Text fontSize="xs" color="gray.600">
                          {activity.location}
                        </Text>
                      </HStack>
                      {activity.cost && (
                        <Badge colorScheme="green" fontSize="xs">
                          ${activity.cost}
                        </Badge>
                      )}
                      {activity.bookingRequired && (
                        <Badge colorScheme="orange" fontSize="xs">
                          Booking Required
                        </Badge>
                      )}
                    </HStack>
                  </VStack>

                  {/* Book Button */}
                  {activity.bookingRequired && onBookActivity && (
                    <Button
                      size="sm"
                      colorScheme="purple"
                      variant="outline"
                      onClick={() => onBookActivity(activity.id)}
                    >
                      Book
                    </Button>
                  )}
                </Flex>
              ))}

              {/* Meals Summary */}
              {day.meals && (
                <Flex
                  bg="orange.50"
                  borderRadius="12px"
                  p="12px"
                  gap="16px"
                  flexWrap="wrap"
                  border="1px solid"
                  borderColor="orange.200"
                >
                  <Icon as={FaUtensils} color="orange.500" w="16px" h="16px" mt="2px" />
                  {day.meals.breakfast && (
                    <Text fontSize="xs" color="gray.700">
                      🍳 <strong>Breakfast:</strong> {day.meals.breakfast}
                    </Text>
                  )}
                  {day.meals.lunch && (
                    <Text fontSize="xs" color="gray.700">
                      🍱 <strong>Lunch:</strong> {day.meals.lunch}
                    </Text>
                  )}
                  {day.meals.dinner && (
                    <Text fontSize="xs" color="gray.700">
                      🍽️ <strong>Dinner:</strong> {day.meals.dinner}
                    </Text>
                  )}
                </Flex>
              )}
            </VStack>
          </Box>
        ))}
      </VStack>

      {/* Summary Footer */}
      <Flex
        mt="28px"
        p="20px"
        bg="linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)"
        borderRadius="16px"
        justify="space-between"
        align="center"
        flexWrap="wrap"
        gap="12px"
      >
        <Text fontSize="sm" color="gray.700" fontWeight="600">
          ✨ AI-generated itinerary customized for you
        </Text>
        <Button
          size="md"
          bgGradient="linear(to-r, purple.500, pink.500)"
          color="white"
          borderRadius="12px"
          _hover={{
            bgGradient: 'linear(to-r, purple.600, pink.600)'
          }}
        >
          Download PDF
        </Button>
      </Flex>
    </Box>
  );
}
