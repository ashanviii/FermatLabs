'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Box,
  Container,
  Flex,
  Text,
  Button,
  VStack,
  HStack,
  Icon,
} from '@chakra-ui/react';
import { keyframes } from '@emotion/react';
import { motion, AnimatePresence } from 'framer-motion';
import { MdFlight, MdHotel, MdRestaurant, MdDirectionsCar, MdExplore, MdAutoAwesome, MdArrowForward, MdPlayArrow, MdClose, MdKeyboardArrowDown } from 'react-icons/md';
import { FaPassport, FaRobot, FaGlobeAmericas, FaStar, FaQuoteLeft } from 'react-icons/fa';
import { HiSparkles } from 'react-icons/hi';
import { useRouter } from 'next/navigation';

const MotionBox = motion.div as any;
const MotionText = motion.span as any;
const MotionFlex = motion.div as any;

// Keyframe animations
const float = keyframes`
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-15px); }
`;

const gradientMove = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

const orbit = keyframes`
  from { transform: rotate(0deg) translateX(120px) rotate(0deg); }
  to { transform: rotate(360deg) translateX(120px) rotate(-360deg); }
`;

const pulse = keyframes`
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(1.1); }
`;

const bounce = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(10px); }
`;

// Section wrapper with scroll snap
const Section = ({ children, id }: { children: React.ReactNode; id: string }) => {
  return (
    <Box
      id={id}
      minH="100vh"
      h="100vh"
      w="100%"
      display="flex"
      alignItems="center"
      justifyContent="center"
      position="relative"
      scrollSnapAlign="start"
      scrollSnapStop="always"
      overflow="hidden"
    >
      {children}
    </Box>
  );
};

// Animated text with letter stagger
const AnimatedHeadline = ({ text, delay = 0, isVisible }: { text: string; delay?: number; isVisible: boolean }) => {
  const letters = text.split('');
  
  return (
    <Flex flexWrap="wrap" justify="center">
      {letters.map((letter, index) => {
        const MotionSpan = motion.span as any;
        return (
          <MotionSpan
            key={index}
            initial={{ opacity: 0, y: 50 }}
            animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
            transition={{
              duration: 0.5,
              delay: delay + index * 0.03,
              ease: [0.25, 0.46, 0.45, 0.94]
            }}
            style={{
              display: 'inline-block',
              fontSize: 'clamp(1.875rem, 5vw, 4.5rem)',
              fontWeight: 900,
              color: 'white',
              letterSpacing: '-0.02em'
            }}
          >
            {letter === ' ' ? '\u00A0' : letter}
          </MotionSpan>
        );
      })}
    </Flex>
  );
};

// Feature card
const FeatureCard = ({ icon, title, description, gradient, index, isVisible }: any) => {
  return (
    <MotionBox
      initial={{ opacity: 0, y: 60 }}
      animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 60 }}
      transition={{ duration: 0.6, delay: index * 0.1, ease: [0.25, 0.46, 0.45, 0.94] as any }}
      bg="rgba(255, 255, 255, 0.03)"
      backdropFilter="blur(20px)"
      border="1px solid rgba(255, 255, 255, 0.08)"
      borderRadius="24px"
      p={6}
      cursor="pointer"
      _hover={{
        border: '1px solid rgba(255, 215, 0, 0.4)',
        transform: 'translateY(-8px)',
        bg: 'rgba(255, 255, 255, 0.05)',
      }}
      whileHover={{ y: -8 }}
    >
      <VStack align="start" spacing={4}>
        <Flex
          w="56px"
          h="56px"
          align="center"
          justify="center"
          borderRadius="16px"
          bg={gradient}
          boxShadow="0 8px 32px rgba(255, 215, 0, 0.3)"
        >
          <Icon as={icon} w={6} h={6} color="white" />
        </Flex>
        <Text fontSize="lg" fontWeight="700" color="white">
          {title}
        </Text>
        <Text fontSize="sm" color="whiteAlpha.600" lineHeight="1.7">
          {description}
        </Text>
      </VStack>
    </MotionBox>
  );
};

// Counter component
const Counter = ({ value, suffix, label, isVisible }: { value: number; suffix: string; label: string; isVisible: boolean }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (isVisible) {
      let start = 0;
      const duration = 2000;
      const increment = value / (duration / 16);
      
      const timer = setInterval(() => {
        start += increment;
        if (start >= value) {
          setCount(value);
          clearInterval(timer);
        } else {
          setCount(Math.floor(start));
        }
      }, 16);

      return () => clearInterval(timer);
    }
  }, [isVisible, value]);

  return (
    <VStack spacing={1}>
      <Text
        fontSize={{ base: '3xl', md: '5xl' }}
        fontWeight="900"
        bgGradient="linear(to-r, #FFD700, #FFC107)"
        bgClip="text"
      >
        {count}{suffix}
      </Text>
      <Text color="whiteAlpha.500" fontSize="sm" textTransform="uppercase" letterSpacing="wider">
        {label}
      </Text>
    </VStack>
  );
};

// Video modal
const VideoModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const AnimatePresenceAny = AnimatePresence as any;
  return (
    <AnimatePresenceAny>
      {isOpen && (
        <MotionBox
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.95)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onClick={onClose}
        >
          <MotionBox
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.8 }}
            style={{
              width: '90%',
              maxWidth: '900px',
              height: 0,
              paddingBottom: '56.25%',
              background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.2), rgba(255, 193, 7, 0.2))',
              borderRadius: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
            }}
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
          >
            <Button position="absolute" top={4} right={4} variant="ghost" color="white" onClick={onClose} zIndex={1}>
              <Icon as={MdClose} w={8} h={8} />
            </Button>
            <Flex position="absolute" inset={0} align="center" justify="center">
              <VStack>
                <Icon as={MdPlayArrow} w={20} h={20} color="whiteAlpha.800" />
                <Text color="whiteAlpha.600">Demo Video</Text>
              </VStack>
            </Flex>
          </MotionBox>
        </MotionBox>
      )}
    </AnimatePresenceAny>
  );
};

// Scroll indicator
const ScrollIndicator = ({ onClick }: { onClick: () => void }) => (
  <VStack 
    position="absolute" 
    bottom={8} 
    left="50%" 
    transform="translateX(-50%)" 
    spacing={2}
    cursor="pointer"
    onClick={onClick}
    opacity={0.6}
    _hover={{ opacity: 1 }}
    transition="opacity 0.3s"
  >
    <Text color="whiteAlpha.500" fontSize="xs" textTransform="uppercase" letterSpacing="wider">
      Scroll
    </Text>
    <Box css={{ animation: `${bounce} 1.5s ease-in-out infinite` }}>
      <Icon as={MdKeyboardArrowDown} w={6} h={6} color="whiteAlpha.500" />
    </Box>
  </VStack>
);

// Navigation dots
const NavDots = ({ activeSection, sections, onNavigate }: { activeSection: number; sections: string[]; onNavigate: (index: number) => void }) => (
  <VStack
    position="fixed"
    right={6}
    top="50%"
    transform="translateY(-50%)"
    spacing={3}
    zIndex={100}
    display={{ base: 'none', md: 'flex' }}
  >
    {sections.map((section, index) => (
      <Box
        key={section}
        w={activeSection === index ? "12px" : "8px"}
        h={activeSection === index ? "12px" : "8px"}
        borderRadius="full"
        bg={activeSection === index ? "linear-gradient(135deg, #FFD700, #FFC107)" : "whiteAlpha.300"}
        cursor="pointer"
        onClick={() => onNavigate(index)}
        transition="all 0.3s ease"
        _hover={{ bg: activeSection === index ? "linear-gradient(135deg, #FFD700, #FFC107)" : "whiteAlpha.500" }}
      />
    ))}
  </VStack>
);

export default function LandingPagePro() {
  const router = useRouter();
  const [videoOpen, setVideoOpen] = useState(false);
  const [activeSection, setActiveSection] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const sections = ['hero', 'features', 'stats', 'how-it-works', 'testimonials', 'team', 'cta'];

  // Scroll to section
  const scrollToSection = useCallback((index: number) => {
    if (isScrolling || index < 0 || index >= sections.length) return;
    
    const section = document.getElementById(sections[index]);
    if (section && containerRef.current) {
      setIsScrolling(true);
      setActiveSection(index);
      
      containerRef.current.scrollTo({
        top: section.offsetTop,
        behavior: 'smooth'
      });
      
      setTimeout(() => setIsScrolling(false), 800);
    }
  }, [isScrolling, sections]);

  // Handle wheel event for snap scrolling
  useEffect(() => {
    let lastScrollTime = 0;
    const scrollCooldown = 800;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      
      const now = Date.now();
      if (now - lastScrollTime < scrollCooldown) return;
      
      if (e.deltaY > 0 && activeSection < sections.length - 1) {
        lastScrollTime = now;
        scrollToSection(activeSection + 1);
      } else if (e.deltaY < 0 && activeSection > 0) {
        lastScrollTime = now;
        scrollToSection(activeSection - 1);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const now = Date.now();
      if (now - lastScrollTime < scrollCooldown) return;

      if ((e.key === 'ArrowDown' || e.key === ' ' || e.key === 'PageDown') && activeSection < sections.length - 1) {
        e.preventDefault();
        lastScrollTime = now;
        scrollToSection(activeSection + 1);
      } else if ((e.key === 'ArrowUp' || e.key === 'PageUp') && activeSection > 0) {
        e.preventDefault();
        lastScrollTime = now;
        scrollToSection(activeSection - 1);
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
    }
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      if (container) {
        container.removeEventListener('wheel', handleWheel);
      }
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeSection, scrollToSection, sections.length]);

  // Handle touch events for mobile
  useEffect(() => {
    let touchStartY = 0;
    let lastTouchTime = 0;
    const touchCooldown = 800;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const now = Date.now();
      if (now - lastTouchTime < touchCooldown) return;

      const touchEndY = e.changedTouches[0].clientY;
      const diff = touchStartY - touchEndY;

      if (Math.abs(diff) > 50) {
        if (diff > 0 && activeSection < sections.length - 1) {
          lastTouchTime = now;
          scrollToSection(activeSection + 1);
        } else if (diff < 0 && activeSection > 0) {
          lastTouchTime = now;
          scrollToSection(activeSection - 1);
        }
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('touchstart', handleTouchStart, { passive: true });
      container.addEventListener('touchmove', handleTouchMove, { passive: false });
      container.addEventListener('touchend', handleTouchEnd, { passive: true });
    }

    return () => {
      if (container) {
        container.removeEventListener('touchstart', handleTouchStart);
        container.removeEventListener('touchmove', handleTouchMove);
        container.removeEventListener('touchend', handleTouchEnd);
      }
    };
  }, [activeSection, scrollToSection, sections.length]);

  const features = [
    { icon: FaPassport, title: "Visa Intelligence", description: "AI-powered visa checks for 195+ countries with real-time requirements.", gradient: "linear-gradient(135deg, #FFD700 0%, #F4B400 100%)" },
    { icon: MdFlight, title: "Smart Flights", description: "Compare 500+ airlines. Find optimal routes and hidden deals.", gradient: "linear-gradient(135deg, #FFC107 0%, #FF9800 100%)" },
    { icon: MdHotel, title: "Hotel Matching", description: "AI-curated stays matched to your style and budget.", gradient: "linear-gradient(135deg, #FFEB3B 0%, #FFD700 100%)" },
    { icon: MdRestaurant, title: "Dining Discovery", description: "Local gems with personalized recommendations.", gradient: "linear-gradient(135deg, #F4B400 0%, #E6A100 100%)" },
    { icon: MdDirectionsCar, title: "Car Rentals", description: "Seamless comparisons with transparent pricing.", gradient: "linear-gradient(135deg, #FFD54F 0%, #FFC107 100%)" },
    { icon: MdExplore, title: "Tour Planning", description: "Build custom itineraries with intelligent planning.", gradient: "linear-gradient(135deg, #FFD700 0%, #FFC107 100%)" }
  ];

  const testimonials = [
    { quote: "Fermat saved me hours of research. Got my Dubai visa sorted in minutes!", author: "Nikhil Issar", role: "USA" },
    { quote: "The flight recommendations are incredibly smart. Found $400 savings!", author: "Jaya Aggarwal", role: "Germany" },
    { quote: "Finally, an AI that actually understands travel. This is the future.", author: "Zainab", role: "France" }
  ];

  const founders = [
    { name: "Srijan", role: "CEO", description: "HEC Paris, Ex: PE, MIT,American Express", image: "/img/founders/srijan.jpg" },
    { name: "Shubham", role: "CTO", description: "Microsoft AI, Ex: Oracle,HSBC,BITS Pilani", image: "/img/founders/shubham.jpg" },
    { name: "Ashanvi", role: "CDO", description: "Design expert, Ex:Adobe,5x Startups", image: "/img/founders/ashanvi.jpg" }
  ];

  return (
    <Box bg="#050507" h="100vh" overflow="hidden" position="relative">
      {/* Simple static background */}
      <Box position="fixed" inset={0} pointerEvents="none" zIndex={0}>
        {/* Top right glow */}
        <Box
          position="absolute"
          top="-20%"
          right="-10%"
          w="60vw"
          h="60vw"
          borderRadius="full"
          bg="radial-gradient(circle, rgba(255, 215, 0, 0.12) 0%, transparent 50%)"
          filter="blur(80px)"
        />
        {/* Bottom left glow */}
        <Box
          position="absolute"
          bottom="-20%"
          left="-10%"
          w="50vw"
          h="50vw"
          borderRadius="full"
          bg="radial-gradient(circle, rgba(255, 193, 7, 0.1) 0%, transparent 50%)"
          filter="blur(80px)"
        />
        {/* Subtle grid */}
        <Box
          position="absolute"
          inset={0}
          backgroundImage="linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)"
          backgroundSize="80px 80px"
        />
      </Box>

      {/* Navigation dots */}
      <NavDots activeSection={activeSection} sections={sections} onNavigate={scrollToSection} />

      {/* Floating nav */}
      <Box
        position="fixed"
        top={6}
        left="50%"
        transform="translateX(-50%)"
        zIndex={1000}
      >
        <MotionBox
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          <Flex
            bg="rgba(5, 5, 7, 0.8)"
            backdropFilter="blur(24px)"
            border="1px solid rgba(255, 255, 255, 0.1)"
            borderRadius="full"
            px={{ base: 4, md: 8 }}
            py={3}
            align="center"
            gap={{ base: 4, md: 10 }}
            boxShadow="0 8px 32px rgba(0, 0, 0, 0.4)"
          >
            <HStack spacing={2}>
              <Icon as={HiSparkles} w={5} h={5} color="#FFD700" />
              <Text fontSize={{ base: 'md', md: 'lg' }} fontWeight="800" color="white">Fermat</Text>
            </HStack>
            <HStack spacing={6} display={{ base: 'none', lg: 'flex' }}>
              {['Features', 'How it works', 'Pricing'].map((item, i) => (
                <Text 
                  key={item} 
                  color="whiteAlpha.600" 
                  cursor="pointer" 
                  _hover={{ color: 'white' }} 
                  transition="color 0.2s" 
                  fontSize="sm" 
                  fontWeight="500"
                  onClick={() => scrollToSection(i + 1)}
                >
                  {item}
                </Text>
              ))}
            </HStack>
            <Button
              bg="white"
              color="black"
              borderRadius="full"
              px={{ base: 4, md: 6 }}
              size="sm"
              fontWeight="600"
              _hover={{ transform: 'scale(1.05)', boxShadow: '0 8px 24px rgba(255, 255, 255, 0.2)' }}
              transition="all 0.3s ease"
              onClick={() => router.push('/')}
            >
              Get Started
            </Button>
          </Flex>
        </MotionBox>
      </Box>

      {/* Scrollable container - THIS IS THE KEY FOR APPLE-STYLE SCROLL */}
      <Box
        ref={containerRef}
        h="100vh"
        overflowY="hidden"
        overflowX="hidden"
        position="relative"
        css={{
          '&::-webkit-scrollbar': { display: 'none' },
          msOverflowStyle: 'none',
          scrollbarWidth: 'none',
        }}
      >
        {/* ==================== SECTION 1: HERO ==================== */}
        <Section id="hero">
          <Container maxW="container.xl" position="relative" zIndex={1}>
            <VStack spacing={8} textAlign="center">
              {/* Badge */}
              <MotionBox
                initial={{ opacity: 0, y: 20 }}
                animate={activeSection === 0 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <Flex
                  align="center"
                  gap={3}
                  bg="rgba(255, 215, 0, 0.15)"
                  border="1px solid rgba(255, 215, 0, 0.3)"
                  borderRadius="full"
                  px={5}
                  py={2}
                >
                  <Box position="relative">
                    <Box w={2} h={2} borderRadius="full" bg="#FFD700" />
                    <Box
                      position="absolute"
                      inset={-1}
                      borderRadius="full"
                      bg="#FFD700"
                      css={{ animation: `${pulse} 2s ease-in-out infinite` }}
                      opacity={0.4}
                    />
                  </Box>
                  <Text color="whiteAlpha.900" fontSize="sm" fontWeight="600">
                    Powered by GPT-4
                  </Text>
                </Flex>
              </MotionBox>

              {/* Headlines */}
              <VStack spacing={0}>
                <AnimatedHeadline text="Travel Smarter" delay={0.3} isVisible={activeSection === 0} />
                <MotionText
                  initial={{ opacity: 0, y: 50 }}
                  animate={activeSection === 0 ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
                  transition={{ duration: 0.8, delay: 0.7 }}
                  fontSize={{ base: '3xl', md: '5xl', lg: '7xl' }}
                  fontWeight="900"
                  lineHeight="1"
                  bgGradient="linear(to-r, #FFD700, #FFC107, #F4B400)"
                  bgClip="text"
                  bgSize="200% 200%"
                  css={{ animation: `${gradientMove} 4s ease infinite` }}
                >
                  with AI
                </MotionText>
              </VStack>

              {/* Subtitle */}
              <MotionText
                initial={{ opacity: 0, y: 30 }}
                animate={activeSection === 0 ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                transition={{ duration: 0.8, delay: 0.9 }}
                fontSize={{ base: 'md', md: 'lg' }}
                color="whiteAlpha.600"
                maxW="500px"
                lineHeight="1.7"
              >
                Your intelligent companion for visas, flights, hotels, and experiences. 
                One conversation to plan your entire journey.
              </MotionText>

              {/* CTA Buttons */}
              <MotionFlex
                initial={{ opacity: 0, y: 30 }}
                animate={activeSection === 0 ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                transition={{ duration: 0.8, delay: 1.1 }}
                gap={4}
                flexWrap="wrap"
                justify="center"
              >
                <Button
                  onClick={() => router.push('/')}
                  bg="white"
                  color="black"
                  borderRadius="full"
                  px={8}
                  py={6}
                  fontSize="md"
                  fontWeight="700"
                  rightIcon={<Icon as={MdArrowForward} />}
                  _hover={{ transform: 'scale(1.05)', boxShadow: '0 20px 40px rgba(255, 255, 255, 0.2)' }}
                  transition="all 0.3s ease"
                  h="auto"
                >
                  Start Free
                </Button>
                <Button
                  onClick={() => setVideoOpen(true)}
                  variant="outline"
                  color="white"
                  borderColor="whiteAlpha.300"
                  borderRadius="full"
                  px={8}
                  py={6}
                  fontSize="md"
                  fontWeight="600"
                  leftIcon={<Icon as={MdPlayArrow} />}
                  _hover={{ bg: 'whiteAlpha.100', borderColor: 'whiteAlpha.500' }}
                  transition="all 0.3s ease"
                  h="auto"
                >
                  Watch Demo
                </Button>
              </MotionFlex>

              {/* Orbiting Globe */}
              <MotionBox
                initial={{ opacity: 0, scale: 0.8 }}
                animate={activeSection === 0 ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
                transition={{ duration: 1, delay: 1.3 }}
                position="relative"
                h={{ base: '200px', md: '250px' }}
                w={{ base: '200px', md: '250px' }}
                mt={10}
              >
                {/* Center globe */}
                <Flex
                  position="absolute"
                  top="50%"
                  left="50%"
                  transform="translate(-50%, -50%)"
                  w={{ base: '80px', md: '100px' }}
                  h={{ base: '80px', md: '100px' }}
                  borderRadius="full"
                  bg="linear-gradient(135deg, rgba(255, 215, 0, 0.4), rgba(255, 193, 7, 0.4))"
                  align="center"
                  justify="center"
                  boxShadow="0 0 60px rgba(255, 215, 0, 0.4)"
                >
                  <Icon as={FaGlobeAmericas} w={{ base: 8, md: 10 }} h={{ base: 8, md: 10 }} color="white" />
                </Flex>
                
                {/* Orbiting icons */}
                {[FaPassport, MdFlight, MdHotel, MdRestaurant].map((IconComp, i) => (
                  <Box
                    key={i}
                    position="absolute"
                    top="50%"
                    left="50%"
                    css={{ animation: `${orbit} 12s linear infinite` }}
                    style={{ animationDelay: `${i * -3}s` }}
                  >
                    <Flex
                      w={{ base: '36px', md: '44px' }}
                      h={{ base: '36px', md: '44px' }}
                      borderRadius="full"
                      bg="rgba(255, 255, 255, 0.1)"
                      backdropFilter="blur(10px)"
                      border="1px solid rgba(255, 255, 255, 0.15)"
                      align="center"
                      justify="center"
                    >
                      <Icon as={IconComp} w={{ base: 4, md: 5 }} h={{ base: 4, md: 5 }} color="whiteAlpha.900" />
                    </Flex>
                  </Box>
                ))}
              </MotionBox>
            </VStack>
          </Container>
          <ScrollIndicator onClick={() => scrollToSection(1)} />
        </Section>

        {/* ==================== SECTION 2: FEATURES ==================== */}
        <Section id="features">
          <Container maxW="container.xl" position="relative" zIndex={1}>
            <VStack spacing={12}>
              <VStack spacing={4} textAlign="center">
                <MotionText
                  initial={{ opacity: 0, y: 20 }}
                  animate={activeSection === 1 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                  transition={{ duration: 0.6 }}
                  fontSize="sm"
                  color="#FFD700"
                  fontWeight="700"
                  textTransform="uppercase"
                  letterSpacing="0.2em"
                >
                  Everything you need
                </MotionText>
                <MotionText
                  initial={{ opacity: 0, y: 30 }}
                  animate={activeSection === 1 ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                  fontSize={{ base: '2xl', md: '4xl' }}
                  fontWeight="800"
                  color="white"
                >
                  One platform for your entire journey
                </MotionText>
              </VStack>

              <Box
                display="grid"
                gridTemplateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }}
                gap={5}
                w="100%"
                maxW="1000px"
              >
                {features.map((feature, index) => (
                  <FeatureCard key={index} {...feature} index={index} isVisible={activeSection === 1} />
                ))}
              </Box>
            </VStack>
          </Container>
          <ScrollIndicator onClick={() => scrollToSection(2)} />
        </Section>

        {/* ==================== SECTION 3: STATS ==================== */}
        <Section id="stats">
          <Container maxW="container.lg" position="relative" zIndex={1}>
            <VStack spacing={12}>
              <VStack spacing={4} textAlign="center">
                <MotionText
                  initial={{ opacity: 0, y: 20 }}
                  animate={activeSection === 2 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                  transition={{ duration: 0.6 }}
                  fontSize="sm"
                  color="#FFC107"
                  fontWeight="700"
                  textTransform="uppercase"
                  letterSpacing="0.2em"
                >
                  Trusted worldwide
                </MotionText>
                <MotionText
                  initial={{ opacity: 0, y: 30 }}
                  animate={activeSection === 2 ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                  fontSize={{ base: '2xl', md: '4xl' }}
                  fontWeight="800"
                  color="white"
                >
                  Numbers that speak for themselves
                </MotionText>
              </VStack>

              <MotionBox
                initial={{ opacity: 0, scale: 0.95 }}
                animate={activeSection === 2 ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                w="100%"
              >
                <Flex
                  justify="space-around"
                  align="center"
                  flexWrap="wrap"
                  gap={8}
                  bg="linear-gradient(135deg, rgba(255, 215, 0, 0.1), rgba(255, 193, 7, 0.1))"
                  border="1px solid rgba(255, 255, 255, 0.08)"
                  borderRadius="32px"
                  py={16}
                  px={8}
                >
                  <Counter value={10} suffix="+" label="Countries" isVisible={activeSection === 2} />
                  <Counter value={100} suffix="+" label="Travel Agents" isVisible={activeSection === 2} />
                  <Counter value={1} suffix="k+" label="Users" isVisible={activeSection === 2} />
                  <Counter value={90} suffix="%+" label="Accuracy" isVisible={activeSection === 2} />
                </Flex>
              </MotionBox>
            </VStack>
          </Container>
          <ScrollIndicator onClick={() => scrollToSection(3)} />
        </Section>

        {/* ==================== SECTION 4: HOW IT WORKS ==================== */}
        <Section id="how-it-works">
          <Container maxW="container.xl" position="relative" zIndex={1}>
            <VStack spacing={12}>
              <VStack spacing={4} textAlign="center">
                <MotionText
                  initial={{ opacity: 0, y: 20 }}
                  animate={activeSection === 3 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                  transition={{ duration: 0.6 }}
                  fontSize="sm"
                  color="#14B8A6"
                  fontWeight="700"
                  textTransform="uppercase"
                  letterSpacing="0.2em"
                >
                  Simple process
                </MotionText>
                <MotionText
                  initial={{ opacity: 0, y: 30 }}
                  animate={activeSection === 3 ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                  fontSize={{ base: '2xl', md: '4xl' }}
                  fontWeight="800"
                  color="white"
                >
                  How Fermat Works
                </MotionText>
              </VStack>

              <Flex
                direction={{ base: 'column', lg: 'row' }}
                gap={6}
                w="100%"
                maxW="1000px"
              >
                {[
                  { num: '01', title: 'Ask Anything', desc: 'Type naturally. Our AI understands context and intent.', icon: FaRobot },
                  { num: '02', title: 'AI Researches', desc: 'Multiple agents find and verify the best options.', icon: HiSparkles },
                  { num: '03', title: 'Get Results', desc: 'Personalized recommendations with next steps.', icon: MdAutoAwesome }
                ].map((item, index) => (
                  <MotionBox
                    key={index}
                    initial={{ opacity: 0, y: 50 }}
                    animate={activeSection === 3 ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
                    transition={{ duration: 0.6, delay: index * 0.15 }}
                    style={{
                      flex: 1,
                      padding: '2rem',
                      borderRadius: '24px',
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                    whileHover={{ borderColor: 'rgba(255, 215, 0, 0.3)' }}
                  >
                    <Text
                      position="absolute"
                      top={4}
                      right={4}
                      fontSize="6xl"
                      fontWeight="900"
                      color="whiteAlpha.100"
                      lineHeight={1}
                    >
                      {item.num}
                    </Text>
                    <VStack align="start" spacing={5} position="relative" zIndex={1}>
                      <Flex
                        w="50px"
                        h="50px"
                        borderRadius="14px"
                        bg="linear-gradient(135deg, #FFD700, #FFC107)"
                        align="center"
                        justify="center"
                      >
                        <Icon as={item.icon} w={6} h={6} color="white" />
                      </Flex>
                      <Text fontSize="xl" fontWeight="700" color="white">{item.title}</Text>
                      <Text color="whiteAlpha.600" lineHeight="1.7">{item.desc}</Text>
                    </VStack>
                  </MotionBox>
                ))}
              </Flex>
            </VStack>
          </Container>
          <ScrollIndicator onClick={() => scrollToSection(4)} />
        </Section>

        {/* ==================== SECTION 5: TESTIMONIALS ==================== */}
        <Section id="testimonials">
          <Container maxW="container.xl" position="relative" zIndex={1}>
            <VStack spacing={12}>
              <VStack spacing={4} textAlign="center">
                <MotionText
                  initial={{ opacity: 0, y: 20 }}
                  animate={activeSection === 4 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                  transition={{ duration: 0.6 }}
                  fontSize="sm"
                  color="#F59E0B"
                  fontWeight="700"
                  textTransform="uppercase"
                  letterSpacing="0.2em"
                >
                  Loved by travelers
                </MotionText>
                <MotionText
                  initial={{ opacity: 0, y: 30 }}
                  animate={activeSection === 4 ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                  fontSize={{ base: '2xl', md: '4xl' }}
                  fontWeight="800"
                  color="white"
                >
                  What people are saying
                </MotionText>
              </VStack>

              <Flex
                direction={{ base: 'column', md: 'row' }}
                gap={6}
                w="100%"
                maxW="1000px"
              >
                {testimonials.map((testimonial, index) => (
                  <MotionBox
                    key={index}
                    initial={{ opacity: 0, y: 50 }}
                    animate={activeSection === 4 ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
                    transition={{ duration: 0.6, delay: index * 0.15 }}
                    flex={1}
                    bg="rgba(255, 255, 255, 0.03)"
                    border="1px solid rgba(255, 255, 255, 0.08)"
                    borderRadius="24px"
                    p={6}
                    position="relative"
                  >
                    <Icon as={FaQuoteLeft} w={6} h={6} color="whiteAlpha.200" position="absolute" top={4} left={4} />
                    <VStack align="start" spacing={4} pt={6}>
                      <HStack spacing={1}>
                        {[...Array(5)].map((_, i) => (
                          <Icon key={i} as={FaStar} w={4} h={4} color="#F59E0B" />
                        ))}
                      </HStack>
                      <Text color="whiteAlpha.800" fontSize="md" lineHeight="1.7" fontStyle="italic">
                        &ldquo;{testimonial.quote}&rdquo;
                      </Text>
                      <HStack spacing={3} pt={2}>
                        <Box w="40px" h="40px" borderRadius="full" bg="linear-gradient(135deg, #FFD700, #FFC107)" />
                        <VStack align="start" spacing={0}>
                          <Text color="white" fontWeight="600" fontSize="sm">{testimonial.author}</Text>
                          <Text color="whiteAlpha.500" fontSize="xs">{testimonial.role}</Text>
                        </VStack>
                      </HStack>
                    </VStack>
                  </MotionBox>
                ))}
              </Flex>
            </VStack>
          </Container>
          <ScrollIndicator onClick={() => scrollToSection(5)} />
        </Section>

        {/* ==================== SECTION 6: TEAM/FOUNDERS ==================== */}
        <Section id="team">
          <Container maxW="container.xl" position="relative" zIndex={1}>
            <VStack spacing={12}>
              <VStack spacing={4} textAlign="center">
                <MotionText
                  initial={{ opacity: 0, y: 20 }}
                  animate={activeSection === 5 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                  transition={{ duration: 0.6 }}
                  fontSize="sm"
                  color="#FFD700"
                  fontWeight="700"
                  textTransform="uppercase"
                  letterSpacing="0.2em"
                >
                  Meet the team
                </MotionText>
                <MotionText
                  initial={{ opacity: 0, y: 30 }}
                  animate={activeSection === 5 ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                  fontSize={{ base: '2xl', md: '4xl' }}
                  fontWeight="800"
                  color="white"
                >
                  The minds behind Fermat
                </MotionText>
              </VStack>

              <Flex
                direction="row"
                gap={{ base: 3, md: 8 }}
                w="100%"
                maxW="1100px"
                justify="center"
                flexWrap="wrap"
                px={{ base: 2, md: 0 }}
              >
                {founders.map((founder, index) => (
                  <MotionBox
                    key={index}
                    initial={{ opacity: 0, y: 50 }}
                    animate={activeSection === 5 ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
                    transition={{ duration: 0.6, delay: index * 0.15 }}
                    style={{
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '24px',
                      padding: '1.5rem',
                      textAlign: 'center',
                    }}
                    whileHover={{ y: -5, borderColor: 'rgba(255, 215, 0, 0.3)' }}
                  >
                    <VStack spacing={{ base: 2, md: 4 }}>
                      <Box
                        w={{ base: '80px', md: '120px' }}
                        h={{ base: '80px', md: '120px' }}
                        borderRadius="full"
                        overflow="hidden"
                        border={{ base: '2px solid rgba(255, 215, 0, 0.3)', md: '3px solid rgba(255, 215, 0, 0.3)' }}
                        boxShadow="0 8px 32px rgba(255, 215, 0, 0.15)"
                        mt={{ base: 2, md: 4 }}
                      >
                        <Box
                          as="img"
                          src={founder.image}
                          alt={founder.name}
                          w="140%"
                          h="140%"
                          objectFit="cover"
                          objectPosition="left 20%"
                          transform="translateY(-2%)"
                          filter="grayscale(100%)"
                          _hover={{ filter: 'grayscale(0%)' }}
                          transition="filter 0.3s ease"
                        />
                      </Box>
                      <VStack spacing={0}>
                        <Text color="white" fontWeight="700" fontSize={{ base: 'sm', md: 'lg' }}>
                          {founder.name}, {founder.role}
                        </Text>
                        <Text color="whiteAlpha.600" fontSize={{ base: 'xs', md: 'sm' }} px={{ base: 1, md: 0 }}>
                          {founder.description}
                        </Text>
                      </VStack>
                    </VStack>
                  </MotionBox>
                ))}
              </Flex>
            </VStack>
          </Container>
          <ScrollIndicator onClick={() => scrollToSection(6)} />
        </Section>

        {/* ==================== SECTION 7: FINAL CTA ==================== */}
        <Section id="cta">
          <Container maxW="container.md" position="relative" zIndex={1}>
            <MotionBox
              initial={{ opacity: 0, scale: 0.95 }}
              animate={activeSection === 6 ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.8 }}
              bg="linear-gradient(135deg, rgba(255, 215, 0, 0.15), rgba(255, 193, 7, 0.15))"
              border="1px solid rgba(255, 215, 0, 0.25)"
              borderRadius="40px"
              p={{ base: 10, md: 16 }}
              textAlign="center"
              position="relative"
              overflow="hidden"
            >
              <Box
                position="absolute"
                inset={0}
                bg="radial-gradient(circle at 30% 30%, rgba(255, 215, 0, 0.2), transparent 60%)"
              />
              <VStack spacing={8} position="relative" zIndex={1}>
                <Box css={{ animation: `${float} 3s ease-in-out infinite` }}>
                  <Icon as={HiSparkles} w={12} h={12} color="#FFD700" />
                </Box>
                <Text
                  fontSize={{ base: 'xl', md: '3xl' }}
                  fontWeight="800"
                  color="white"
                  lineHeight="1.3"
                >
                  Ready to revolutionize your travel planning?
                </Text>
                <Text fontSize="md" color="whiteAlpha.700" maxW="400px">
                  Join thousands already using AI to explore the world smarter.
                </Text>
                <Button
                  onClick={() => router.push('/')}
                  bg="white"
                  color="black"
                  borderRadius="full"
                  px={10}
                  py={6}
                  fontSize="md"
                  fontWeight="700"
                  rightIcon={<Icon as={MdAutoAwesome} />}
                  _hover={{ transform: 'scale(1.05)', boxShadow: '0 20px 40px rgba(255, 255, 255, 0.2)' }}
                  transition="all 0.3s ease"
                  h="auto"
                >
                  Start Your Journey
                </Button>
              </VStack>
            </MotionBox>

            {/* Footer */}
            <Flex
              direction={{ base: 'column', md: 'row' }}
              justify="space-between"
              align="center"
              gap={4}
              mt={16}
              pt={8}
              borderTop="1px solid rgba(255, 255, 255, 0.08)"
            >
              <HStack spacing={2}>
                <Icon as={HiSparkles} w={4} h={4} color="#FFD700" />
                <Text fontSize="md" fontWeight="700" color="white">Fermat</Text>
              </HStack>
              <Text color="whiteAlpha.400" fontSize="xs">© 2024 Fermat AI. All rights reserved.</Text>
              <HStack spacing={6}>
                {['Privacy', 'Terms', 'Contact'].map(item => (
                  <Text key={item} color="whiteAlpha.500" cursor="pointer" _hover={{ color: 'white' }} fontSize="xs">{item}</Text>
                ))}
              </HStack>
            </Flex>
          </Container>
        </Section>
      </Box>

      {/* Video Modal */}
      <VideoModal isOpen={videoOpen} onClose={() => setVideoOpen(false)} />
    </Box>
  );
}
