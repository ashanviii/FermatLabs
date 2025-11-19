'use client';
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { 
  getUserData, 
  createUserDocument, 
  incrementQueryCount, 
  canMakeQuery,
  upgradeToPro,
  type UserData 
} from '../lib/firebase';

interface UserContextType {
  userData: UserData | null;
  queriesRemaining: number;
  isPro: boolean;
  canQuery: boolean;
  loading: boolean;
  makeQuery: () => Promise<boolean>;
  refreshUserData: () => Promise<void>;
  upgradeUser: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const useUserContext = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUserContext must be used within a UserContextProvider');
  }
  return context;
};

interface UserContextProviderProps {
  children: ReactNode;
}

export const UserContextProvider: React.FC<UserContextProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [queriesRemaining, setQueriesRemaining] = useState<number>(5);
  const [isPro, setIsPro] = useState<boolean>(false);
  const [canQuery, setCanQuery] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(true);

  const refreshUserData = async () => {
    if (!user) {
      setUserData(null);
      setQueriesRemaining(5);
      setIsPro(false);
      setCanQuery(true);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Create user document if it doesn't exist
      await createUserDocument(user);
      
      // Get user data
      const data = await getUserData(user.uid);
      setUserData(data);
      
      // Check query limits
      const queryStatus = await canMakeQuery(user.uid);
      setCanQuery(queryStatus.canQuery);
      setQueriesRemaining(queryStatus.remaining);
      setIsPro(queryStatus.isPro);
    } catch (error) {
      console.error('Error refreshing user data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUserData();
  }, [user]);

  const makeQuery = async (): Promise<boolean> => {
    if (!user) return false;

    try {
      const queryStatus = await canMakeQuery(user.uid);
      
      if (!queryStatus.canQuery) {
        return false;
      }

      // Increment the query count
      await incrementQueryCount(user.uid);
      
      // Refresh user data to get updated counts
      await refreshUserData();
      
      return true;
    } catch (error) {
      console.error('Error making query:', error);
      return false;
    }
  };

  const upgradeUser = async (): Promise<void> => {
    if (!user) return;

    try {
      await upgradeToPro(user.uid);
      await refreshUserData();
    } catch (error) {
      console.error('Error upgrading user:', error);
      throw error;
    }
  };

  const value: UserContextType = {
    userData,
    queriesRemaining,
    isPro,
    canQuery,
    loading,
    makeQuery,
    refreshUserData,
    upgradeUser,
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};

