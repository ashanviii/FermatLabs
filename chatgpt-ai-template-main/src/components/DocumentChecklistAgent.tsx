'use client';
import { Box, Flex, Text, Icon, VStack, HStack, Badge, Button, Checkbox } from '@chakra-ui/react';
import { MdCheckCircle, MdWarning, MdDescription, MdFileUpload } from 'react-icons/md';
import { FaPassport, FaIdCard, FaFileAlt, FaCamera } from 'react-icons/fa';
import { useState } from 'react';

export interface Document {
  id: string;
  name: string;
  category: 'passport' | 'photo' | 'financial' | 'supporting' | 'application';
  required: boolean;
  verified: boolean;
  description: string;
  tips?: string[];
}

interface DocumentChecklistAgentProps {
  documents: Document[];
  onUpload?: (documentId: string) => void;
  onToggleVerified?: (documentId: string) => void;
  visaType?: string;
  country?: string;
}

export default function DocumentChecklistAgent({ 
  documents, 
  onUpload, 
  onToggleVerified,
  visaType = 'Tourist',
  country = 'Destination'
}: DocumentChecklistAgentProps) {
  const [expandedDoc, setExpandedDoc] = useState<string | null>(null);

  const getCategoryIcon = (category: Document['category']) => {
    switch (category) {
      case 'passport': return FaPassport;
      case 'photo': return FaCamera;
      case 'financial': return FaIdCard;
      case 'application': return MdDescription;
      default: return FaFileAlt;
    }
  };

  const getCategoryColor = (category: Document['category']) => {
    switch (category) {
      case 'passport': return 'blue';
      case 'photo': return 'purple';
      case 'financial': return 'green';
      case 'application': return 'orange';
      default: return 'gray';
    }
  };

  const completionPercentage = Math.round((documents.filter(d => d.verified).length / documents.length) * 100);
  const requiredDocs = documents.filter(d => d.required);
  const requiredCompleted = requiredDocs.filter(d => d.verified).length;

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
            <Icon as={MdDescription} color="purple.600" w="24px" h="24px" />
            <Text fontSize="xl" fontWeight="700" color="gray.800">
              Document Checklist
            </Text>
          </HStack>
          <Text fontSize="sm" color="gray.600">
            {visaType} Visa for {country}
          </Text>
        </VStack>

        <VStack align="end" spacing="4px">
          <Text fontSize="2xl" fontWeight="700" color="purple.600">
            {completionPercentage}%
          </Text>
          <Text fontSize="xs" color="gray.600">
            {requiredCompleted}/{requiredDocs.length} required completed
          </Text>
        </VStack>
      </Flex>

      {/* Progress Bar */}
      <Box
        h="8px"
        bg="gray.200"
        borderRadius="full"
        overflow="hidden"
        mb="28px"
      >
        <Box
          h="100%"
          w={`${completionPercentage}%`}
          bgGradient="linear(to-r, green.400, green.600)"
          transition="width 0.5s ease"
        />
      </Box>

      {/* Document List */}
      <VStack spacing="12px" align="stretch">
        {documents.map((doc) => (
          <Box
            key={doc.id}
            bg={doc.verified ? 'green.50' : 'white'}
            border="2px solid"
            borderColor={doc.verified ? 'green.300' : 'gray.200'}
            borderRadius="16px"
            p="16px"
            transition="all 0.3s ease"
            _hover={{
              borderColor: doc.verified ? 'green.400' : 'purple.300',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)'
            }}
          >
            <Flex align="start" gap="12px">
              {/* Checkbox */}
              <Checkbox
                isChecked={doc.verified}
                onChange={() => onToggleVerified?.(doc.id)}
                size="lg"
                colorScheme="green"
                mt="2px"
              />

              {/* Category Icon */}
              <Flex
                minW="40px"
                h="40px"
                borderRadius="10px"
                align="center"
                justify="center"
                bg={`${getCategoryColor(doc.category)}.100`}
              >
                <Icon 
                  as={getCategoryIcon(doc.category)} 
                  color={`${getCategoryColor(doc.category)}.600`}
                  w="20px" 
                  h="20px" 
                />
              </Flex>

              {/* Document Info */}
              <VStack align="start" spacing="6px" flex="1">
                <HStack>
                  <Text fontSize="md" fontWeight="700" color="gray.800">
                    {doc.name}
                  </Text>
                  {doc.required && (
                    <Badge colorScheme="red" fontSize="xs">
                      Required
                    </Badge>
                  )}
                  {doc.verified && (
                    <Icon as={MdCheckCircle} color="green.500" w="18px" h="18px" />
                  )}
                </HStack>

                <Text fontSize="sm" color="gray.600">
                  {doc.description}
                </Text>

                {/* Tips - Expandable */}
                {doc.tips && doc.tips.length > 0 && (
                  <>
                    <Button
                      size="xs"
                      variant="ghost"
                      colorScheme="purple"
                      onClick={() => setExpandedDoc(expandedDoc === doc.id ? null : doc.id)}
                    >
                      {expandedDoc === doc.id ? 'Hide Tips' : 'Show Tips'}
                    </Button>

                    {expandedDoc === doc.id && (
                      <VStack align="start" spacing="4px" pl="12px" mt="8px">
                        {doc.tips.map((tip, idx) => (
                          <HStack key={idx} spacing="8px" align="start">
                            <Icon as={MdWarning} color="orange.500" w="14px" h="14px" mt="2px" />
                            <Text fontSize="xs" color="gray.700">
                              {tip}
                            </Text>
                          </HStack>
                        ))}
                      </VStack>
                    )}
                  </>
                )}
              </VStack>

              {/* Upload Button */}
              {!doc.verified && onUpload && (
                <Button
                  size="sm"
                  leftIcon={<Icon as={MdFileUpload} />}
                  onClick={() => onUpload(doc.id)}
                  colorScheme="purple"
                  variant="outline"
                  borderRadius="10px"
                >
                  Upload
                </Button>
              )}
            </Flex>
          </Box>
        ))}
      </VStack>

      {/* Summary Warning */}
      {requiredCompleted < requiredDocs.length && (
        <Flex
          mt="20px"
          p="16px"
          bg="orange.50"
          borderRadius="12px"
          border="1px solid"
          borderColor="orange.200"
          align="center"
          gap="12px"
        >
          <Icon as={MdWarning} color="orange.500" w="24px" h="24px" />
          <Text fontSize="sm" color="gray.700">
            You still need to complete {requiredDocs.length - requiredCompleted} required document{requiredDocs.length - requiredCompleted !== 1 ? 's' : ''} before submitting your application.
          </Text>
        </Flex>
      )}
    </Box>
  );
}
