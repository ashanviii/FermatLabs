'use client';
/* eslint-disable */

import Link from '@/components/link/Link';
import MessageBoxChat from '@/components/MessageBox';
import TypewriterText from '../src/components/TypewriterText';
import ThinkingAnimation from '../src/components/ThinkingAnimation';
import LiveAgentAnimation from '../src/components/LiveAgentAnimation';
import FormattedAnswer from '../src/components/FormattedAnswer';
import AnswerContainer from '../src/components/AnswerContainer';
import { QueryCounter, QueryLimitReachedBanner } from '../src/components/QueryCounter';
import RotatingPlaceholder from '../src/components/RotatingPlaceholder';
import SkeletonLoader from '../src/components/SkeletonLoader';
import AgentWorkflow, { AgentStep } from '../src/components/AgentWorkflow';
import WelcomeGuide from '../src/components/WelcomeGuide';
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
  useToast,
  useDisclosure,
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { MdAutoAwesome, MdBolt, MdPerson, MdFlight, MdHotel, MdDescription, MdHelpOutline } from 'react-icons/md';
import { FaMapMarkedAlt } from 'react-icons/fa';
import Bg from '../public/img/chat/back.gif';
import { useAuth } from '../src/contexts/AuthContext';
import { useUserContext } from '../src/contexts/UserContextContext';

