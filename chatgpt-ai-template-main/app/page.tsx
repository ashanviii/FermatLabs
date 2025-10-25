'use client';
/* eslint-disable */

import Link from '@/components/link/Link';
import MessageBoxChat from '@/components/MessageBox';
import TypewriterText from '../src/components/TypewriterText';
import ThinkingAnimation from '../src/components/ThinkingAnimation';
import { ChatBody, OpenAIModel } from '@/types/types';
import {
  Box,
  Button,
  Flex,
  Icon,
  Img,
  Input,
  Text,
  useColorModeValue,
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { MdAutoAwesome, MdBolt, MdPerson } from 'react-icons/md';
import Bg from '../public/img/chat/back.gif';
import { useAuth } from '../src/contexts/AuthContext';

export default function Chat() {
  const [inputCode, setInputCode] = useState('');
  const [outputCode, setOutputCode] = useState('');
  const [fullAnswer, setFullAnswer] = useState(''); // Store the complete answer for typewriter
  const [model, setModel] = useState<OpenAIModel>('reddit-rag');
  const [loading, setLoading] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
  const [showTypewriter, setShowTypewriter] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  
  // Use Firebase auth
  const { user, loading: authLoading, signInWithGoogle, logOut } = useAuth();

  const borderColor = useColorModeValue('gray.200', 'whiteAlpha.200');
  const iconColor = useColorModeValue('brand.500', 'white');
  const bgIcon = useColorModeValue(
    'linear-gradient(180deg, #FBFBFF 0%, #CACAFF 100%)',
    'whiteAlpha.200'
  );
  const buttonBg = useColorModeValue('white', 'whiteAlpha.100');
  const gray = useColorModeValue('gray.500', 'white');
  const buttonShadow = useColorModeValue(
    '14px 27px 45px rgba(112, 144, 176, 0.2)',
    'none'
  );
  const textColor = useColorModeValue('navy.700', 'white');

  // Handle Firebase Google Sign In
  const handleGoogleSignIn = async () => {
    try {
      setFadeOut(true);
      await signInWithGoogle();
      setTimeout(() => {
        setFadeOut(false);
      }, 600);
    } catch (error) {
      console.error('Google Sign In Error:', error);
      alert('Google Login Failed');
      setFadeOut(false);
    }
  };

  // Handle Firebase Sign Out
  const handleSignOut = async () => {
    try {
      await logOut();
    } catch (error) {
      console.error('Sign Out Error:', error);
    }
  };

  const handleChange = (e: any) => setInputCode(e.target.value);

  const handleKeyPress = (e: any) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (isTyping) {
        handleStopTyping();
      } else {
        handleTranslate();
      }
    }
  };

  const handleStopTyping = () => {
    setIsTyping(false);
    setShowTypewriter(false);
    // Show the full answer immediately
    setOutputCode(fullAnswer);
  };

  const handleTranslate = async () => {
    if (!inputCode) return alert('Please enter your message.');
    setOutputCode('');
    setFullAnswer('');
    setShowTypewriter(false);
    setIsTyping(false);
    setLoading(true);
    try {
      const response = await fetch(
        `/api/redditRAG?query=${encodeURIComponent(inputCode)}`,
        { method: 'GET', headers: { 'Content-Type': 'application/json' } }
      );
      if (!response.ok) throw new Error(`API error: ${response.status}`);
      const data = await response.json();
      const answer = data.answer || 'No answer found.';
      setFullAnswer(answer); // Store the complete answer
      // Small delay before starting typewriter to show loading completed
      setTimeout(() => {
        setShowTypewriter(true);
        setIsTyping(true);
      }, 300);
    } catch (err) {
      console.error(err);
      alert('Backend connection failed.');
    } finally {
      setLoading(false);
    }
  };

  // 🚫 Login screen
  if (!user && !authLoading) {
    return (
      <Flex
        w="100%"
        h="100dvh"
        direction="column"
        justify="center"
        align="center"
        bg="transparent"
        color="black"
        textAlign="center"
        opacity={fadeOut ? 0 : 1}
        transition="opacity 0.6s ease"
      >
        <Img
          src={Bg.src}
          alt="background"
          position="absolute"
          top="46%"
          left="50%"
          transform="translate(-50%, -50%) scale(0.75)"
          w="260px"
          opacity={0.3}
          zIndex="0"
          pointerEvents="none"
        />
        <Box zIndex="2" textAlign="center">
          <Text fontSize="3xl" fontWeight="700" color="black" mb="3">
            Welcome to <Text as="span" color="gray.800">Fermat</Text>
          </Text>
          <Text fontSize="md" color="gray.600" mb="8" fontWeight="500">
            Your personal AI travel assistant ✈️
          </Text>
          <Box
            bg="white"
            borderRadius="lg"
            p="2"
            _hover={{ transform: 'scale(1.05)' }}
            transition="all 0.3s ease"
            display="inline-block"
          >
            <Button
              onClick={handleGoogleSignIn}
              colorScheme="gray"
              variant="outline"
              size="lg"
              leftIcon={<Icon as={MdPerson} />}
            >
              Sign in with Google
            </Button>
          </Box>
        </Box>
      </Flex>
    );
  }

  // Show loading state while checking auth
  if (authLoading) {
    return (
      <Flex
        w="100%"
        h="100dvh"
        direction="column"
        justify="center"
        align="center"
        bg="transparent"
        color="black"
        textAlign="center"
      >
        <Text fontSize="lg" fontWeight="500">
          Loading...
        </Text>
      </Flex>
    );
  }

  // ✅ Logged in — main UI
  const firstName = user?.displayName?.split?.(' ')?.[0] ?? 'Traveler';
  const avatar = user?.photoURL ?? '';

  return (
    <Flex
      w="100%"
      minH="100vh"
      direction="column"
      align="center"
      justify={outputCode || loading || fullAnswer ? 'flex-start' : 'center'}
      position="relative"
      bg="white"
      opacity={fadeOut ? 0 : 1}
      transition="opacity 0.8s ease"
    >
      {/* Header */}
      {/* <Flex justify="center" align="center" mt="20px" mb="30px" gap="12px">
        {avatar && (
          <Img src={avatar} alt="user" borderRadius="full" w="36px" h="36px" />
        )}
        <Text fontWeight="600" color="black" fontSize="lg">
          Hi, {firstName} 👋
        </Text>
        <Button
          size="sm"
          variant="outline"
          colorScheme="red"
          borderRadius="full"
          onClick={handleSignOut}
        >
          Logout
        </Button>
      </Flex> */}

      {/* ✈️ Background Plane */}
      {!outputCode && !loading && !fullAnswer && (
        <Img
          src={Bg.src}
          position="absolute"
          w={{ base: '260px', md: '340px' }}
          left="50%"
          top="48%"
          transform="translate(-50%, -50%)"
          opacity="0.9"
          zIndex={0}
          pointerEvents="none"
        />
      )}

      {/* Model Selector */}
      {/* <Flex direction="column" align="center" zIndex={1} mb={outputCode ? '10px' : '40px'}>
        <Flex w="max-content" borderRadius="60px" boxShadow="sm" gap="20px">
          {[
            { label: 'GPT-4o', value: 'gpt-4o', icon: MdAutoAwesome },
            { label: 'GPT-3.5', value: 'gpt-3.5-turbo', icon: MdBolt },
            { label: 'Reddit RAG', value: 'reddit-rag', icon: MdAutoAwesome },
          ].map((m) => (
            <Flex
              key={m.value}
              cursor="pointer"
              justify="center"
              align="center"
              bg={model === m.value ? buttonBg : 'transparent'}
              w={{ base: '130px', md: '160px' }}
              h="60px"
              boxShadow={model === m.value ? buttonShadow : 'none'}
              borderRadius="14px"
              color={textColor}
              fontSize="17px"
              fontWeight="700"
              onClick={() => setModel(m.value as OpenAIModel)}
              transition="all 0.2s ease"
            >
              <Flex
                borderRadius="full"
                justify="center"
                align="center"
                bg={bgIcon}
                me="8px"
                h="36px"
                w="36px"
              >
                <Icon as={m.icon} width="18px" height="18px" color={iconColor} />
              </Flex>
              {m.label}
            </Flex>
          ))}
        </Flex>
      </Flex> */}

      {/* Output */}
      {(outputCode || loading || fullAnswer) && (
        <Flex
          direction="column"
          w="100%"
          maxW="880px"
          bg="whiteAlpha.70"
          border="1px solid"
          borderColor={borderColor}
          borderRadius="18px"
          p="24px"
          mt="20px"
          boxShadow="sm"
          zIndex={1}
        >
          {showTypewriter ? (
            <TypewriterText
              text={fullAnswer}
              speed={5}
              showCursor={true}
              onComplete={() => {
                setIsTyping(false);
                setOutputCode(fullAnswer); // Set the final output when complete
                console.log('Typewriter animation completed');
              }}
            />
          ) : outputCode && !loading ? (
            <Text color={textColor} whiteSpace="pre-wrap" fontSize="md" fontWeight="500">
              {outputCode}
            </Text>
          ) : (
            <>
              {loading && <ThinkingAnimation />}
            </>
          )}
        </Flex>
      )}

      {/* Input */}
      <Flex
        mt={outputCode || loading || fullAnswer ? '40px' : '60px'}
        w="100%"
        maxW="880px"
        justify="center"
        align="center"
        zIndex={1}
        gap="10px"
      >
        <Input
          minH="54px"
          flex="1"
          border="1px solid"
          borderColor="gray.300"
          borderRadius="45px"
          p="15px 20px"
          fontSize="sm"
          fontWeight="500"
          bg="white"
          color="gray.800"
          placeholder="Ask Fermat to do something for you..."
          onChange={handleChange}
          onKeyDown={handleKeyPress}
          _focus={{ borderColor: 'gray.700', boxShadow: '0 0 0 1px gray.700' }}
          _hover={{ borderColor: 'gray.500' }}
        />
        <Button
          py="20px"
          px="16px"
          fontSize="sm"
          fontWeight="600"
          borderRadius="45px"
          w={{ base: '120px', md: '160px' }}
          h="54px"
          bgGradient={
            isTyping 
              ? "linear(to-r, red.600, red.500)" 
              : "linear(to-r, gray.800, gray.700)"
          }
          color="white"
          transition="all 0.3s ease"
          boxShadow="0 4px 12px rgba(0, 0, 0, 0.25)"
          _hover={{
            bgGradient: isTyping 
              ? "linear(to-r, red.700, red.600)" 
              : "linear(to-r, gray.900, gray.700)",
            transform: 'translateY(-3px) scale(1.03)',
          }}
          _active={{ transform: 'scale(0.97)' }}
          onClick={isTyping ? handleStopTyping : handleTranslate}
          isLoading={loading}
          isDisabled={loading}
        >
          {isTyping ? 'Stop' : "Let's Go!"}
        </Button>
      </Flex>

      {/* Footer */}
      <Text mt="30px" fontSize="xs" textAlign="center" color={gray} zIndex={1}>
        Fermat — helping you simplify your travel anywhere, anytime :)
      </Text>
    </Flex>
  );
}
