// Fallback query limit system using localStorage
// This works without Firestore for immediate testing

const FREE_QUERY_LIMIT = 5;
const STORAGE_KEY = 'fermat_query_tracking';

interface LocalUserData {
  queryCount: number;
  isPro: boolean;
  lastReset: string; // ISO date string
}

// Helper function to get today's date as YYYY-MM-DD
const getTodayDateString = (): string => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

// Helper function to check if reset is needed
const needsDailyReset = (lastReset: string): boolean => {
  const today = getTodayDateString();
  return lastReset !== today;
};

export const getLocalUserData = (userId: string): LocalUserData => {
  if (typeof window === 'undefined') {
    return { queryCount: 0, isPro: false, lastReset: getTodayDateString() };
  }

  try {
    const stored = localStorage.getItem(`${STORAGE_KEY}_${userId}`);
    if (stored) {
      const data = JSON.parse(stored);
      
      // Check if we need to reset for a new day
      if (needsDailyReset(data.lastReset)) {
        console.log('[LocalStorage] New day detected, resetting query count');
        const resetData = {
          ...data,
          queryCount: 0,
          lastReset: getTodayDateString(),
        };
        setLocalUserData(userId, resetData);
        return resetData;
      }
      
      return data;
    }
  } catch (error) {
    console.error('[LocalStorage] Error reading data:', error);
  }

  return { queryCount: 0, isPro: false, lastReset: getTodayDateString() };
};

export const setLocalUserData = (userId: string, data: LocalUserData): void => {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(`${STORAGE_KEY}_${userId}`, JSON.stringify(data));
  } catch (error) {
    console.error('[LocalStorage] Error saving data:', error);
  }
};

export const incrementLocalQueryCount = (userId: string): number => {
  const data = getLocalUserData(userId);
  data.queryCount += 1;
  setLocalUserData(userId, data);
  console.log('[LocalStorage] Query count incremented to:', data.queryCount);
  return data.queryCount;
};

export const canMakeLocalQuery = (userId: string): { canQuery: boolean; remaining: number; isPro: boolean } => {
  const data = getLocalUserData(userId);

  if (data.isPro) {
    return { canQuery: true, remaining: -1, isPro: true };
  }

  const remaining = FREE_QUERY_LIMIT - data.queryCount;
  const canQuery = remaining > 0;

  return { canQuery, remaining, isPro: false };
};

export const upgradeLocalToPro = (userId: string): void => {
  const data = getLocalUserData(userId);
  data.isPro = true;
  setLocalUserData(userId, data);
  console.log('[LocalStorage] User upgraded to Pro');
};

export const resetLocalQueryCount = (userId: string): void => {
  const data = getLocalUserData(userId);
  data.queryCount = 0;
  data.lastReset = getTodayDateString();
  setLocalUserData(userId, data);
  console.log('[LocalStorage] Query count reset');
};
