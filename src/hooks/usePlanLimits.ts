import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useOrg } from '../contexts/OrgContext';

export interface PlanLimits {
  contacts: number;
  emails_per_month: number;
  features: string[];
}

export const PLAN_CONFIG: Record<string, PlanLimits> = {
  free: {
    contacts: 50,
    emails_per_month: 500,
    features: ['Standard CRM', 'Standard Booking']
  },
  pro: {
    contacts: 5000,
    emails_per_month: 50000,
    features: ['Unlimited Contacts', 'AI Assistance', 'Marketing Automation']
  },
  enterprise: {
    contacts: 1000000,
    emails_per_month: 1000000,
    features: ['Everything', 'SLA Support', 'Custom Integration']
  }
};

export function usePlanLimits() {
  const { currentOrg } = useOrg();
  const [usage, setUsage] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentOrg) {
      fetchUsage();
    }
  }, [currentOrg]);

  const fetchUsage = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('organization_usage')
      .select('*')
      .eq('org_id', currentOrg?.id)
      .single();
    
    if (data) setUsage(data);
    setLoading(false);
  };

  const getLimits = () => {
    const plan = usage?.plan_name || 'free';
    return PLAN_CONFIG[plan] || PLAN_CONFIG.free;
  };

  const checkActionAllowed = (type: 'contacts' | 'emails') => {
    if (!usage) return { allowed: true }; // Defensive fallback

    const limits = getLimits();
    if (type === 'contacts') {
      const allowed = usage.contact_count < limits.contacts;
      return {
        allowed,
        current: usage.contact_count,
        limit: limits.contacts,
        message: allowed ? null : `Limit erreicht: Ihr ${usage.plan_name}-Plan erlaubt nur ${limits.contacts} Kontakte.`
      };
    }

    if (type === 'emails') {
      const allowed = usage.emails_sent_30d < limits.emails_per_month;
      return {
        allowed,
        current: usage.emails_sent_30d,
        limit: limits.emails_per_month,
        message: allowed ? null : `Limit erreicht: Ihr ${usage.plan_name}-Plan erlaubt nur ${limits.emails_per_month} E-Mails pro Monat.`
      };
    }

    return { allowed: true };
  };

  return {
    usage,
    limits: getLimits(),
    loading,
    checkActionAllowed,
    refreshUsage: fetchUsage
  };
}
