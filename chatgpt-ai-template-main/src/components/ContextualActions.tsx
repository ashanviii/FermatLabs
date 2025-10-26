import React from 'react';
import { 
  Box, 
  Button, 
  Flex, 
  Icon, 
  Text, 
  useColorModeValue,
  Wrap,
  WrapItem
} from '@chakra-ui/react';
import { 
  MdBookmark, 
  MdDirections, 
  MdHotel, 
  MdFlight,
  MdRestaurant,
  MdShare,
  MdEdit,
  MdRefresh,
  MdAssignment,
  MdDateRange,
  MdLocationOn,
  MdAccountBalance,
  MdCreditCard,
  MdFileDownload
} from 'react-icons/md';

interface ContextualActionsProps {
  content: string;
  onActionClick?: (action: string, content: string) => void;
}

interface Action {
  id: string;
  label: string;
  icon: any;
  color: string;
  keywords: string[];
}

const actionDefinitions: Action[] = [
  {
    id: 'apply-visa',
    label: 'Apply for Visa',
    icon: MdAssignment,
    color: 'blue',
    keywords: ['visa', 'application', 'apply', 'embassy', 'consulate', 'permit', 'entry']
  },
  {
    id: 'check-requirements',
    label: 'Check Requirements',
    icon: MdFileDownload,
    color: 'purple',
    keywords: ['requirement', 'document', 'needed', 'checklist', 'need', 'submit']
  },
  {
    id: 'book-flights',
    label: 'Book Flights',
    icon: MdFlight,
    color: 'teal',
    keywords: ['flight', 'airline', 'ticket', 'booking', 'travel', 'fly']
  },
  {
    id: 'find-hotels',
    label: 'Book Hotels',
    icon: MdHotel,
    color: 'green',
    keywords: ['hotel', 'accommodation', 'stay', 'lodge', 'resort', 'booking', 'room']
  },
  {
    id: 'embassy-info',
    label: 'Embassy Info',
    icon: MdAccountBalance,
    color: 'red',
    keywords: ['embassy', 'consulate', 'office', 'contact', 'address', 'location']
  },
  {
    id: 'schedule-appointment',
    label: 'Book Appointment',
    icon: MdDateRange,
    color: 'orange',
    keywords: ['appointment', 'schedule', 'interview', 'meeting', 'date', 'time']
  },
  {
    id: 'travel-insurance',
    label: 'Get Insurance',
    icon: MdCreditCard,
    color: 'cyan',
    keywords: ['insurance', 'coverage', 'protection', 'medical', 'travel insurance']
  },
  {
    id: 'find-location',
    label: 'Get Directions',
    icon: MdLocationOn,
    color: 'pink',
    keywords: ['direction', 'route', 'navigate', 'location', 'address', 'map', 'where']
  },
  {
    id: 'save-info',
    label: 'Save Info',
    icon: MdBookmark,
    color: 'purple',
    keywords: ['save', 'bookmark', 'remember', 'important']
  },
  {
    id: 'share',
    label: 'Share',
    icon: MdShare,
    color: 'gray',
    keywords: ['share', 'send', 'tell']
  },
  {
    id: 'modify',
    label: 'Modify Query',
    icon: MdEdit,
    color: 'yellow',
    keywords: ['change', 'modify', 'edit', 'update', 'adjust']
  },
  {
    id: 'ask-again',
    label: 'Ask Again',
    icon: MdRefresh,
    color: 'gray',
    keywords: ['regenerate', 'retry', 'again', 'different']
  }
];

export default function ContextualActions({ content, onActionClick }: ContextualActionsProps) {
  const borderColor = useColorModeValue('gray.200', 'whiteAlpha.200');
  const bgColor = useColorModeValue('gray.50', 'gray.800');
  
  // Analyze content to determine relevant actions
  const getRelevantActions = (text: string): Action[] => {
    const lowerText = text.toLowerCase();
    const relevantActions: Action[] = [];
    
    actionDefinitions.forEach(action => {
      const isRelevant = action.keywords.some(keyword => 
        lowerText.includes(keyword)
      );
      
      if (isRelevant) {
        relevantActions.push(action);
      }
    });
    
    // Always include these default actions for visa/travel
    const defaultActions = ['save-info', 'share', 'ask-again'];
    defaultActions.forEach(actionId => {
      const action = actionDefinitions.find(a => a.id === actionId);
      if (action && !relevantActions.find(a => a.id === actionId)) {
        relevantActions.push(action);
      }
    });
    
    return relevantActions.slice(0, 8); // Allow more actions for visa context
  };

  const relevantActions = getRelevantActions(content);

  if (relevantActions.length === 0) return null;

  const handleActionClick = (actionId: string) => {
    onActionClick?.(actionId, content);
  };

  return (
    <Box
      mt={6}
      pt={4}
      borderTop="1px solid"
      borderColor={borderColor}
    >
      <Text fontSize="sm" fontWeight="600" color="gray.600" mb={3}>
        Visa & Travel Actions
      </Text>
      <Wrap spacing={2}>
        {relevantActions.map((action) => (
          <WrapItem key={action.id}>
            <Button
              size="sm"
              variant="outline"
              colorScheme={action.color}
              leftIcon={<Icon as={action.icon} />}
              onClick={() => handleActionClick(action.id)}
              borderRadius="full"
              fontSize="xs"
              fontWeight="500"
              _hover={{
                transform: 'translateY(-2px)',
                shadow: 'md'
              }}
              transition="all 0.2s ease"
            >
              {action.label}
            </Button>
          </WrapItem>
        ))}
      </Wrap>
    </Box>
  );
}