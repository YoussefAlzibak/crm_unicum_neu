import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

interface Organization {
  id: string;
  name: string;
  slug: string;
  branding: any;
}

interface OrgContextType {
  user: User | null;
  profile: any | null;
  currentOrg: Organization | null;
  organizations: Organization[];
  isLoading: boolean;
  setOrganization: (org: Organization) => void;
  signOut: () => Promise<void>;
}

const OrgContext = createContext<OrgContextType | undefined>(undefined);

export const OrgProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [currentOrg, setCurrentOrg] = useState<Organization | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initial Session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfileAndOrgs(session.user.id);
      } else {
        setIsLoading(false);
      }
    });

    // Auth Listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const newUser = session?.user ?? null;
      setUser(newUser);
      if (newUser) {
        fetchProfileAndOrgs(newUser.id);
      } else {
        setProfile(null);
        setOrganizations([]);
        setCurrentOrg(null);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfileAndOrgs = async (userId: string) => {
    try {
      setIsLoading(true);
      
      // 1. Fetch Profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (profileData) setProfile(profileData);

      // 2. Fetch Organizations via memberships
      const { data: orgsData } = await supabase
        .from('org_members')
        .select('organizations (*)')
        .eq('user_id', userId);

      if (orgsData) {
        const orgList = orgsData.map((m: any) => m.organizations);
        setOrganizations(orgList);
        
        // Auto-select first org if none selected
        if (orgList.length > 0 && !currentOrg) {
          setCurrentOrg(orgList[0]);
        }
      }
    } catch (err) {
      console.error('Error fetching org data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const setOrganization = (org: Organization) => {
    setCurrentOrg(org);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <OrgContext.Provider value={{ 
      user, 
      profile, 
      currentOrg, 
      organizations, 
      isLoading, 
      setOrganization,
      signOut 
    }}>
      {children}
    </OrgContext.Provider>
  );
};

export const useOrg = () => {
  const context = useContext(OrgContext);
  if (context === undefined) {
    throw new Error('useOrg must be used within an OrgProvider');
  }
  return context;
};
