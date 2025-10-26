import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  useColorModeValue,
  Fade,
  ScaleFade,
  Icon,
  Wrap,
  WrapItem
} from '@chakra-ui/react';
import { MdQuestionAnswer, MdArrowForward, MdCheckCircle } from 'react-icons/md';
import { useJourney } from '../contexts/JourneyContext';

interface FollowUpQuestion {
  id: string;
  question: string;
  context: string;
  options: string[];
  type: 'single' | 'multiple';
  followUp?: (answer: string[]) => FollowUpQuestion | null;
  action?: (answer: string[]) => void;
}

interface SmartFollowUpProps {
  initialContext: string;
  onQuestionComplete?: (question: FollowUpQuestion, answers: string[]) => void;
  onAllComplete?: (allAnswers: Record<string, string[]>) => void;
}

export default function SmartFollowUp({ 
  initialContext, 
  onQuestionComplete,
  onAllComplete 
}: SmartFollowUpProps) {
  const [currentQuestion, setCurrentQuestion] = useState<FollowUpQuestion | null>(null);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const { currentJourney, addJourneyStep } = useJourney();

  const bgColor = useColorModeValue('blue.50', 'blue.900');
  const borderColor = useColorModeValue('blue.200', 'blue.600');

  const generateInitialQuestion = (context: string): FollowUpQuestion => {
    const lowerContext = context.toLowerCase();

    // Visa-related questions
    if (lowerContext.includes('visa')) {
      return {
        id: 'visa-type',
        question: 'What type of visa do you need?',
        context: 'visa-application',
        type: 'single',
        options: ['Tourist/Visitor Visa', 'Business Visa', 'Student Visa', 'Work Visa', 'Transit Visa', 'Not sure'],
        followUp: (answer) => {
          if (answer[0] === 'Not sure') {
            return {
              id: 'purpose',
              question: 'What is the main purpose of your trip?',
              context: 'travel-purpose',
              type: 'single',
              options: ['Vacation/Tourism', 'Business Meeting', 'Study/Education', 'Work/Employment', 'Medical Treatment', 'Visit Family/Friends']
            };
          }
          return {
            id: 'country',
            question: 'Which country do you want to visit?',
            context: 'destination',
            type: 'single',
            options: ['United States', 'Canada', 'United Kingdom', 'Germany', 'Australia', 'Japan', 'Other']
          };
        }
      };
    }

    // Travel booking questions
    if (lowerContext.includes('flight') || lowerContext.includes('book') || lowerContext.includes('travel')) {
      return {
        id: 'travel-type',
        question: 'What type of travel are you planning?',
        context: 'travel-booking',
        type: 'single',
        options: ['Round Trip', 'One Way', 'Multi-city', 'Open-jaw'],
        followUp: () => ({
          id: 'travel-dates',
          question: 'When do you want to travel?',
          context: 'travel-timing',
          type: 'single',
          options: ['This week', 'This month', 'Next month', 'In 2-3 months', 'More than 3 months', 'Flexible dates']
        })
      };
    }

    // Hotel/accommodation questions
    if (lowerContext.includes('hotel') || lowerContext.includes('accommodation')) {
      return {
        id: 'accommodation-type',
        question: 'What type of accommodation do you prefer?',
        context: 'accommodation',
        type: 'single',
        options: ['Hotel', 'Apartment/Vacation Rental', 'Hostel', 'Resort', 'Bed & Breakfast', 'No preference'],
        followUp: () => ({
          id: 'budget-range',
          question: 'What is your budget range per night?',
          context: 'budget',
          type: 'single',
          options: ['Under $50', '$50-100', '$100-200', '$200-300', '$300+', 'No budget limit']
        })
      };
    }

    // Document questions
    if (lowerContext.includes('document') || lowerContext.includes('requirement')) {
      return {
        id: 'document-status',
        question: 'Which documents do you already have?',
        context: 'documents',
        type: 'multiple',
        options: ['Valid Passport', 'Birth Certificate', 'Bank Statements', 'Employment Letter', 'Travel Insurance', 'Hotel Reservations', 'Flight Tickets']
      };
    }

    // Default general question
    return {
      id: 'general-help',
      question: 'How can I help you with your travel needs?',
      context: 'general',
      type: 'single',
      options: ['Visa Application', 'Flight Booking', 'Hotel Booking', 'Travel Requirements', 'Document Preparation', 'General Travel Advice']
    };
  };

  useEffect(() => {
    if (initialContext && !currentQuestion) {
      const question = generateInitialQuestion(initialContext);
      setCurrentQuestion(question);
    }
  }, [initialContext, currentQuestion]);

  const handleAnswerSelect = (answer: string) => {
    if (currentQuestion?.type === 'single') {
      setSelectedAnswers([answer]);
    } else {
      setSelectedAnswers(prev => 
        prev.includes(answer) 
          ? prev.filter(a => a !== answer)
          : [...prev, answer]
      );
    }
  };

  const handleNext = () => {
    if (!currentQuestion || selectedAnswers.length === 0) return;

    // Store current answer
    const newAnswers = { ...answers, [currentQuestion.id]: selectedAnswers };
    setAnswers(newAnswers);

    // Call callback
    onQuestionComplete?.(currentQuestion, selectedAnswers);

    // Add to journey if applicable
    if (currentJourney) {
      addJourneyStep({
        title: `Answered: ${currentQuestion.question}`,
        description: `Selected: ${selectedAnswers.join(', ')}`,
        status: 'completed',
        type: 'custom',
        data: { question: currentQuestion.question, answers: selectedAnswers }
      });
    }

    // Get next question
    const nextQuestion = currentQuestion.followUp?.(selectedAnswers);
    
    if (nextQuestion) {
      setCurrentQuestion(nextQuestion);
      setSelectedAnswers([]);
    } else {
      setIsComplete(true);
      onAllComplete?.(newAnswers);
    }

    // Execute any actions
    currentQuestion.action?.(selectedAnswers);
  };

  if (isComplete) {
    return (
      <ScaleFade initialScale={0.9} in={isComplete}>
        <Box
          bg={bgColor}
          border="1px solid"
          borderColor={borderColor}
          borderRadius="lg"
          p={6}
          textAlign="center"
        >
          <Icon as={MdCheckCircle} boxSize={12} color="green.500" mb={4} />
          <Text fontSize="lg" fontWeight="bold" mb={2}>
            Great! I have all the information I need.
          </Text>
          <Text color="gray.600">
            I'll provide personalized recommendations based on your answers.
          </Text>
        </Box>
      </ScaleFade>
    );
  }

  if (!currentQuestion) return null;

  return (
    <Fade in={!!currentQuestion}>
      <Box
        bg={bgColor}
        border="1px solid"
        borderColor={borderColor}
        borderRadius="lg"
        p={6}
        maxW="600px"
        w="100%"
      >
        <VStack spacing={6} align="stretch">
          {/* Question Header */}
          <HStack>
            <Icon as={MdQuestionAnswer} color="blue.500" boxSize={6} />
            <Text fontSize="lg" fontWeight="bold">
              {currentQuestion.question}
            </Text>
          </HStack>

          {/* Answer Options */}
          <Wrap spacing={3}>
            {currentQuestion.options.map((option) => (
              <WrapItem key={option}>
                <Button
                  variant={selectedAnswers.includes(option) ? 'solid' : 'outline'}
                  colorScheme="blue"
                  size="sm"
                  onClick={() => handleAnswerSelect(option)}
                  borderRadius="full"
                >
                  {option}
                </Button>
              </WrapItem>
            ))}
          </Wrap>

          {/* Selection hint */}
          <Text fontSize="xs" color="gray.500">
            {currentQuestion.type === 'multiple' 
              ? 'You can select multiple options'
              : 'Please select one option'
            }
          </Text>

          {/* Next Button */}
          <HStack justify="flex-end">
            <Button
              rightIcon={<MdArrowForward />}
              colorScheme="blue"
              onClick={handleNext}
              isDisabled={selectedAnswers.length === 0}
            >
              Next
            </Button>
          </HStack>
        </VStack>
      </Box>
    </Fade>
  );
}

