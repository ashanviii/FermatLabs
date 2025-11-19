'use client';
import { Box, Flex, Text, Icon, VStack, HStack, Badge, Button, Collapse, useDisclosure } from '@chakra-ui/react';
import { MdHistory, MdExpandMore, MdExpandLess, MdPerson, MdSmartToy } from 'react-icons/md';
import { FaBrain, FaMapMarkedAlt } from 'react-icons/fa';
import { useState } from 'react';

export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  topics?: string[];
}

export interface UserContext {
  nationality?: string;
  destination?: string;
  travelPurpose?: string;
  travelDates?: { start: string; end: string };
  preferences?: string[];
  previousQueries?: string[];
}

interface ConversationMemoryProps {
  messages: ConversationMessage[];
  userContext: UserContext;
  onClearHistory?: () => void;
  onExportHistory?: () => void;
}

export default function ConversationMemory({ 
  messages, 
  userContext,
  onClearHistory,
  onExportHistory
}: ConversationMemoryProps) {
  const { isOpen, onToggle } = useDisclosure({ defaultIsOpen: false });
  const [showAllMessages, setShowAllMessages] = useState(false);

  const displayedMessages = showAllMessages ? messages : messages.slice(-3);

  return (
    <Box
      position="fixed"
      bottom={{ base: '20px', md: '32px' }}
      right={{ base: '20px', md: '32px' }}
      maxW={{ base: '90vw', md: '400px' }}
      zIndex={1000}
    >
      {/* Collapsed Button */}
      {!isOpen && (
        <Button
          onClick={onToggle}
          size="lg"
          borderRadius="full"
          bgGradient="linear(to-r, purple.500, pink.500)"
          color="white"
          boxShadow="0 8px 24px rgba(147, 51, 234, 0.4)"
          leftIcon={<Icon as={FaBrain} />}
          _hover={{
            bgGradient: 'linear(to-r, purple.600, pink.600)',
            transform: 'translateY(-2px)',
            boxShadow: '0 12px 32px rgba(147, 51, 234, 0.5)'
          }}
          transition="all 0.2s ease"
        >
          Context Memory
          <Badge ml="8px" colorScheme="white" variant="solid" borderRadius="full">
            {messages.length}
          </Badge>
        </Button>
      )}

      {/* Expanded Panel */}
      <Collapse in={isOpen} animateOpacity>
        <Box
          bg="rgba(255, 255, 255, 0.98)"
          backdropFilter="blur(20px)"
          borderRadius="24px"
          p="20px"
          boxShadow="0 12px 40px rgba(0, 0, 0, 0.15)"
          border="1px solid"
          borderColor="rgba(200, 200, 220, 0.4)"
          maxH="80vh"
          overflow="hidden"
          display="flex"
          flexDirection="column"
        >
          {/* Header */}
          <Flex align="center" justify="space-between" mb="16px">
            <HStack>
              <Icon as={FaBrain} color="purple.600" w="20px" h="20px" />
              <Text fontSize="lg" fontWeight="700" color="gray.800">
                Context Memory
              </Text>
              <Badge colorScheme="purple" borderRadius="full">
                {messages.length}
              </Badge>
            </HStack>
            <Button
              size="sm"
              variant="ghost"
              onClick={onToggle}
              leftIcon={<Icon as={MdExpandLess} />}
            >
              Hide
            </Button>
          </Flex>

          {/* User Context Summary */}
          <Box
            bg="purple.50"
            borderRadius="12px"
            p="12px"
            mb="16px"
            border="1px solid"
            borderColor="purple.200"
          >
            <HStack mb="8px">
              <Icon as={FaMapMarkedAlt} color="purple.600" w="16px" h="16px" />
              <Text fontSize="sm" fontWeight="700" color="gray.800">
                Your Context
              </Text>
            </HStack>
            <VStack align="start" spacing="4px">
              {userContext.nationality && (
                <HStack spacing="8px">
                  <Text fontSize="xs" color="gray.600" fontWeight="600">
                    From:
                  </Text>
                  <Badge colorScheme="blue" fontSize="xs">
                    {userContext.nationality}
                  </Badge>
                </HStack>
              )}
              {userContext.destination && (
                <HStack spacing="8px">
                  <Text fontSize="xs" color="gray.600" fontWeight="600">
                    To:
                  </Text>
                  <Badge colorScheme="green" fontSize="xs">
                    {userContext.destination}
                  </Badge>
                </HStack>
              )}
              {userContext.travelPurpose && (
                <HStack spacing="8px">
                  <Text fontSize="xs" color="gray.600" fontWeight="600">
                    Purpose:
                  </Text>
                  <Badge colorScheme="orange" fontSize="xs">
                    {userContext.travelPurpose}
                  </Badge>
                </HStack>
              )}
              {userContext.travelDates && (
                <HStack spacing="8px">
                  <Text fontSize="xs" color="gray.600" fontWeight="600">
                    Dates:
                  </Text>
                  <Text fontSize="xs" color="gray.700">
                    {userContext.travelDates.start} - {userContext.travelDates.end}
                  </Text>
                </HStack>
              )}
            </VStack>
          </Box>

          {/* Conversation History */}
          <VStack
            spacing="12px"
            align="stretch"
            flex="1"
            overflowY="auto"
            maxH="400px"
            css={{
              '&::-webkit-scrollbar': {
                width: '6px',
              },
              '&::-webkit-scrollbar-track': {
                background: '#f1f1f1',
                borderRadius: '10px',
              },
              '&::-webkit-scrollbar-thumb': {
                background: '#a855f7',
                borderRadius: '10px',
              },
            }}
          >
            {displayedMessages.map((message) => (
              <Flex
                key={message.id}
                gap="8px"
                align="start"
              >
                {/* Avatar */}
                <Flex
                  minW="32px"
                  h="32px"
                  borderRadius="full"
                  bg={message.role === 'user' ? 'blue.100' : 'purple.100'}
                  align="center"
                  justify="center"
                >
                  <Icon
                    as={message.role === 'user' ? MdPerson : MdSmartToy}
                    color={message.role === 'user' ? 'blue.600' : 'purple.600'}
                    w="18px"
                    h="18px"
                  />
                </Flex>

                {/* Message */}
                <VStack align="start" spacing="4px" flex="1">
                  <HStack justify="space-between" w="100%">
                    <Text fontSize="xs" fontWeight="700" color="gray.700">
                      {message.role === 'user' ? 'You' : 'Fermat AI'}
                    </Text>
                    <Text fontSize="xs" color="gray.500">
                      {new Date(message.timestamp).toLocaleTimeString('en-US', { 
                        hour: 'numeric', 
                        minute: '2-digit' 
                      })}
                    </Text>
                  </HStack>
                  <Text
                    fontSize="xs"
                    color="gray.700"
                    bg={message.role === 'user' ? 'blue.50' : 'purple.50'}
                    p="8px"
                    borderRadius="8px"
                    noOfLines={3}
                  >
                    {message.content}
                  </Text>
                  {message.topics && message.topics.length > 0 && (
                    <HStack spacing="4px" flexWrap="wrap">
                      {message.topics.map((topic, idx) => (
                        <Badge key={idx} colorScheme="purple" fontSize="xs" variant="subtle">
                          {topic}
                        </Badge>
                      ))}
                    </HStack>
                  )}
                </VStack>
              </Flex>
            ))}
          </VStack>

          {/* Show More Button */}
          {messages.length > 3 && (
            <Button
              size="xs"
              variant="ghost"
              colorScheme="purple"
              onClick={() => setShowAllMessages(!showAllMessages)}
              mt="12px"
              leftIcon={<Icon as={showAllMessages ? MdExpandLess : MdExpandMore} />}
            >
              {showAllMessages ? 'Show Less' : `Show ${messages.length - 3} More`}
            </Button>
          )}

          {/* Actions */}
          <HStack spacing="8px" mt="16px" pt="16px" borderTop="1px solid" borderColor="gray.200">
            <Button
              size="sm"
              variant="outline"
              colorScheme="purple"
              flex="1"
              onClick={onExportHistory}
            >
              Export
            </Button>
            <Button
              size="sm"
              variant="outline"
              colorScheme="red"
              flex="1"
              onClick={onClearHistory}
            >
              Clear
            </Button>
          </HStack>
        </Box>
      </Collapse>
    </Box>
  );
}
