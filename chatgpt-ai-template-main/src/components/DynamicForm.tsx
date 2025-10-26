import React, { useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Input,
  Select,
  Checkbox,
  Button,
  FormControl,
  FormLabel,
  Textarea,
  useColorModeValue,
  Alert,
  AlertIcon,
  Progress,
  Badge
} from '@chakra-ui/react';
import { useJourney } from '../contexts/JourneyContext';

interface FormField {
  id: string;
  label: string;
  type: 'text' | 'select' | 'checkbox' | 'textarea' | 'date' | 'file';
  required?: boolean;
  options?: string[];
  placeholder?: string;
  validation?: (value: string) => string | null;
}

interface DynamicFormProps {
  title: string;
  description: string;
  fields: FormField[];
  onSubmit: (data: Record<string, any>) => void;
  onCancel?: () => void;
  submitLabel?: string;
  journeyStepId?: string;
}

export default function DynamicForm({
  title,
  description,
  fields,
  onSubmit,
  onCancel,
  submitLabel = 'Submit',
  journeyStepId
}: DynamicFormProps) {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { updateJourneyStep } = useJourney();

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  const handleFieldChange = (fieldId: string, value: any) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }));
    
    // Clear error when user starts typing
    if (errors[fieldId]) {
      setErrors(prev => ({ ...prev, [fieldId]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    fields.forEach(field => {
      const value = formData[field.id];
      
      if (field.required && (!value || value.toString().trim() === '')) {
        newErrors[field.id] = `${field.label} is required`;
      } else if (field.validation && value) {
        const validationError = field.validation(value);
        if (validationError) {
          newErrors[field.id] = validationError;
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    
    try {
      await onSubmit(formData);
      
      if (journeyStepId) {
        updateJourneyStep(journeyStepId, 'completed', formData);
      }
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderField = (field: FormField) => {
    const value = formData[field.id] || '';
    const hasError = !!errors[field.id];

    switch (field.type) {
      case 'text':
      case 'date':
        return (
          <Input
            type={field.type}
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            isInvalid={hasError}
            bg={bgColor}
          />
        );

      case 'select':
        return (
          <Select
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            placeholder={field.placeholder || "Select an option"}
            isInvalid={hasError}
            bg={bgColor}
          >
            {field.options?.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </Select>
        );

      case 'checkbox':
        return (
          <Checkbox
            isChecked={value}
            onChange={(e) => handleFieldChange(field.id, e.target.checked)}
          >
            {field.label}
          </Checkbox>
        );

      case 'textarea':
        return (
          <Textarea
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            isInvalid={hasError}
            bg={bgColor}
            rows={4}
          />
        );

      case 'file':
        return (
          <Input
            type="file"
            onChange={(e) => handleFieldChange(field.id, e.target.files?.[0])}
            accept=".pdf,.doc,.docx,.jpg,.png"
            bg={bgColor}
          />
        );

      default:
        return null;
    }
  };

  const completedFields = fields.filter(field => formData[field.id] && formData[field.id] !== '').length;
  const progressPercentage = (completedFields / fields.length) * 100;

  return (
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
        {/* Header */}
        <Box>
          <HStack justify="space-between" mb={2}>
            <Text fontSize="xl" fontWeight="bold">
              {title}
            </Text>
            <Badge colorScheme="blue" variant="subtle">
              {completedFields}/{fields.length} completed
            </Badge>
          </HStack>
          <Text color="gray.600" fontSize="sm" mb={4}>
            {description}
          </Text>
          <Progress value={progressPercentage} colorScheme="blue" size="sm" />
        </Box>

        {/* Form Fields */}
        <VStack spacing={4} align="stretch">
          {fields.map(field => (
            <FormControl key={field.id} isRequired={field.required} isInvalid={!!errors[field.id]}>
              {field.type !== 'checkbox' && (
                <FormLabel fontSize="sm" fontWeight="medium">
                  {field.label}
                </FormLabel>
              )}
              {renderField(field)}
              {errors[field.id] && (
                <Text color="red.500" fontSize="xs" mt={1}>
                  {errors[field.id]}
                </Text>
              )}
            </FormControl>
          ))}
        </VStack>

        {/* Actions */}
        <HStack spacing={3} justify="flex-end">
          {onCancel && (
            <Button variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button
            colorScheme="blue"
            onClick={handleSubmit}
            isLoading={isSubmitting}
            loadingText="Submitting..."
          >
            {submitLabel}
          </Button>
        </HStack>
      </VStack>
    </Box>
  );
}

// Predefined form configurations
export const visaApplicationForm: FormField[] = [
  { id: 'fullName', label: 'Full Name', type: 'text', required: true, placeholder: 'As it appears on passport' },
  { id: 'nationality', label: 'Nationality', type: 'text', required: true },
  { id: 'passportNumber', label: 'Passport Number', type: 'text', required: true },
  { id: 'dateOfBirth', label: 'Date of Birth', type: 'date', required: true },
  { id: 'purpose', label: 'Purpose of Visit', type: 'select', required: true, options: ['Tourism', 'Business', 'Education', 'Medical', 'Transit', 'Other'] },
  { id: 'duration', label: 'Duration of Stay', type: 'text', required: true, placeholder: 'e.g., 2 weeks' },
  { id: 'accommodation', label: 'Accommodation Details', type: 'textarea', placeholder: 'Hotel name or address where you will stay' }
];

export const documentChecklistForm: FormField[] = [
  { id: 'passport', label: 'Valid Passport (6+ months validity)', type: 'checkbox' },
  { id: 'photos', label: 'Passport-sized Photos', type: 'checkbox' },
  { id: 'application', label: 'Completed Application Form', type: 'checkbox' },
  { id: 'financial', label: 'Financial Documents (Bank statements, etc.)', type: 'checkbox' },
  { id: 'employment', label: 'Employment Letter/Proof of Income', type: 'checkbox' },
  { id: 'itinerary', label: 'Travel Itinerary', type: 'checkbox' },
  { id: 'accommodation', label: 'Hotel Reservations', type: 'checkbox' },
  { id: 'insurance', label: 'Travel Insurance', type: 'checkbox' }
];

export const travelBookingForm: FormField[] = [
  { id: 'destination', label: 'Destination', type: 'text', required: true },
  { id: 'departureCity', label: 'Departure City', type: 'text', required: true },
  { id: 'departureDate', label: 'Departure Date', type: 'date', required: true },
  { id: 'returnDate', label: 'Return Date', type: 'date' },
  { id: 'passengers', label: 'Number of Passengers', type: 'select', required: true, options: ['1', '2', '3', '4', '5+'] },
  { id: 'class', label: 'Travel Class', type: 'select', options: ['Economy', 'Business', 'First Class'] },
  { id: 'hotelBudget', label: 'Hotel Budget (per night)', type: 'select', options: ['Under $100', '$100-200', '$200-300', '$300+']}
];