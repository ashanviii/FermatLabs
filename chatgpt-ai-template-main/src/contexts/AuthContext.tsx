'use client';
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from 'firebase/auth';
import {
  onAuthStateChange,
  signInWithGoogle,
  signInWithEmail,
  signUpWithEmail,
  resetPassword,
  logOut,
} from '../lib/firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (name: string, email: string, password: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChange((user) => {
      setUser(user);
      setLoading(false);
      
      // Store user in localStorage for compatibility with existing code
      if (user) {
        const userInfo = {
          name: user.displayName,
          email: user.email,
          picture: user.photoURL,
          uid: user.uid
        };
        localStorage.setItem('fermat_user', JSON.stringify(userInfo));
      } else {
        localStorage.removeItem('fermat_user');
      }
    });

    return () => unsubscribe();
  }, []);

  const handleSignInWithGoogle = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    }
  };

  const handleSignInWithEmail = async (email: string, password: string) => {
    await signInWithEmail(email, password);
  };

  const handleSignUpWithEmail = async (name: string, email: string, password: string) => {
    const newUser = await signUpWithEmail(name, email, password);
    // The auth state listener stored the user before the name was set.
    localStorage.setItem(
      'fermat_user',
      JSON.stringify({ name, email: newUser.email, picture: newUser.photoURL, uid: newUser.uid })
    );
  };

  const handleLogOut = async () => {
    try {
      await logOut();
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    signInWithGoogle: handleSignInWithGoogle,
    signInWithEmail: handleSignInWithEmail,
    signUpWithEmail: handleSignUpWithEmail,
    resetPassword,
    logOut: handleLogOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};