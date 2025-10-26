import React, { createContext, useContext, useState, useCallback } from 'react';

export interface JourneyStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed' | 'skipped';
  type: 'visa-application' | 'document-collection' | 'appointment' | 'travel-booking' | 'insurance' | 'custom';
  data?: any;
  completedAt?: Date;
}

export interface UserJourney {
  id: string;
  type: 'tourist-visa' | 'business-visa' | 'student-visa' | 'work-visa' | 'travel-planning' | 'general';
  country?: string;
  startedAt: Date;
  lastUpdated: Date;
  progress: number; // 0-100
  currentStep?: string;
  steps: JourneyStep[];
  userData: {
    nationality?: string;
    purpose?: string;
    duration?: string;
    documents?: string[];
    preferences?: any;
  };
}

interface JourneyContextType {
  currentJourney: UserJourney | null;
  allJourneys: UserJourney[];
  startJourney: (type: UserJourney['type'], country?: string, purpose?: string) => void;
  updateJourneyStep: (stepId: string, status: JourneyStep['status'], data?: any) => void;
  addJourneyStep: (step: Omit<JourneyStep, 'id'>) => void;
  completeJourney: () => void;
  switchJourney: (journeyId: string) => void;
  getNextSteps: () => JourneyStep[];
  getRecommendations: () => string[];
}

const JourneyContext = createContext<JourneyContextType | undefined>(undefined);

export const useJourney = () => {
  const context = useContext(JourneyContext);
  if (!context) {
    throw new Error('useJourney must be used within a JourneyProvider');
  }
  return context;
};

