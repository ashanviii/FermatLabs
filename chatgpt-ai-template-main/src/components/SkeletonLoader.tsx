'use client';
import { Box, Skeleton, SkeletonText, VStack, Flex } from '@chakra-ui/react';

export default function SkeletonLoader() {
  return (
    <Box
      w="100%"
      maxW="960px"
      bg="white"
      border="1px solid"
      borderColor="gray.200"
      borderRadius="24px"
      overflow="hidden"
      position="relative"
      animation="fadeIn 0.3s ease-in"
      sx={{
        '@keyframes fadeIn': {
          from: { opacity: 0, transform: 'translateY(10px)' },
          to: { opacity: 1, transform: 'translateY(0)' }
        },
        '@keyframes pulse': {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.5 }
        }
      }}
    >
      {/* Animated top border */}
      <Box
        position="absolute"
        top={0}
        left={0}
        right={0}
        height="4px"
        bgGradient="linear(to-r, purple.500, pink.500, orange.400)"
        backgroundSize="200% 100%"
        animation="shimmer 2s linear infinite"
        sx={{
          '@keyframes shimmer': {
            '0%': { backgroundPosition: '-200% 0' },
            '100%': { backgroundPosition: '200% 0' }
          }
        }}
      />

      {/* Header skeleton */}
      <Flex
        align="center"
        gap="12px"
        px={{ base: '20px', md: '32px' }}
        py={{ base: '14px', md: '18px' }}
        bg="gray.50"
        borderBottom="1px solid"
        borderColor="gray.200"
      >
        <Skeleton 
          w="20px" 
          h="20px" 
          borderRadius="full"
          startColor="purple.200"
          endColor="purple.300"
        />
        <Skeleton 
          h="18px" 
          w="140px"
          startColor="gray.200"
          endColor="gray.300"
        />
      </Flex>

      {/* Content skeleton */}
      <VStack
        align="stretch"
        spacing={4}
        px={{ base: '20px', md: '32px' }}
        py={{ base: '20px', md: '28px' }}
      >
        {/* Title skeleton */}
        <Skeleton 
          h="24px" 
          w="60%"
          startColor="gray.100"
          endColor="gray.200"
          borderRadius="md"
        />

        {/* Paragraph skeletons */}
        <SkeletonText
          mt="4"
          noOfLines={3}
          spacing="3"
          skeletonHeight="3"
          startColor="gray.100"
          endColor="gray.200"
        />

        {/* Another paragraph */}
        <SkeletonText
          mt="4"
          noOfLines={4}
          spacing="3"
          skeletonHeight="3"
          startColor="gray.100"
          endColor="gray.200"
        />

        {/* Bullet points skeleton */}
        <VStack align="stretch" spacing={2} mt={4}>
          {[1, 2, 3].map((i) => (
            <Flex key={i} align="center" gap={3}>
              <Skeleton 
                w="6px" 
                h="6px" 
                borderRadius="full"
                startColor="purple.100"
                endColor="purple.200"
              />
              <Skeleton 
                h="3" 
                flex={1}
                startColor="gray.100"
                endColor="gray.200"
                borderRadius="sm"
              />
            </Flex>
          ))}
        </VStack>

        {/* Final paragraph */}
        <SkeletonText
          mt="4"
          noOfLines={2}
          spacing="3"
          skeletonHeight="3"
          startColor="gray.100"
          endColor="gray.200"
        />
      </VStack>
    </Box>
  );
}
