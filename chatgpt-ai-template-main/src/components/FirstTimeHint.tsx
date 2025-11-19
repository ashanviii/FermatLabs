'use client';
import { Box, Text, VStack, HStack, Icon, Badge, Button } from '@chakra-ui/react';
import { MdInfo, MdClose, MdLightbulb } from 'react-icons/md';
import { useState, useEffect } from 'react';

interface FirstTimeHintProps {
  onDismiss?: () => void;
}

export default function FirstTimeHint({ onDismiss }: FirstTimeHintProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [hasSeenHint, setHasSeenHint] = useState(false);

  useEffect(() => {
    // Check if user has seen the hint before
    const seen = localStorage.getItem('fermat_hint_seen');
    if (!seen) {
      setTimeout(() => setIsVisible(true), 2000);
    } else {
      setHasSeenHint(true);
    }
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('fermat_hint_seen', 'true');
    setHasSeenHint(true);
    if (onDismiss) onDismiss();
  };

  if (hasSeenHint || !isVisible) return null;

  return (
    <Box
      position="fixed"
      bottom={{ base: '24px', md: '32px' }}
      left="50%"
      transform="translateX(-50%)"
      zIndex={9999}
      maxW="500px"
      w="90%"
      animation="slideUp 0.5s ease-out"
      sx={{
        '@keyframes slideUp': {
          '0%': { transform: 'translateX(-50%) translateY(100px)', opacity: 0 },
          '100%': { transform: 'translateX(-50%) translateY(0)', opacity: 1 }
        }
      }}
    >
      <Box
        bg="white"
        borderRadius="16px"
        p={5}
        boxShadow="0 8px 32px rgba(0, 0, 0, 0.15), 0 0 0 2px rgba(139, 92, 246, 0.2)"
        border="2px solid"
        borderColor="purple.200"
        position="relative"
      >
        {/* Close button */}
        <Button
          position="absolute"
          top={2}
          right={2}
          size="sm"
          variant="ghost"
          onClick={handleDismiss}
          borderRadius="full"
        >
          <Icon as={MdClose} />
        </Button>

        <VStack spacing={3} align="stretch">
          {/* Header */}
          <HStack spacing={2}>
            <Icon as={MdLightbulb} color="purple.500" w="24px" h="24px" />
            <Badge colorScheme="purple" fontSize="xs" px={2} py={1} borderRadius="full">
              First time here?
            </Badge>
          </HStack>

          {/* Content */}
          <VStack spacing={2} align="stretch">
            <Text fontSize="sm" fontWeight="700" color="gray.800">
              👋 Welcome to Fermat Travel AI!
            </Text>
            <Text fontSize="xs" color="gray.600" lineHeight="1.6">
              Click <strong>"Show All Services"</strong> (top-left) to see everything we can help you with, 
              or try one of the <strong>Quick Actions</strong> above to get started instantly!
            </Text>
          </VStack>

          {/* Action */}
          <Button
            size="sm"
            colorScheme="purple"
            borderRadius="full"
            onClick={handleDismiss}
            fontSize="xs"
          >
            Got it, thanks!
          </Button>
        </VStack>

        {/* Decorative element */}
        <Box
          position="absolute"
          top="-10px"
          left="50%"
          transform="translateX(-50%)"
          w="0"
          h="0"
          borderLeft="10px solid transparent"
          borderRight="10px solid transparent"
          borderBottom="10px solid"
          borderBottomColor="purple.200"
        />
      </Box>
    </Box>
  );
}
