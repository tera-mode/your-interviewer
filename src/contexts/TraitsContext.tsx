'use client';

import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { UserTrait, TraitCategory, TRAIT_CATEGORY_LABELS } from '@/types';
import { authenticatedFetch } from '@/lib/api/authenticatedFetch';

interface TraitsContextType {
  traits: UserTrait[];
  isLoading: boolean;
  refreshTraits: () => Promise<void>;
  deleteTrait: (traitLabel: string) => Promise<void>;
  traitCount: number;
  categoryBreakdown: { key: string; label: string; count: number }[];
}

const TraitsContext = createContext<TraitsContextType>({
  traits: [],
  isLoading: true,
  refreshTraits: async () => {},
  deleteTrait: async () => {},
  traitCount: 0,
  categoryBreakdown: [],
});

export const useTraits = () => useContext(TraitsContext);

export const TraitsProvider = ({ children }: { children: React.ReactNode }) => {
  const { user, loading: authLoading } = useAuth();
  const [traits, setTraits] = useState<UserTrait[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTraits = useCallback(async () => {
    if (!user) {
      setTraits([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/get-user-interviews?userId=${user.uid}`);
      if (!response.ok) throw new Error('Failed to fetch interviews');

      const data = await response.json();
      const allTraits: UserTrait[] = [];

      data.interviews?.forEach((interview: { traits?: UserTrait[] }) => {
        if (interview.traits) {
          allTraits.push(...interview.traits);
        }
      });

      // Deduplicate by label, keep the newest
      const uniqueTraits = allTraits.reduce((acc: UserTrait[], trait) => {
        const existingIndex = acc.findIndex((t) => t.label === trait.label);
        if (existingIndex === -1) {
          acc.push(trait);
        } else {
          const existing = acc[existingIndex];
          if (new Date(trait.extractedAt) > new Date(existing.extractedAt)) {
            acc[existingIndex] = trait;
          }
        }
        return acc;
      }, []);

      uniqueTraits.sort((a, b) => b.confidence - a.confidence);
      setTraits(uniqueTraits);
    } catch (error) {
      console.error('Error fetching traits:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading) {
      fetchTraits();
    }
  }, [authLoading, fetchTraits]);

  const deleteTrait = useCallback(async (traitLabel: string) => {
    try {
      const response = await authenticatedFetch('/api/delete-trait', {
        method: 'POST',
        body: JSON.stringify({ traitLabel }),
      });

      if (!response.ok) throw new Error('Failed to delete trait');

      setTraits((prev) => prev.filter((t) => t.label !== traitLabel));
    } catch (error) {
      console.error('Error deleting trait:', error);
      throw error;
    }
  }, []);

  const categoryBreakdown = Object.entries(TRAIT_CATEGORY_LABELS).map(([key, label]) => ({
    key,
    label,
    count: traits.filter((t) => t.category === key).length,
  }));

  return (
    <TraitsContext.Provider
      value={{
        traits,
        isLoading,
        refreshTraits: fetchTraits,
        deleteTrait,
        traitCount: traits.length,
        categoryBreakdown,
      }}
    >
      {children}
    </TraitsContext.Provider>
  );
};
