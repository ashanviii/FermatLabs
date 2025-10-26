import React, { useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Progress,
  Badge,
  Icon,
  Collapse,
  useColorModeValue,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Alert,
  AlertIcon,
  Wrap,
  WrapItem,
  Divider
} from '@chakra-ui/react';
import {
  MdCheckCircle,
  MdRadioButtonUnchecked,
  MdPlayArrow,
  MdPause,
  MdFlightTakeoff,
  MdAssignment,
  MdAccountBalance,
  MdDateRange,
  MdLocationOn
} from 'react-icons/md';
import { useJourney, JourneyStep } from '../contexts/JourneyContext';
import DynamicForm, { visaApplicationForm, documentChecklistForm, travelBookingForm } from './DynamicForm';
import SmartFollowUp from './SmartFollowUp';

interface JourneyDashboardProps {
  isVisible: boolean;
  onClose?: () => void;
}

export default function JourneyDashboard({ isVisible, onClose }: JourneyDashboardProps) {
  const [activeForm, setActiveForm] = useState<string | null>(null);
  const [showFollowUp, setShowFollowUp] = useState(false);
  const [followUpContext, setFollowUpContext] = useState('');

  const {
    currentJourney,
    updateJourneyStep,
    getNextSteps,
    getRecommendations,
    startJourney
  } = useJourney();

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const successColor = useColorModeValue('green.500', 'green.300');
  const warningColor = useColorModeValue('orange.500', 'orange.300');

  const getStepIcon = (step: JourneyStep) => {
    const iconMap: Record<JourneyStep['type'], any> = {
      'visa-application': MdAssignment,
      'document-collection': MdAssignment,
      'appointment': MdDateRange,
      'travel-booking': MdFlightTakeoff,
      'insurance': MdAccountBalance,
      'custom': MdLocationOn
    };
    return iconMap[step.type] || MdLocationOn;
  };

  const getStatusColor = (status: JourneyStep['status']) => {
    const colorMap: Record<JourneyStep['status'], string> = {
      'completed': 'green',
      'in-progress': 'blue',
      'pending': 'gray',
      'skipped': 'orange'
    };
    return colorMap[status];
  };

  const handleStepAction = (step: JourneyStep) => {
    if (step.type === 'visa-application') {
      setActiveForm('visa-application');
    } else if (step.type === 'document-collection') {
      setActiveForm('document-checklist');
    } else if (step.type === 'travel-booking') {
      setActiveForm('travel-booking');
    } else {
      // Mark as in progress or start follow-up
      updateJourneyStep(step.id, 'in-progress');
      setFollowUpContext(step.description);
      setShowFollowUp(true);
    }
  };

  const handleFormSubmit = (formType: string, data: Record<string, any>) => {
    console.log('Form submitted:', formType, data);
    setActiveForm(null);
    
    // You can integrate with your backend here
    alert(`${formType} submitted successfully!`);
  };

  const nextSteps = getNextSteps();
  const recommendations = getRecommendations();

  if (!currentJourney && !isVisible) return null;

  return (
    <Collapse in={isVisible} animateOpacity>
      <Box
        bg={bgColor}
        border="1px solid"
        borderColor={borderColor}
        borderRadius="xl"
        p={6}
        mt={4}
        boxShadow="lg"
        maxW="900px"
        w="100%"
      >
        <VStack spacing={6} align="stretch">
          {/* Journey Header */}
          {currentJourney && (
            <Box>
              <HStack justify="space-between" mb={4}>
                <VStack align="start" spacing={1}>
                  <Text fontSize="xl" fontWeight="bold">
                    {currentJourney.type.replace('-', ' ').toUpperCase()} Journey
                  </Text>
                  {currentJourney.country && (
                    <Text color="gray.600" fontSize="sm">
                      Destination: {currentJourney.country}
                    </Text>
                  )}
                </VStack>
                <Badge colorScheme="blue" fontSize="md" px={3} py={1}>
                  {currentJourney.progress}% Complete
                </Badge>
              </HStack>
              
              <Progress 
                value={currentJourney.progress} 
                colorScheme="blue" 
                size="lg" 
                borderRadius="md"
              />
            </Box>
          )}

          {/* Quick Start for new users */}
          {!currentJourney && (
            <Alert status="info" borderRadius="md">
              <AlertIcon />
              <VStack align="start" spacing={2}>
                <Text fontWeight="medium">Start your journey!</Text>
                <Text fontSize="sm">
                  Let me help you with your visa application or travel planning.
                </Text>
                <Wrap spacing={2} mt={2}>
                  <WrapItem>
                    <Button 
                      size="sm" 
                      colorScheme="blue"
                      onClick={() => startJourney('tourist-visa')}
                    >
                      Tourist Visa
                    </Button>
                  </WrapItem>
                  <WrapItem>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => startJourney('business-visa')}
                    >
                      Business Visa
                    </Button>
                  </WrapItem>
                  <WrapItem>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => startJourney('travel-planning')}
                    >
                      Travel Planning
                    </Button>
                  </WrapItem>
                </Wrap>
              </VStack>
            </Alert>
          )}

          {/* Recommendations */}
          {recommendations.length > 0 && (
            <Alert status="success" borderRadius="md">
              <AlertIcon />
              <VStack align="start" spacing={1}>
                <Text fontWeight="medium">Smart Recommendations:</Text>
                {recommendations.map((rec, index) => (
                  <Text key={index} fontSize="sm">• {rec}</Text>
                ))}
              </VStack>
            </Alert>
          )}

          {/* Next Steps */}
          {nextSteps.length > 0 && (
            <Box>
              <Text fontSize="lg" fontWeight="bold" mb={3}>
                Your Next Steps
              </Text>
              <VStack spacing={3}>
                {nextSteps.map((step) => (
                  <Box
                    key={step.id}
                    p={4}
                    border="1px solid"
                    borderColor={borderColor}
                    borderRadius="md"
                    w="100%"
                    bg={step.status === 'in-progress' ? 'blue.50' : 'transparent'}
                  >
                    <HStack justify="space-between">
                      <HStack>
                        <Icon 
                          as={getStepIcon(step)} 
                          color={`${getStatusColor(step.status)}.500`}
                          boxSize={5}
                        />
                        <VStack align="start" spacing={1}>
                          <Text fontWeight="medium">{step.title}</Text>
                          <Text fontSize="sm" color="gray.600">
                            {step.description}
                          </Text>
                        </VStack>
                      </HStack>
                      <Button
                        size="sm"
                        colorScheme={getStatusColor(step.status)}
                        variant={step.status === 'completed' ? 'solid' : 'outline'}
                        onClick={() => handleStepAction(step)}
                        leftIcon={
                          step.status === 'completed' ? <MdCheckCircle /> : 
                          step.status === 'in-progress' ? <MdPause /> : <MdPlayArrow />
                        }
                      >
                        {step.status === 'completed' ? 'Completed' : 
                         step.status === 'in-progress' ? 'Continue' : 'Start'}
                      </Button>
                    </HStack>
                  </Box>
                ))}
              </VStack>
            </Box>
          )}

          {/* Full Journey Overview */}
          {currentJourney && (
            <Accordion allowToggle>
              <AccordionItem>
                <AccordionButton>
                  <Box flex="1" textAlign="left">
                    <Text fontWeight="medium">View Full Journey ({currentJourney.steps.length} steps)</Text>
                  </Box>
                  <AccordionIcon />
                </AccordionButton>
                <AccordionPanel pb={4}>
                  <VStack spacing={2}>
                    {currentJourney.steps.map((step, index) => (
                      <HStack key={step.id} w="100%" p={2} borderRadius="md">
                        <Icon
                          as={step.status === 'completed' ? MdCheckCircle : MdRadioButtonUnchecked}
                          color={step.status === 'completed' ? successColor : 'gray.400'}
                        />
                        <Text 
                          flex="1" 
                          fontSize="sm"
                          textDecoration={step.status === 'completed' ? 'line-through' : 'none'}
                          color={step.status === 'completed' ? 'gray.500' : 'inherit'}
                        >
                          {step.title}
                        </Text>
                        <Badge size="sm" colorScheme={getStatusColor(step.status)}>
                          {step.status}
                        </Badge>
                      </HStack>
                    ))}
                  </VStack>
                </AccordionPanel>
              </AccordionItem>
            </Accordion>
          )}
        </VStack>

        {/* Active Forms */}
        {activeForm === 'visa-application' && (
          <Box mt={6}>
            <Divider mb={6} />
            <DynamicForm
              title="Visa Application Information"
              description="Please fill out the basic information for your visa application"
              fields={visaApplicationForm}
              onSubmit={(data) => handleFormSubmit('visa-application', data)}
              onCancel={() => setActiveForm(null)}
              submitLabel="Save Application Info"
            />
          </Box>
        )}

        {activeForm === 'document-checklist' && (
          <Box mt={6}>
            <Divider mb={6} />
            <DynamicForm
              title="Document Checklist"
              description="Check off the documents you have prepared"
              fields={documentChecklistForm}
              onSubmit={(data) => handleFormSubmit('document-checklist', data)}
              onCancel={() => setActiveForm(null)}
              submitLabel="Update Checklist"
            />
          </Box>
        )}

        {activeForm === 'travel-booking' && (
          <Box mt={6}>
            <Divider mb={6} />
            <DynamicForm
              title="Travel Booking Information"
              description="Provide your travel preferences for booking assistance"
              fields={travelBookingForm}
              onSubmit={(data) => handleFormSubmit('travel-booking', data)}
              onCancel={() => setActiveForm(null)}
              submitLabel="Save Preferences"
            />
          </Box>
        )}

        {/* Smart Follow-up */}
        {showFollowUp && (
          <Box mt={6}>
            <Divider mb={6} />
            <SmartFollowUp
              initialContext={followUpContext}
              onAllComplete={() => setShowFollowUp(false)}
            />
          </Box>
        )}

        {/* Close Button */}
        {onClose && (
          <Box textAlign="center" mt={4}>
            <Button variant="ghost" onClick={onClose}>
              Close Dashboard
            </Button>
          </Box>
        )}
      </Box>
    </Collapse>
  );
}