export default function Chat() {
  const [inputCode, setInputCode] = useState('');
  const [outputCode, setOutputCode] = useState('');
  const [fullAnswer, setFullAnswer] = useState(''); // Store the complete answer for typewriter
  const [model, setModel] = useState<OpenAIModel>('reddit-rag');
  const [loading, setLoading] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
  const [showMainUI, setShowMainUI] = useState(false);
  const [showTypewriter, setShowTypewriter] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showLimitReached, setShowLimitReached] = useState(false);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  
  // Agentic workflow states
  const [showAgentWorkflow, setShowAgentWorkflow] = useState(false);
  const [agentSteps, setAgentSteps] = useState<AgentStep[]>([]);
  const [currentAgentStep, setCurrentAgentStep] = useState(0);
  
  // Web search toggle state
  const [webSearchEnabled, setWebSearchEnabled] = useState(false);
  
  // Welcome guide state
  const { isOpen: isWelcomeOpen, onOpen: onWelcomeOpen, onClose: onWelcomeClose } = useDisclosure();
  
  // Use Firebase auth
  const { user, loading: authLoading, signInWithGoogle, logOut } = useAuth();
  
  // Use User Context for query tracking
  const { queriesRemaining, isPro, canQuery, makeQuery, upgradeUser } = useUserContext();
  
  const toast = useToast();

  // Animated placeholder text
  const placeholderTexts = [
    "Do I need a visa to visit Japan from the US?",
    "What documents are required for a UK tourist visa?",
    "How long does a Schengen visa application take?",
    "Can I get a visa on arrival in Thailand?",
    "What are the requirements for an Australian visa?",
    "Do I need a visa for a layover in Dubai?",
    "How to apply for a Canadian tourist visa?",
    "Is my country eligible for visa-free travel to Europe?",
  ];

  // Cycle through placeholders
  useEffect(() => {
    if (inputCode) return; // Don't animate if user is typing
    
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % placeholderTexts.length);
    }, 3000); // Change every 3 seconds
    
    return () => clearInterval(interval);
  }, [inputCode]);

  // Debug logging for query tracking
  useEffect(() => {
    console.log('Query Stats:', { queriesRemaining, isPro, canQuery });
  }, [queriesRemaining, isPro, canQuery]);

  // Handle showing main UI after authentication
  useEffect(() => {
    if (user && !authLoading && !showMainUI) {
      setTimeout(() => {
        setShowMainUI(true);
      }, 300);
    }
  }, [user, authLoading, showMainUI]);

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
      // Add a delay before showing main UI for smooth transition
      setTimeout(() => {
        setShowMainUI(true);
        setFadeOut(false);
      }, 800);
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

  const handleUpgrade = async () => {
    // In a real app, this would integrate with a payment processor
    // For now, we'll just show a toast and provide instructions
    toast({
      title: 'Upgrade to Pro',
      description: 'Contact support or visit our website to upgrade your account.',
      status: 'info',
      duration: 7000,
      isClosable: true,
      position: 'top',
    });
    
    // For demo purposes, you could uncomment this to instantly upgrade:
    // await upgradeUser();
    // toast({
    //   title: 'Welcome to Pro!',
    //   description: 'You now have unlimited queries!',
    //   status: 'success',
    //   duration: 5000,
    //   isClosable: true,
    //   position: 'top',
    // });
  };

  // Initialize intelligent agent workflow based on query type
  const initializeAgentWorkflow = (query: string, webSearchActive: boolean = false) => {
    // Detect query type and create appropriate workflow - Complete Travel Universe
    const queryLower = query.toLowerCase();
    const needsWebSearch = webSearchActive ? true : shouldUseWebSearch(query);
    let steps: AgentStep[] = [];
    
    // ✈️ FLIGHT AGENT
    if (queryLower.includes('flight') || queryLower.includes('fly') || queryLower.includes('airline')) {
      steps = [
        { id: '1', title: '🔍 Understanding Your Travel Plans', description: 'Analyzing departure/arrival cities, travel dates, number of passengers, and class preferences from your request', status: 'active' },
        { id: '2', title: '✈️ Searching Global Flight Database', description: needsWebSearch ? 'Scanning 200+ airlines, checking live prices on the web, and comparing real-time availability' : 'Analyzing flight routes, trusted airlines, and traveler experiences from community insights', status: 'pending' },
        { id: '3', title: '📊 Analyzing Real-Time Options', description: needsWebSearch ? 'Comparing current prices, flight durations, layovers, and airline ratings from live internet sources' : 'Evaluating flight quality, reliability, and passenger experiences from travel community feedback', status: 'pending' },
        { id: '4', title: '🎯 Preparing Your Recommendations', description: 'Selecting top 5 flight options with best value, verified by real-time data and experienced travelers', status: 'pending' }
      ];
    }
    // 🏨 HOTEL/ACCOMMODATION AGENT
    else if (queryLower.includes('hotel') || queryLower.includes('accommodation') || queryLower.includes('stay') || queryLower.includes('resort') || queryLower.includes('airbnb')) {
      steps = [
        { id: '1', title: '🏨 Understanding Your Stay Preferences', description: 'Extracting location, check-in/out dates, room type, guest count, and preferred amenities from your query', status: 'active' },
        { id: '2', title: '🔎 Searching Live Accommodation Data', description: 'Finding hotels, resorts, apartments from 50+ booking platforms with real-time availability and prices from the web', status: 'pending' },
        { id: '3', title: '⭐ Filtering & Ranking Properties', description: 'Matching your budget, analyzing current guest reviews, and verifying live availability from internet sources', status: 'pending' },
        { id: '4', title: '🎁 Curating Best-Value Options', description: 'Selecting top-rated accommodations with today\'s best prices and most recent traveler feedback', status: 'pending' }
      ];
    }
    // 🚗 CAR RENTAL AGENT
    else if (queryLower.includes('car') || queryLower.includes('rental') || queryLower.includes('drive') || queryLower.includes('vehicle')) {
      steps = [
        { id: '1', title: '🚗 Analyzing Car Rental Needs', description: 'Identifying pickup/drop-off locations, dates, vehicle type (economy/SUV/luxury), and driver requirements', status: 'active' },
        { id: '2', title: '🔍 Searching Rental Companies', description: 'Comparing rates from Enterprise, Hertz, Avis, Budget, and 30+ local providers in your destination', status: 'pending' },
        { id: '3', title: '💰 Evaluating Deals & Insurance', description: 'Analyzing rental costs, insurance options, fuel policies, mileage limits, and hidden fees', status: 'pending' },
        { id: '4', title: '✅ Recommending Best Options', description: 'Selecting most affordable and reliable car rental deals with transparent pricing and great reviews', status: 'pending' }
      ];
    }
    // 🎫 TOURS & ACTIVITIES AGENT
    else if (queryLower.includes('tour') || queryLower.includes('activity') || queryLower.includes('activities') || queryLower.includes('experience') || queryLower.includes('excursion')) {
      steps = [
        { id: '1', title: '🎫 Understanding Activity Preferences', description: 'Detecting interests (adventure, culture, food tours, etc.), group size, dates, and experience level', status: 'active' },
        { id: '2', title: '🌍 Searching Tour Operators', description: 'Finding guided tours, self-guided experiences, day trips, and unique activities from Viator, GetYourGuide, and local providers', status: 'pending' },
        { id: '3', title: '⭐ Ranking by Reviews & Value', description: 'Analyzing traveler ratings, pricing, duration, inclusions, and cancellation policies', status: 'pending' },
        { id: '4', title: '🎉 Curating Top Experiences', description: 'Recommending must-do activities with best reviews, fair prices, and authentic local experiences', status: 'pending' }
      ];
    }
    // 🍽️ RESTAURANT & DINING AGENT
    else if (queryLower.includes('restaurant') || queryLower.includes('food') || queryLower.includes('eat') || queryLower.includes('dining') || queryLower.includes('cuisine')) {
      steps = [
        { id: '1', title: '🍽️ Understanding Food Preferences', description: 'Identifying cuisine type, dietary restrictions, budget, location, and dining atmosphere preferences', status: 'active' },
        { id: '2', title: '👨‍🍳 Searching Restaurant Databases', description: 'Scanning Michelin guides, local favorites, street food spots, and hidden gems across multiple platforms', status: 'pending' },
        { id: '3', title: '⭐ Analyzing Reviews & Ratings', description: 'Evaluating food quality, service, ambiance, price-to-value ratio, and recent diner experiences', status: 'pending' },
        { id: '4', title: '🎯 Recommending Best Dining', description: 'Selecting top restaurants with reservation links, peak hours, signature dishes, and insider tips', status: 'pending' }
      ];
    }
    // 🚆 TRANSPORTATION AGENT
    else if (queryLower.includes('train') || queryLower.includes('bus') || queryLower.includes('metro') || queryLower.includes('transport') || queryLower.includes('subway') || queryLower.includes('taxi')) {
      steps = [
        { id: '1', title: '🚆 Understanding Transit Needs', description: 'Identifying routes, travel times, frequency, and preferred transportation modes (train/bus/metro/taxi)', status: 'active' },
        { id: '2', title: '🗺️ Mapping Transportation Options', description: 'Finding trains, buses, metro lines, taxis, ride-shares, and local transit systems available at your destination', status: 'pending' },
        { id: '3', title: '💳 Analyzing Tickets & Passes', description: 'Comparing single tickets, day passes, tourist cards, and multi-ride options for best savings', status: 'pending' },
        { id: '4', title: '📱 Providing Transit Guide', description: 'Creating detailed transport plan with apps to download, ticket purchasing tips, and route instructions', status: 'pending' }
      ];
    }
    // 💱 CURRENCY & BUDGET AGENT
    else if (queryLower.includes('currency') || queryLower.includes('exchange') || queryLower.includes('money') || queryLower.includes('budget') || queryLower.includes('cost')) {
      steps = [
        { id: '1', title: '💱 Analyzing Budget Requirements', description: 'Understanding trip duration, spending categories (accommodation, food, activities), and financial preferences', status: 'active' },
        { id: '2', title: '📊 Researching Current Rates', description: 'Fetching live exchange rates, comparing currency exchange locations, and identifying ATM fees', status: 'pending' },
        { id: '3', title: '💰 Calculating Trip Budget', description: 'Estimating daily costs, creating budget breakdown by category, and finding money-saving opportunities', status: 'pending' },
        { id: '4', title: '💳 Providing Financial Tips', description: 'Recommending best credit cards for travel, where to exchange money, and avoiding tourist traps', status: 'pending' }
      ];
    }
    // 📱 SIM CARD & CONNECTIVITY AGENT
    else if (queryLower.includes('sim') || queryLower.includes('wifi') || queryLower.includes('internet') || queryLower.includes('phone') || queryLower.includes('data')) {
      steps = [
        { id: '1', title: '📱 Understanding Connectivity Needs', description: 'Identifying data requirements, trip duration, coverage areas, and device compatibility', status: 'active' },
        { id: '2', title: '🌐 Researching SIM & WiFi Options', description: 'Finding local SIM cards, eSIMs, pocket WiFi devices, and international roaming plans available', status: 'pending' },
        { id: '3', title: '💵 Comparing Plans & Pricing', description: 'Analyzing data allowances, validity periods, network coverage, and cost-effectiveness of each option', status: 'pending' },
        { id: '4', title: '📲 Recommending Best Solution', description: 'Suggesting optimal connectivity option with purchase locations, activation steps, and backup plans', status: 'pending' }
      ];
    }
    // 💉 HEALTH & VACCINATION AGENT
    else if (queryLower.includes('vaccine') || queryLower.includes('health') || queryLower.includes('medical') || queryLower.includes('insurance') || queryLower.includes('doctor')) {
      steps = [
        { id: '1', title: '💉 Assessing Health Requirements', description: 'Identifying destination health risks, required vaccinations, and your current health status', status: 'active' },
        { id: '2', title: '🏥 Researching Medical Guidelines', description: 'Checking CDC/WHO recommendations, mandatory vaccines, malaria prevention, and travel health advisories', status: 'pending' },
        { id: '3', title: '💊 Planning Health Preparations', description: 'Creating vaccination timeline, listing medications to pack, and finding travel clinics near you', status: 'pending' },
        { id: '4', title: '🛡️ Ensuring Medical Safety', description: 'Recommending travel insurance, emergency contacts, prescription documentation, and health app downloads', status: 'pending' }
      ];
    }
    // 🌤️ WEATHER & PACKING AGENT
    else if (queryLower.includes('weather') || queryLower.includes('climate') || queryLower.includes('pack') || queryLower.includes('packing') || queryLower.includes('what to wear')) {
      steps = [
        { id: '1', title: '🌤️ Analyzing Weather Patterns', description: 'Checking seasonal climate, temperature ranges, rainfall, humidity, and weather forecasts for travel dates', status: 'active' },
        { id: '2', title: '🎒 Creating Packing Strategy', description: 'Considering trip activities, accommodation laundry facilities, baggage limits, and cultural dress codes', status: 'pending' },
        { id: '3', title: '👕 Building Packing List', description: 'Listing essential clothing, shoes, toiletries, electronics, documents, and weather-specific items', status: 'pending' },
        { id: '4', title: '✅ Finalizing Travel Prep', description: 'Providing smart packing tips, weight-saving tricks, prohibited items list, and last-minute checklist', status: 'pending' }
      ];
    }
    // 🎒 TRAVEL INSURANCE AGENT
    else if (queryLower.includes('insurance') || queryLower.includes('coverage') || queryLower.includes('protection') || queryLower.includes('cancel')) {
      steps = [
        { id: '1', title: '🎒 Understanding Coverage Needs', description: 'Assessing trip cost, destination risks, activities planned, health conditions, and cancellation concerns', status: 'active' },
        { id: '2', title: '🔍 Researching Insurance Providers', description: 'Comparing World Nomads, SafetyWing, Allianz, and specialized travel insurance companies', status: 'pending' },
        { id: '3', title: '📋 Analyzing Policy Details', description: 'Evaluating coverage limits, exclusions, medical benefits, trip cancellation, baggage protection, and adventure sports', status: 'pending' },
        { id: '4', title: '🛡️ Recommending Best Policy', description: 'Suggesting optimal insurance with best value, comprehensive coverage, and easy claims process', status: 'pending' }
      ];
    }
    // 🗣️ LANGUAGE & TRANSLATION AGENT
    else if (queryLower.includes('language') || queryLower.includes('translate') || queryLower.includes('phrase') || queryLower.includes('speak') || queryLower.includes('communication')) {
      steps = [
        { id: '1', title: '🗣️ Identifying Language Needs', description: 'Determining destination language, your proficiency level, and key communication situations', status: 'active' },
        { id: '2', title: '📚 Compiling Essential Phrases', description: 'Gathering greetings, directions, dining, shopping, emergency, and cultural etiquette expressions', status: 'pending' },
        { id: '3', title: '📱 Recommending Translation Tools', description: 'Finding best apps (Google Translate, iTranslate), offline dictionaries, and pronunciation guides', status: 'pending' },
        { id: '4', title: '💬 Providing Language Guide', description: 'Creating phrasebook with audio, cultural tips, common mistakes to avoid, and local dialect notes', status: 'pending' }
      ];
    }
    // 💳 PAYMENT & BANKING AGENT
    else if (queryLower.includes('credit card') || queryLower.includes('debit') || queryLower.includes('payment') || queryLower.includes('atm') || queryLower.includes('cash')) {
      steps = [
        { id: '1', title: '💳 Understanding Payment Options', description: 'Assessing destination payment culture (cash vs card), ATM availability, and your banking setup', status: 'active' },
        { id: '2', title: '🏦 Researching Banking Solutions', description: 'Finding travel-friendly credit cards, fee-free ATMs, digital wallets, and currency exchange options', status: 'pending' },
        { id: '3', title: '🔒 Ensuring Payment Security', description: 'Checking fraud alerts, transaction limits, backup payment methods, and emergency card replacement', status: 'pending' },
        { id: '4', title: '💰 Providing Financial Strategy', description: 'Recommending cash amounts, best cards to use, ATM withdrawal tips, and avoiding foreign transaction fees', status: 'pending' }
      ];
    }
    // 📸 PHOTOGRAPHY & INSTAGRAM AGENT
    else if (queryLower.includes('photo') || queryLower.includes('instagram') || queryLower.includes('camera') || queryLower.includes('picture')) {
      steps = [
        { id: '1', title: '📸 Understanding Photography Goals', description: 'Identifying photo style (landscape, street, portraits), equipment available, and Instagram-worthy locations', status: 'active' },
        { id: '2', title: '🗺️ Finding Best Photo Spots', description: 'Researching iconic viewpoints, hidden gems, golden hour locations, and local photographer recommendations', status: 'pending' },
        { id: '3', title: '⏰ Planning Photo Itinerary', description: 'Mapping optimal timing for lighting, crowd avoidance, and weather conditions at each location', status: 'pending' },
        { id: '4', title: '📱 Providing Photography Guide', description: 'Sharing composition tips, camera settings, editing apps, and geo-tags for social media posting', status: 'pending' }
      ];
    }
    // 🎁 SHOPPING & SOUVENIRS AGENT
    else if (queryLower.includes('shop') || queryLower.includes('shopping') || queryLower.includes('souvenir') || queryLower.includes('buy') || queryLower.includes('market')) {
      steps = [
        { id: '1', title: '🎁 Understanding Shopping Interests', description: 'Identifying what to buy (souvenirs, local crafts, fashion, electronics) and budget constraints', status: 'active' },
        { id: '2', title: '🛍️ Researching Shopping Districts', description: 'Finding local markets, shopping malls, artisan areas, duty-free zones, and authentic craft shops', status: 'pending' },
        { id: '3', title: '💎 Evaluating Value & Authenticity', description: 'Checking fair prices, haggling tips, authenticity verification, and avoiding tourist scams', status: 'pending' },
        { id: '4', title: '🎯 Creating Shopping Guide', description: 'Listing must-buy items, best shopping times, tax refund process, and shipping options for large purchases', status: 'pending' }
      ];
    }
    // 🌙 NIGHTLIFE & ENTERTAINMENT AGENT
    else if (queryLower.includes('nightlife') || queryLower.includes('bar') || queryLower.includes('club') || queryLower.includes('party') || queryLower.includes('entertainment')) {
      steps = [
        { id: '1', title: '🌙 Understanding Entertainment Preferences', description: 'Identifying nightlife style (clubs, bars, live music, theater), vibe, and safety concerns', status: 'active' },
        { id: '2', title: '🎭 Researching Venues & Events', description: 'Finding popular clubs, rooftop bars, live music venues, theater shows, and special events during your visit', status: 'pending' },
        { id: '3', title: '🎫 Checking Entry & Timing', description: 'Analyzing cover charges, dress codes, peak hours, age restrictions, and advance booking needs', status: 'pending' },
        { id: '4', title: '🎉 Curating Night Guide', description: 'Recommending safe neighborhoods, pub crawls, local hangouts, and transportation back to hotel', status: 'pending' }
      ];
    }
    // 👨‍👩‍👧‍👦 FAMILY TRAVEL AGENT
    else if (queryLower.includes('family') || queryLower.includes('kids') || queryLower.includes('children') || queryLower.includes('baby')) {
      steps = [
        { id: '1', title: '👨‍👩‍👧‍👦 Assessing Family Needs', description: 'Understanding children ages, special requirements (stroller, high chair), and family-friendly preferences', status: 'active' },
        { id: '2', title: '🎡 Finding Kid-Friendly Activities', description: 'Researching playgrounds, theme parks, interactive museums, and age-appropriate attractions', status: 'pending' },
        { id: '3', title: '🏠 Evaluating Family Accommodations', description: 'Finding hotels with family rooms, kitchenettes, pools, and child-care services available', status: 'pending' },
        { id: '4', title: '👶 Creating Family Plan', description: 'Providing packing lists for kids, feeding options, nap schedules, and emergency pediatric contacts', status: 'pending' }
      ];
    }
    // 🏔️ ADVENTURE & OUTDOOR AGENT
    else if (queryLower.includes('hiking') || queryLower.includes('adventure') || queryLower.includes('outdoor') || queryLower.includes('trek') || queryLower.includes('mountain')) {
      steps = [
        { id: '1', title: '🏔️ Understanding Adventure Level', description: 'Assessing fitness level, experience, preferred activities (hiking, climbing, diving), and safety concerns', status: 'active' },
        { id: '2', title: '🗻 Researching Trails & Routes', description: 'Finding hiking trails, climbing spots, diving sites, difficulty ratings, and permit requirements', status: 'pending' },
        { id: '3', title: '🎒 Planning Gear & Safety', description: 'Listing essential equipment, local guides/tours, weather risks, and emergency rescue contacts', status: 'pending' },
        { id: '4', title: '⛰️ Creating Adventure Plan', description: 'Providing trail maps, altitude tips, best seasons, camping options, and physical preparation advice', status: 'pending' }
      ];
    }
    // 💼 BUSINESS TRAVEL AGENT
    else if (queryLower.includes('business') || queryLower.includes('work') || queryLower.includes('conference') || queryLower.includes('meeting')) {
      steps = [
        { id: '1', title: '💼 Understanding Business Requirements', description: 'Identifying meeting locations, work facilities needed, professional dress codes, and tight schedules', status: 'active' },
        { id: '2', title: '🏢 Finding Business Hotels', description: 'Researching hotels with conference rooms, business centers, fast WiFi, and proximity to offices', status: 'pending' },
        { id: '3', title: '📊 Optimizing Work Schedule', description: 'Planning efficient routes between meetings, coworking spaces, quiet cafes, and dining options for clients', status: 'pending' },
        { id: '4', title: '✈️ Streamlining Business Trip', description: 'Providing expense tracking tips, airport lounge access, priority services, and loyalty programs', status: 'pending' }
      ];
    }
    // 🌱 SUSTAINABLE TRAVEL AGENT
    else if (queryLower.includes('eco') || queryLower.includes('sustainable') || queryLower.includes('green') || queryLower.includes('environment')) {
      steps = [
        { id: '1', title: '🌱 Understanding Eco Priorities', description: 'Identifying sustainability goals (carbon offset, plastic reduction, local support, wildlife protection)', status: 'active' },
        { id: '2', title: '♻️ Finding Green Options', description: 'Researching eco-hotels, sustainable tours, public transport, farm-to-table restaurants, and ethical operators', status: 'pending' },
        { id: '3', title: '🌍 Reducing Travel Impact', description: 'Calculating carbon footprint, finding offset programs, zero-waste tips, and responsible tourism practices', status: 'pending' },
        { id: '4', title: '🌿 Creating Sustainable Plan', description: 'Recommending green accommodations, local community support, reusable items to pack, and eco-certifications', status: 'pending' }
      ];
    }
    // 📋 DOCUMENT/VISA AGENT
    else if (queryLower.includes('document') || queryLower.includes('checklist') || queryLower.includes('what do i need') || queryLower.includes('paperwork')) {
      steps = [
        { id: '1', title: '📋 Identifying Visa Requirements', description: 'Determining visa type, destination country, your nationality, and purpose of travel from your request', status: 'active' },
        { id: '2', title: '🏛️ Researching Official Requirements', description: 'Checking latest embassy guidelines, consulate updates, and official government documentation rules', status: 'pending' },
        { id: '3', title: '📄 Compiling Complete Checklist', description: 'Creating comprehensive document list including passport, photos, financials, and supporting papers', status: 'pending' },
        { id: '4', title: '💡 Adding Expert Tips & Warnings', description: 'Including insider advice, common mistakes to avoid, processing tips, and success strategies', status: 'pending' }
      ];
    }
    // 🗺️ ITINERARY AGENT
    else if (queryLower.includes('itinerary') || queryLower.includes('plan') || queryLower.includes('things to do')) {
      steps = [
        { id: '1', title: '🎯 Understanding Your Travel Style', description: 'Analyzing trip duration, interests (culture, adventure, food, etc.), pace preference, and budget from your query', status: 'active' },
        { id: '2', title: '🗺️ Researching Top Attractions', description: 'Finding must-see sights, hidden gems, local experiences, restaurants, and activities based on your interests', status: 'pending' },
        { id: '3', title: '📅 Optimizing Daily Schedule', description: 'Creating day-by-day plan with optimal routes, minimizing travel time, balancing activities and rest', status: 'pending' },
        { id: '4', title: '🎉 Finalizing Perfect Itinerary', description: 'Adding restaurant reservations, transport options, booking links, and time-saving tips for each day', status: 'pending' }
      ];
    }
    // 🧠 GENERAL VISA/TRAVEL AGENT (Default Fallback)
    else {
      steps = [
        { id: '1', title: '🧠 Understanding Your Request', description: 'Breaking down your travel/visa question, identifying key requirements, and detecting your specific needs', status: 'active' },
        { id: '2', title: '📚 Searching Multiple Sources', description: needsWebSearch ? 'Scanning Reddit communities, official sites, live web results, and real-time updates from the internet' : 'Deep-diving into Reddit travel communities, verified experiences, and trusted insider knowledge', status: 'pending' },
        { id: '3', title: '⚙️ Analyzing Requirements', description: needsWebSearch ? 'Processing visa rules, current requirements from web, and latest policy updates' : 'Analyzing community experiences, common pitfalls, and proven strategies from real travelers', status: 'pending' },
        { id: '4', title: '✍️ Generating Personalized Guidance', description: 'Creating detailed, actionable advice combining official data with real traveler experiences', status: 'pending' }
      ];
    }

    setAgentSteps(steps);
    setCurrentAgentStep(0);
    setShowAgentWorkflow(true);
    
    // Add AI agent message to conversation with intelligent search indicator
    const searchMode = needsWebSearch 
      ? (webSearchActive ? '🌐 Web + 💬 Community (Manual)' : '🌐 Web + 💬 Community') 
      : '💬 Community Expert';
    
    simulateAgentProgress(steps);
  };

  const simulateAgentProgress = (steps: AgentStep[]) => {
    let currentStep = 0;
    const stepDuration = 1800;

    const progressInterval = setInterval(() => {
      if (currentStep < steps.length) {
        setAgentSteps(prev => prev.map((step, idx) => ({
          ...step,
          status: idx < currentStep ? 'completed' : idx === currentStep ? 'active' : 'pending'
        })));

        setCurrentAgentStep(currentStep);
        currentStep++;
      } else {
        clearInterval(progressInterval);
        // Don't hide the workflow - let it show until answer is ready
        // setShowAgentWorkflow(false);
      }
    }, stepDuration);
  };

  // Intelligently determine if web search is needed based on query type
  const shouldUseWebSearch = (query: string): boolean => {
    const queryLower = query.toLowerCase();
    
    // ALWAYS use web search for these (need real-time data)
    const alwaysWebSearch = [
      'price', 'cost', 'how much', 'cheap', 'expensive', 'deal', 'discount',
      'book', 'booking', 'reserve', 'buy', 'purchase',
      'current', 'now', 'today', 'latest', 'recent', '2025', '2026',
      'open', 'closed', 'hours', 'schedule', 'availability',
      'weather', 'forecast', 'temperature', 'climate',
      'exchange rate', 'currency', 'atm',
      'flight', 'hotel', 'restaurant', 'tour',
      'phone number', 'address', 'location', 'where is',
      'event', 'festival', 'concert', 'show'
    ];
    
    // NEVER use web search for these (Reddit community knowledge is better)
    const skipWebSearch = [
      'experience', 'recommend', 'worth it', 'should i',
      'advice', 'tip', 'suggestion', 'opinion',
      'visa process', 'visa application', 'embassy experience',
      'how was', 'what was it like', 'anyone been',
      'scam', 'safe', 'safety', 'dangerous',
      'local secret', 'hidden gem', 'off the beaten',
      'cultural', 'etiquette', 'custom', 'tradition',
      'mistake', 'avoid', 'warning', 'regret'
    ];
    
    // Check if query needs web search
    const needsWeb = alwaysWebSearch.some(keyword => queryLower.includes(keyword));
    const skipWeb = skipWebSearch.some(keyword => queryLower.includes(keyword));
    
    // If both match, prioritize based on specificity
    if (needsWeb && skipWeb) {
      // If asking about experience with specific prices/bookings, use both
      return true;
    }
    
    // Use web search if explicitly needed
    if (needsWeb) return true;
    
    // Don't use web search if community knowledge is better
    if (skipWeb) return false;
    
    // Default: use web search for comprehensive results
    return true;
  };

  const handleTranslate = async () => {
    if (!inputCode) return alert('Please enter your message.');
    
    console.log('Attempting query. Can query?', canQuery, 'Queries remaining:', queriesRemaining);
    
    // Check if user can make a query
    if (!canQuery) {
      setShowLimitReached(true);
      toast({
        title: '⚠️ Query limit reached',
        description: 'You\'ve used all 5 free queries. Upgrade to Pro for unlimited access!',
        status: 'warning',
        duration: 5000,
        isClosable: true,
        position: 'top',
        variant: 'subtle',
      });
      return;
    }

    // Check if query is for a Pro-only service (non-visa related)
    if (!isPro) {
      const queryLower = inputCode.toLowerCase();
      
      // Define Pro-only service keywords
      const proServices = {
        'flight': ['flight', 'fly', 'airline', 'airplane', 'airport transfer', 'layover'],
        'hotel': ['hotel', 'accommodation', 'stay', 'resort', 'airbnb', 'hostel', 'booking'],
        'restaurant': ['restaurant', 'food', 'eat', 'dining', 'cuisine', 'cafe', 'meal'],
        'car': ['car rental', 'rent a car', 'drive', 'vehicle', 'rental car'],
        'tour': ['tour', 'activity', 'activities', 'experience', 'excursion', 'attraction'],
        'health': ['vaccine', 'vaccination', 'health', 'medical', 'doctor', 'insurance', 'malaria'],
        'budget': ['budget', 'cost', 'expensive', 'cheap', 'price', 'currency', 'exchange', 'money'],
        'sim': ['sim card', 'wifi', 'internet', 'phone', 'data', 'esim', 'connectivity'],
        'weather': ['weather', 'climate', 'temperature', 'pack', 'packing', 'what to wear'],
        'transport': ['train', 'bus', 'metro', 'subway', 'taxi', 'uber', 'transport', 'transit'],
        'language': ['language', 'translate', 'phrase', 'speak', 'communication', 'culture', 'etiquette']
      };

      // Check if query matches any Pro service
      let matchedService = null;
      for (const [serviceName, keywords] of Object.entries(proServices)) {
        if (keywords.some(keyword => queryLower.includes(keyword))) {
          matchedService = serviceName;
          break;
        }
      }

      // If query is for a Pro service, show upgrade prompt
      if (matchedService) {
        const serviceNames: { [key: string]: string } = {
          'flight': 'Flight Search',
          'hotel': 'Hotels & Stays',
          'restaurant': 'Dining & Food',
          'car': 'Car Rentals',
          'tour': 'Tours & Activities',
          'health': 'Health & Vaccines',
          'budget': 'Budget & Currency',
          'sim': 'SIM & Connectivity',
          'weather': 'Weather & Packing',
          'transport': 'Transportation',
          'language': 'Language & Culture'
        };

        toast({
          title: '🔒 Pro Feature Required',
          description: `${serviceNames[matchedService]} is a Pro feature. Upgrade to access all travel services!`,
          status: 'warning',
          duration: 6000,
          isClosable: true,
          position: 'top',
        });

        // Show upgrade prompt
        setTimeout(() => {
          handleUpgrade();
        }, 1000);
        
        return;
      }
    }

    // Intelligently determine search strategy (only if user hasn't enabled web search manually)
    const useWebSearch = webSearchEnabled ? true : shouldUseWebSearch(inputCode);
    
    console.log('🤖 Intelligent Search Strategy:', {
      query: inputCode,
      useWebSearch,
      manualOverride: webSearchEnabled,
      reason: webSearchEnabled ? 'User enabled web search' : (useWebSearch ? 'Needs real-time data from web' : 'Community knowledge is better')
    });
    
    // Show processing toast with intelligent messaging
    toast({
      title: '🚀 Processing your request...',
      description: useWebSearch 
        ? 'Searching web + community for real-time data'
        : 'Searching travel community for expert insights',
      status: 'info',
      duration: 2000,
      isClosable: true,
      position: 'bottom-right',
      variant: 'subtle',
    });
    
    // Show processing toast
    toast({
      title: '� Processing your request...',
      description: 'Fermat AI agents are working on your travel needs',
      status: 'info',
      duration: 2000,
      isClosable: true,
      position: 'bottom-right',
      variant: 'subtle',
    });
    
    // Initialize intelligent agent workflow
    initializeAgentWorkflow(inputCode, useWebSearch);
    
    // Start transition immediately
    setIsTransitioning(true);
    
    // Clear previous states
    setOutputCode('');
    setFullAnswer('');
    setShowTypewriter(false);
    setIsTyping(false);
    setShowLimitReached(false);
    
    // Small delay to show the transition effect before loading
    setTimeout(() => {
      setLoading(true);
    }, 200);
    
    try {
      let finalAnswer = '';
      
      if (useWebSearch) {
        // Call both Reddit RAG and Web Search in parallel for comprehensive results
        const [redditResponse, webSearchResponse] = await Promise.all([
          fetch(`/api/redditRAG?query=${encodeURIComponent(inputCode)}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
          }),
          fetch(`/api/webSearch?query=${encodeURIComponent(inputCode)}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
          })
        ]);

        // Process Reddit RAG response
        if (redditResponse.ok) {
          const redditData = await redditResponse.json();
          finalAnswer = redditData.answer || '';
        }
        
        // Process Web Search response (results integrated into main answer, not shown separately)
        if (webSearchResponse.ok) {
          const webData = await webSearchResponse.json();
          // Web results are used by the AI but not displayed separately
        }
      } else {
        // Use only Reddit RAG for community-focused queries
        const redditResponse = await fetch(
          `/api/redditRAG?query=${encodeURIComponent(inputCode)}`,
          { method: 'GET', headers: { 'Content-Type': 'application/json' } }
        );
        
        if (redditResponse.ok) {
          const redditData = await redditResponse.json();
          finalAnswer = redditData.answer || '';
          
          // Add community badge
          if (finalAnswer) {
            finalAnswer = `💬 **Community Insights:**\n\n${finalAnswer}`;
          }
        }
      }
      
      if (!finalAnswer) {
        finalAnswer = 'I apologize, but I couldn\'t find specific information. Please try rephrasing your question or being more specific about your travel needs.';
      }
      
      setFullAnswer(finalAnswer);
      
      // Increment query count AFTER successful query
      console.log('Query successful, incrementing count...');
      const querySuccess = await makeQuery();
      console.log('Query count incremented:', querySuccess);
      
      // Smooth transition from loading to typewriter
      setTimeout(() => {
        setLoading(false);
        setTimeout(() => {
          setShowTypewriter(true);
          setIsTyping(true);
          setIsTransitioning(false);
          setShowAgentWorkflow(false); // Hide the workflow when answer is ready
          
          // Success toast
          toast({
            title: '✅ Response ready!',
            description: 'Your answer is being displayed',
            status: 'success',
            duration: 2000,
            isClosable: true,
            position: 'bottom-right',
            variant: 'subtle',
          });
        }, 400);
      }, 300);
    } catch (err) {
      console.error(err);
      toast({
        title: '❌ Connection failed',
        description: 'Unable to reach the backend. Please try again.',
        status: 'error',
        duration: 4000,
        isClosable: true,
        position: 'top',
        variant: 'subtle',
      });
      setLoading(false);
      setIsTransitioning(false);
      setShowAgentWorkflow(false); // Hide workflow on error
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
        px={{ base: '24px', md: '32px' }}
      >
        <Img
          src={Bg.src}
          alt="background"
          position="absolute"
          top="44%"
          left="50%"
          transform="translate(-50%, -50%) scale(0.75)"
          w={{ base: '240px', md: '280px', lg: '320px' }}
          opacity={0.3}
          zIndex="0"
          pointerEvents="none"
        />
        <Box zIndex="2" textAlign="center" maxW="560px">
          <Text fontSize={{ base: '2xl', md: '3xl', lg: '4xl' }} fontWeight="700" color="black" mb={{ base: '3', md: '4' }}>
            Welcome to <Text as="span" color="gray.800">Fermat</Text>
          </Text>
          <Text fontSize={{ base: 'sm', md: 'md', lg: 'lg' }} color="gray.600" mb={{ base: '8', md: '10' }} fontWeight="500" px={{ base: '0', md: '4' }}>
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
              size={{ base: 'md', md: 'lg' }}
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
        bg="white"
        color="black"
        textAlign="center"
        position="relative"
      >
        <Img
          src={Bg.src}
          alt="background"
          position="absolute"
          top="50%"
          left="50%"
          transform="translate(-50%, -50%) scale(0.6)"
          w="200px"
          opacity={0.2}
          zIndex="0"
          pointerEvents="none"
          animation="float 3s ease-in-out infinite"
          sx={{
            '@keyframes float': {
              '0%, 100%': { transform: 'translate(-50%, -50%) scale(0.6)' },
              '50%': { transform: 'translate(-50%, -52%) scale(0.6)' }
            }
          }}
        />
        <Box zIndex="2">
          <ThinkingAnimation text="Preparing your journey" />
        </Box>
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
      justify={outputCode || loading || fullAnswer || isTransitioning ? 'flex-start' : 'center'}
      position="relative"
      bg="white"
      opacity={showMainUI ? 1 : 0}
      transform={showMainUI ? 'translateY(0)' : 'translateY(20px)'}
      transition="all 0.8s cubic-bezier(0.4, 0, 0.2, 1)"
      px={{ base: '16px', md: '24px', lg: '32px' }}
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

      {/* Query Counter - Fixed at top */}
      <Flex 
        position="fixed" 
        top={{ base: '24px', md: '32px' }}
        right={{ base: '16px', md: '24px', lg: '32px' }}
        zIndex={999}
        opacity={showMainUI ? 1 : 0}
        transition="opacity 0.6s ease 0.4s"
      >
        <QueryCounter 
          remaining={queriesRemaining} 
          isPro={isPro} 
          onUpgrade={handleUpgrade}
        />
      </Flex>

      {/* Help Button - Fixed at top left */}
      <Button
        position="fixed"
        top={{ base: '24px', md: '32px' }}
        left={{ base: '16px', md: '24px', lg: '32px' }}
        zIndex={999}
        leftIcon={<Icon as={MdHelpOutline} />}
        bg="black"
        color="white"
        variant="solid"
        size="md"
        borderRadius="full"
        onClick={onWelcomeOpen}
        opacity={showMainUI ? 1 : 0}
        transition="all 0.3s ease"
        transitionDelay="0.4s"
        border="1px solid"
        borderColor="whiteAlpha.300"
        boxShadow="0 4px 12px rgba(0, 0, 0, 0.5)"
        _hover={{
          transform: "translateY(-2px)",
          boxShadow: "0 6px 20px rgba(139, 92, 246, 0.5)",
          borderColor: "purple.400",
          bg: "gray.900"
        }}
      >
        Show All Services
      </Button>

      {/* Welcome Guide Modal */}
      <WelcomeGuide 
        isOpen={isWelcomeOpen} 
        onClose={onWelcomeClose}
        isPro={isPro}
        onUpgrade={handleUpgrade}
        onExampleClick={(example) => {
          setInputCode(example);
        }}
      />

      {/* ✈️ Background Plane */}
      {!outputCode && !loading && !fullAnswer && !isTransitioning && (
        <Img
          src={Bg.src}
          position="absolute"
          w={{ base: '280px', md: '380px', lg: '420px' }}
          left="50%"
          top="46%"
          transform="translate(-50%, -50%)"
          opacity={showMainUI ? "0.85" : "0"}
          zIndex={0}
          pointerEvents="none"
          transition="opacity 1.2s ease 0.3s"
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
      {(outputCode || loading || fullAnswer || isTransitioning) && (
        loading ? (
          <Box
            mt={{ base: '80px', md: '100px' }}
            mb={{ base: '24px', md: '32px' }}
            w="100%"
            maxW="960px"
            zIndex={1}
            opacity={showMainUI ? 1 : 0}
            transform={showMainUI ? 'translateY(0)' : 'translateY(30px)'}
            transition="all 0.6s cubic-bezier(0.4, 0, 0.2, 1) 0.4s"
          >
            <Box position="relative">
              <SkeletonLoader />
              {/* Show LiveAgentAnimation if we have steps, otherwise fall back to ThinkingAnimation */}
              <Box
                position="absolute"
                top="50%"
                left="50%"
                transform="translate(-50%, -50%)"
                zIndex={2}
                w="90%"
              >
                {agentSteps.length > 0 ? (
                  <LiveAgentAnimation 
                    steps={agentSteps} 
                    currentStep={currentAgentStep}
                    compact={false}
                  />
                ) : (
                  <ThinkingAnimation text="Thinking" isTransitioning={false} />
                )}
              </Box>
            </Box>
          </Box>
        ) : (
          <Box
            mt={{ base: '80px', md: '100px' }}
            mb={{ base: '24px', md: '32px' }}
            w="100%"
            maxW="960px"
            zIndex={1}
            opacity={showMainUI ? 1 : 0}
            transform={showMainUI ? 'translateY(0)' : 'translateY(30px)'}
            transition="all 0.6s cubic-bezier(0.4, 0, 0.2, 1) 0.4s"
          >
            <AnswerContainer
              content={outputCode || ''}
              isThinking={isTransitioning}
            >
              {showTypewriter ? (
                <TypewriterText
                  text={fullAnswer}
                  speed={5}
                  showCursor={true}
                  useFormatting={true}
                  onComplete={() => {
                    setIsTyping(false);
                    setOutputCode(fullAnswer);
                    console.log('Typewriter animation completed');
                  }}
                />
              ) : outputCode ? (
                <FormattedAnswer content={outputCode} />
              ) : (
                <>
                  {/* Show LiveAgentAnimation if we have steps, otherwise fall back to ThinkingAnimation */}
                  {(isTransitioning || loading) && agentSteps.length > 0 ? (
                    <LiveAgentAnimation 
                      steps={agentSteps} 
                      currentStep={currentAgentStep}
                      compact={false}
                    />
                  ) : (isTransitioning || loading) ? (
                    <ThinkingAnimation isTransitioning={isTransitioning} />
                  ) : null}
                </>
              )}
            </AnswerContainer>
          </Box>
        )
      )}

      {/* Query Limit Reached Banner */}
      {(showLimitReached || (!canQuery && !outputCode && !loading && !fullAnswer)) && (
        <Box
          mt={{ base: '32px', md: '48px' }}
          w="100%"
          maxW="720px"
          zIndex={10}
          opacity={showMainUI ? 1 : 0}
          transition="opacity 0.6s ease"
        >
          <QueryLimitReachedBanner 
            isOpen={true} 
            onUpgrade={handleUpgrade}
          />
        </Box>
      )}


      {/* Input */}
      <Flex
        mt={outputCode || loading || fullAnswer || isTransitioning ? { base: '24px', md: '32px' } : { base: '48px', md: '64px' }}
        mb={{ base: '24px', md: '32px' }}
        w="100%"
        maxW="920px"
        justify="center"
        align="center"
        zIndex={1}
        gap={{ base: '8px', md: '12px' }}
        opacity={showMainUI ? 1 : 0}
        transform={showMainUI ? 'translateY(0)' : 'translateY(40px)'}
        transition="all 0.8s cubic-bezier(0.4, 0, 0.2, 1) 0.6s"
        flexDirection={{ base: 'column', md: 'row' }}
      >
        <Flex gap={{ base: '8px', md: '12px' }} w="100%" align="center">
          <Box position="relative" flex="1">
          <Input
            minH={{ base: '56px', md: '60px' }}
            w="100%"
            border="2px solid"
            borderColor={isTransitioning ? "gray.400" : "gray.300"}
            borderRadius="45px"
            p={{ base: '16px 20px', md: '18px 24px' }}
            fontSize={{ base: 'md', md: 'md' }}
            fontWeight="500"
            bg="white"
            color="gray.800"
            value={inputCode}
            placeholder={!canQuery ? "Query limit reached - Upgrade to Pro for unlimited access" : ""}
            onChange={handleChange}
            onKeyDown={handleKeyPress}
            _focus={{ 
              borderColor: 'purple.500',
              boxShadow: '0 0 0 3px rgba(139, 92, 246, 0.1), 0 4px 12px rgba(139, 92, 246, 0.15)',
              transform: 'translateY(-2px)'
            }}
            _hover={{ 
              borderColor: 'gray.400',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
              transform: !canQuery ? 'none' : 'translateY(-1px)'
            }}
            _placeholder={{
              color: 'gray.400',
              transition: 'opacity 0.5s ease',
            }}
            transition="all 0.25s cubic-bezier(0.4, 0, 0.2, 1)"
            transform={isTransitioning ? 'scale(0.98)' : 'scale(1)'}
            isDisabled={!canQuery}
            opacity={!canQuery ? 0.6 : 1}
            boxShadow="0 1px 3px rgba(0, 0, 0, 0.05)"
          />
          {/* Rotating placeholder overlay */}
          {!inputCode && canQuery && (
            <Box
              position="absolute"
              left={{ base: '20px', md: '24px' }}
              top="50%"
              transform="translateY(-50%)"
              pointerEvents="none"
              fontSize={{ base: 'md', md: 'md' }}
              fontWeight="500"
            >
              <RotatingPlaceholder />
            </Box>
          )}
        </Box>
        <Button
          py="20px"
          px={{ base: '16px', md: '20px' }}
          fontSize={{ base: 'sm', md: 'md' }}
          fontWeight="600"
          borderRadius="45px"
          w={{ base: '110px', md: '140px' }}
          h={{ base: '56px', md: '60px' }}
          bgGradient={
            !canQuery
              ? "linear(to-r, purple.600, purple.500)"
              : isTyping 
              ? "linear(to-r, red.600, red.500)" 
              : "linear(to-r, gray.800, gray.700)"
          }
          color="white"
          transition="all 0.25s cubic-bezier(0.4, 0, 0.2, 1)"
          boxShadow="0 4px 14px rgba(0, 0, 0, 0.25)"
          position="relative"
          overflow="hidden"
          _before={inputCode && canQuery ? {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%)',
            opacity: 0,
            animation: 'pulse 2s ease-in-out infinite'
          } : {}}
          sx={{
            '@keyframes pulse': {
              '0%, 100%': { opacity: 0 },
              '50%': { opacity: 0.4 }
            }
          }}
          _hover={{
            transform: !canQuery ? 'none' : 'translateY(-2px) scale(1.02)',
            boxShadow: !canQuery ? 'none' : '0 8px 24px rgba(0, 0, 0, 0.3)',
            bgGradient: !canQuery
              ? "linear(to-r, purple.700, purple.600)"
              : isTyping 
              ? "linear(to-r, red.700, red.600)" 
              : "linear(to-r, gray.900, gray.800)"
          }}
          _active={{
            transform: !canQuery ? 'none' : 'scale(0.98)',
          }}
          onClick={!canQuery ? handleUpgrade : (isTyping ? handleStopTyping : handleTranslate)}
          isLoading={loading}
          isDisabled={loading}
        >
          {!canQuery ? 'Upgrade' : (isTyping ? 'Stop' : "Let's Go!")}
        </Button>
        </Flex>
      </Flex>

      {/* Agent Workflow Visualization - Now shown inline in answer container */}
      {/* Commented out - workflow now shows inline during processing
      {showAgentWorkflow && (
        <Box
          mt={{ base: '32px', md: '48px' }}
          mb={{ base: '32px', md: '48px' }}
          w="100%"
          maxW="1000px"
          zIndex={10}
          opacity={1}
          transform="translateY(0)"
          transition="all 0.6s cubic-bezier(0.4, 0, 0.2, 1)"
          animation="fadeInUp 0.6s ease-out"
          sx={{
            '@keyframes fadeInUp': {
              '0%': { 
                opacity: 0, 
                transform: 'translateY(30px)' 
              },
              '100%': { 
                opacity: 1, 
                transform: 'translateY(0)' 
              }
            }
          }}
        >
          <Box
            position="relative"
            _before={{
              content: '""',
              position: 'absolute',
              top: '-10px',
              left: '-10px',
              right: '-10px',
              bottom: '-10px',
              bg: 'radial-gradient(circle at center, rgba(139, 92, 246, 0.15), transparent 70%)',
              borderRadius: '30px',
              filter: 'blur(20px)',
              animation: 'pulse 3s ease-in-out infinite',
              zIndex: -1
            }}
            sx={{
              '@keyframes pulse': {
                '0%, 100%': { opacity: 0.5 },
                '50%': { opacity: 1 }
              }
            }}
          >
            <AgentWorkflow
              steps={agentSteps}
              currentStep={currentAgentStep}
            />
          </Box>
        </Box>
      )}
      */}

      {/* Footer */}
      <Text 
        mt={{ base: '24px', md: '32px' }}
        mb={{ base: '32px', md: '40px' }}
        fontSize={{ base: 'xs', md: 'sm' }}
        textAlign="center" 
        color={gray} 
        zIndex={1}
        opacity={showMainUI ? 1 : 0}
        transform={showMainUI ? 'translateY(0)' : 'translateY(20px)'}
        transition="all 0.6s cubic-bezier(0.4, 0, 0.2, 1) 0.8s"
        px={{ base: '24px', md: '0' }}
        maxW="600px"
      >
        Fermat — helping you simplify your travel anywhere, anytime :)
      </Text>
    </Flex>
  );
}
