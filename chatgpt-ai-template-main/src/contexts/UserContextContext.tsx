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
import {
  getLocalUserData,
  incrementLocalQueryCount,
  canMakeLocalQuery,
  upgradeLocalToPro,
} from '../lib/queryLimitLocalStorage';

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
  const [useFirestore, setUseFirestore] = useState<boolean>(true);

  const refreshUserData = async () => {
    if (!user) {
      console.log('[UserContext] No user, resetting to defaults');
      setUserData(null);
      setQueriesRemaining(5);
      setIsPro(false);
      setCanQuery(true);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('[UserContext] Refreshing data for user:', user.uid);
      
      // Try Firestore first
      try {
        await createUserDocument(user);
        const data = await getUserData(user.uid);
        
        if (data) {
          console.log('[UserContext] Using Firestore data:', data);
          setUserData(data);
          const queryStatus = await canMakeQuery(user.uid);
          console.log('[UserContext] Query status from Firestore:', queryStatus);
          setCanQuery(queryStatus.canQuery);
          setQueriesRemaining(queryStatus.remaining);
          setIsPro(queryStatus.isPro);
          setUseFirestore(true);
          return;
        }
      } catch (firestoreError) {
        console.warn('[UserContext] Firestore error, falling back to localStorage:', firestoreError);
        setUseFirestore(false);
      }
      
      // Fallback to localStorage
      console.log('[UserContext] Using localStorage fallback');
      const localData = getLocalUserData(user.uid);
      const queryStatus = canMakeLocalQuery(user.uid);
      console.log('[UserContext] Local data:', { localData, queryStatus });
      
      setCanQuery(queryStatus.canQuery);
      setQueriesRemaining(queryStatus.remaining);
      setIsPro(queryStatus.isPro);
      setUseFirestore(false);
      
    } catch (error) {
      console.error('[UserContext] Error refreshing user data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUserData();
  }, [user]);

  const makeQuery = async (): Promise<boolean> => {
    if (!user) {
      console.log('[UserContext] makeQuery: No user logged in');
      return false;
    }

    try {
      console.log('[UserContext] makeQuery: Using', useFirestore ? 'Firestore' : 'localStorage');
      
      if (useFirestore) {
        // Try Firestore
        try {
          console.log('[UserContext] makeQuery: Checking if user can query...');
          const queryStatus = await canMakeQuery(user.uid);
          console.log('[UserContext] makeQuery: Query status:', queryStatus);
          
          if (!queryStatus.canQuery) {
            console.log('[UserContext] makeQuery: User cannot make query');
            return false;
          }

          console.log('[UserContext] makeQuery: Incrementing query count...');
          await incrementQueryCount(user.uid);
          console.log('[UserContext] makeQuery: Query count incremented successfully');
          
          await refreshUserData();
          return true;
        } catch (firestoreError) {
          console.warn('[UserContext] Firestore error in makeQuery, using localStorage:', firestoreError);
          setUseFirestore(false);
          // Fall through to localStorage
        }
      }
      
      // Use localStorage
      const queryStatus = canMakeLocalQuery(user.uid);
      if (!queryStatus.canQuery) {
        console.log('[UserContext] makeQuery (localStorage): User cannot make query');
        return false;
      }
      
      const newCount = incrementLocalQueryCount(user.uid);
      console.log('[UserContext] makeQuery (localStorage): Count incremented to', newCount);
      
      // Update state immediately
      const newStatus = canMakeLocalQuery(user.uid);
      setQueriesRemaining(newStatus.remaining);
      setCanQuery(newStatus.canQuery);
      
      return true;
    } catch (error) {
      console.error('[UserContext] makeQuery: Error:', error);
      return false;
    }
  };

  const upgradeUser = async (): Promise<void> => {
    if (!user) return;

    try {
      if (useFirestore) {
        await upgradeToPro(user.uid);
      } else {
        upgradeLocalToPro(user.uid);
      }
      await refreshUserData();
    } catch (error) {
      console.error('[UserContext] Error upgrading user:', error);
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

