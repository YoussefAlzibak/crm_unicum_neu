import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useOrg } from '../contexts/OrgContext';

export function usePrimaryOrg() {
  const { currentOrg } = useOrg();
  const [primarySlug, setPrimarySlug] = useState<string | null>(currentOrg?.slug || null);
  const [loading, setLoading] = useState(!currentOrg);

  useEffect(() => {
    if (currentOrg) {
      setPrimarySlug(currentOrg.slug);
      setLoading(false);
      return;
    }

    const fetchFirstOrg = async () => {
      try {
        const { data } = await supabase
          .from('organizations')
          .select('slug')
          .limit(1)
          .maybeSingle();

        if (data) {
          setPrimarySlug(data.slug);
        }
      } catch (err) {
        console.error('Error fetching primary org:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchFirstOrg();
  }, [currentOrg]);

  return { primarySlug, loading };
}