export const JourneyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentJourney, setCurrentJourney] = useState<UserJourney | null>(null);
  const [allJourneys, setAllJourneys] = useState<UserJourney[]>([]);

  const generateJourneySteps = useCallback((type: UserJourney['type'], country?: string): JourneyStep[] => {
    const baseSteps: Record<UserJourney['type'], Omit<JourneyStep, 'id'>[]> = {
      'tourist-visa': [
        { title: 'Check Visa Requirements', description: `Verify if you need a visa for ${country}`, status: 'pending', type: 'visa-application' },
        { title: 'Gather Required Documents', description: 'Collect passport, photos, financial documents', status: 'pending', type: 'document-collection' },
        { title: 'Complete Application Form', description: 'Fill out official visa application', status: 'pending', type: 'visa-application' },
        { title: 'Schedule Embassy Appointment', description: 'Book visa interview appointment', status: 'pending', type: 'appointment' },
        { title: 'Attend Visa Interview', description: 'Complete visa interview process', status: 'pending', type: 'appointment' },
        { title: 'Book Flight Tickets', description: 'Reserve your travel dates', status: 'pending', type: 'travel-booking' },
        { title: 'Book Accommodation', description: 'Secure hotel or lodging', status: 'pending', type: 'travel-booking' },
        { title: 'Get Travel Insurance', description: 'Purchase comprehensive travel coverage', status: 'pending', type: 'insurance' }
      ],
      'business-visa': [
        { title: 'Obtain Business Invitation', description: 'Get invitation letter from host company', status: 'pending', type: 'document-collection' },
        { title: 'Prepare Business Documents', description: 'Gather company registration, business cards', status: 'pending', type: 'document-collection' },
        { title: 'Complete Visa Application', description: 'Fill business visa application form', status: 'pending', type: 'visa-application' },
        { title: 'Schedule Appointment', description: 'Book business visa interview', status: 'pending', type: 'appointment' },
        { title: 'Book Business Travel', description: 'Arrange flights and accommodation', status: 'pending', type: 'travel-booking' }
      ],
      'student-visa': [
        { title: 'Get Acceptance Letter', description: 'Obtain admission from educational institution', status: 'pending', type: 'document-collection' },
        { title: 'Prepare Financial Documents', description: 'Show proof of funds for studies', status: 'pending', type: 'document-collection' },
        { title: 'Complete Student Visa Form', description: 'Fill student visa application', status: 'pending', type: 'visa-application' },
        { title: 'Schedule Visa Interview', description: 'Book student visa appointment', status: 'pending', type: 'appointment' },
        { title: 'Plan Accommodation', description: 'Arrange housing near institution', status: 'pending', type: 'travel-booking' }
      ],
      'work-visa': [
        { title: 'Secure Job Offer', description: 'Get employment offer letter', status: 'pending', type: 'document-collection' },
        { title: 'Labor Certification', description: 'Employer files labor certification', status: 'pending', type: 'visa-application' },
        { title: 'File Petition', description: 'Submit work visa petition', status: 'pending', type: 'visa-application' },
        { title: 'Complete Application', description: 'Fill consular processing forms', status: 'pending', type: 'visa-application' },
        { title: 'Medical Examination', description: 'Complete required medical check', status: 'pending', type: 'appointment' }
      ],
      'travel-planning': [
        { title: 'Choose Destination', description: 'Select travel destination and dates', status: 'pending', type: 'travel-booking' },
        { title: 'Book Flights', description: 'Reserve flight tickets', status: 'pending', type: 'travel-booking' },
        { title: 'Book Accommodation', description: 'Secure hotels or lodging', status: 'pending', type: 'travel-booking' },
        { title: 'Get Travel Insurance', description: 'Purchase travel protection', status: 'pending', type: 'insurance' },
        { title: 'Plan Activities', description: 'Research and book tours/activities', status: 'pending', type: 'travel-booking' }
      ],
      'general': [
        { title: 'Define Travel Goals', description: 'Clarify your travel objectives', status: 'pending', type: 'custom' },
        { title: 'Research Requirements', description: 'Understand visa and travel needs', status: 'pending', type: 'custom' },
        { title: 'Create Action Plan', description: 'Develop step-by-step plan', status: 'pending', type: 'custom' }
      ]
    };

    return baseSteps[type].map((step, index) => ({
      ...step,
      id: `${type}-step-${index + 1}`
    }));
  }, []);

  const startJourney = useCallback((type: UserJourney['type'], country?: string, purpose?: string) => {
    const newJourney: UserJourney = {
      id: `journey-${Date.now()}`,
      type,
      country,
      startedAt: new Date(),
      lastUpdated: new Date(),
      progress: 0,
      steps: generateJourneySteps(type, country),
      userData: {
        purpose,
        documents: [],
        preferences: {}
      }
    };

    setCurrentJourney(newJourney);
    setAllJourneys(prev => [...prev, newJourney]);
    
    // Save to localStorage
    localStorage.setItem('fermat-current-journey', JSON.stringify(newJourney));
  }, [generateJourneySteps]);

  const updateJourneyStep = useCallback((stepId: string, status: JourneyStep['status'], data?: any) => {
    if (!currentJourney) return;

    const updatedJourney = {
      ...currentJourney,
      lastUpdated: new Date(),
      steps: currentJourney.steps.map(step => 
        step.id === stepId 
          ? { 
              ...step, 
              status, 
              data: { ...step.data, ...data },
              completedAt: status === 'completed' ? new Date() : step.completedAt
            }
          : step
      )
    };

    // Calculate progress
    const completedSteps = updatedJourney.steps.filter(s => s.status === 'completed').length;
    updatedJourney.progress = Math.round((completedSteps / updatedJourney.steps.length) * 100);

    setCurrentJourney(updatedJourney);
    setAllJourneys(prev => prev.map(j => j.id === updatedJourney.id ? updatedJourney : j));
    
    // Save to localStorage
    localStorage.setItem('fermat-current-journey', JSON.stringify(updatedJourney));
  }, [currentJourney]);

  const addJourneyStep = useCallback((step: Omit<JourneyStep, 'id'>) => {
    if (!currentJourney) return;

    const newStep: JourneyStep = {
      ...step,
      id: `custom-step-${Date.now()}`
    };

    const updatedJourney = {
      ...currentJourney,
      lastUpdated: new Date(),
      steps: [...currentJourney.steps, newStep]
    };

    setCurrentJourney(updatedJourney);
    setAllJourneys(prev => prev.map(j => j.id === updatedJourney.id ? updatedJourney : j));
  }, [currentJourney]);

  const getNextSteps = useCallback((): JourneyStep[] => {
    if (!currentJourney) return [];
    
    return currentJourney.steps
      .filter(step => step.status === 'pending' || step.status === 'in-progress')
      .slice(0, 3); // Return next 3 steps
  }, [currentJourney]);

  const getRecommendations = useCallback((): string[] => {
    if (!currentJourney) return [];

    const completedSteps = currentJourney.steps.filter(s => s.status === 'completed');
    const nextSteps = getNextSteps();
    
    const recommendations: string[] = [];

    if (nextSteps.length > 0) {
      recommendations.push(`Next: ${nextSteps[0].title}`);
    }

    if (currentJourney.progress < 50) {
      recommendations.push("Consider starting document collection early");
    }

    if (currentJourney.type.includes('visa') && !completedSteps.find(s => s.type === 'appointment')) {
      recommendations.push("Book visa appointment as soon as possible");
    }

    return recommendations;
  }, [currentJourney, getNextSteps]);

  const completeJourney = useCallback(() => {
    if (!currentJourney) return;
    
    const completedJourney = {
      ...currentJourney,
      progress: 100,
      lastUpdated: new Date()
    };

    setAllJourneys(prev => prev.map(j => j.id === completedJourney.id ? completedJourney : j));
    localStorage.setItem(`fermat-journey-${completedJourney.id}`, JSON.stringify(completedJourney));
  }, [currentJourney]);

  const switchJourney = useCallback((journeyId: string) => {
    const journey = allJourneys.find(j => j.id === journeyId);
    if (journey) {
      setCurrentJourney(journey);
      localStorage.setItem('fermat-current-journey', JSON.stringify(journey));
    }
  }, [allJourneys]);

  return (
    <JourneyContext.Provider value={{
      currentJourney,
      allJourneys,
      startJourney,
      updateJourneyStep,
      addJourneyStep,
      completeJourney,
      switchJourney,
      getNextSteps,
      getRecommendations
    }}>
      {children}
    </JourneyContext.Provider>
  );
};