// Hook for generating contextual follow-up questions
export const useSmartFollowUp = () => {
  const generateQuestionsFromContent = (content: string): FollowUpQuestion[] => {
    const questions: FollowUpQuestion[] = [];
    const lowerContent = content.toLowerCase();

    if (lowerContent.includes('visa') && lowerContent.includes('requirement')) {
      questions.push({
        id: 'visa-urgency',
        question: 'How soon do you need to travel?',
        context: 'urgency',
        type: 'single',
        options: ['Within 1 month', '1-3 months', '3-6 months', 'More than 6 months', 'No specific date']
      });
    }

    if (lowerContent.includes('document') && lowerContent.includes('need')) {
      questions.push({
        id: 'document-help',
        question: 'What kind of help do you need with documents?',
        context: 'document-assistance',
        type: 'multiple',
        options: ['Document checklist', 'Where to get documents', 'Document format requirements', 'Translation services', 'Document verification']
      });
    }

    if (lowerContent.includes('appointment') || lowerContent.includes('interview')) {
      questions.push({
        id: 'appointment-prep',
        question: 'What do you need help with for your appointment?',
        context: 'appointment-preparation',
        type: 'multiple',
        options: ['Scheduling appointment', 'Interview preparation', 'Required documents', 'What to expect', 'Dress code', 'Common questions']
      });
    }

    return questions;
  };

  return { generateQuestionsFromContent };
};