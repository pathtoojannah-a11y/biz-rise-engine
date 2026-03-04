import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useWorkspace } from './useWorkspace';
import { useState, useMemo, useCallback } from 'react';
import type { Database } from '@/integrations/supabase/types';

type LeadStatus = Database['public']['Enums']['lead_status'];

export interface LeadFilters {
  search: string;
  status: LeadStatus | '';
  source: string;
  locationId: string;
  assignedTo: string;
  dateFrom: string;
  dateTo: string;
  sort: 'newest' | 'oldest' | 'status';
}

const PAGE_SIZE = 20;

const defaultFilters: LeadFilters = {
  search: '',
  status: '',
  source: '',
  locationId: '',
  assignedTo: '',
  dateFrom: '',
  dateTo: '',
  sort: 'newest',
};

export function useLeads() {
  const { workspace } = useWorkspace();
  const [page, setPage] = useState(0);
  const [filters, setFilters] = useState<LeadFilters>(defaultFilters);

  const updateFilter = useCallback(<K extends keyof LeadFilters>(key: K, value: LeadFilters[K]) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(0);
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(defaultFilters);
    setPage(0);
  }, []);

  const query = useQuery({
    queryKey: ['leads', workspace?.id, page, filters],
    queryFn: async () => {
      if (!workspace) return { data: [], count: 0 };

      let q = supabase
        .from('leads')
        .select('*, locations(name), profiles:assigned_to(full_name)', { count: 'exact' })
        .eq('workspace_id', workspace.id);

      if (filters.search) {
        q = q.or(`name.ilike.%${filters.search}%,phone.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
      }
      if (filters.status) q = q.eq('status', filters.status);
      if (filters.source) q = q.ilike('source', `%${filters.source}%`);
      if (filters.locationId) q = q.eq('location_id', filters.locationId);
      if (filters.assignedTo) q = q.eq('assigned_to', filters.assignedTo);
      if (filters.dateFrom) q = q.gte('created_at', filters.dateFrom);
      if (filters.dateTo) q = q.lte('created_at', filters.dateTo);

      switch (filters.sort) {
        case 'oldest': q = q.order('created_at', { ascending: true }); break;
        case 'status': q = q.order('status').order('created_at', { ascending: false }); break;
        default: q = q.order('created_at', { ascending: false });
      }

      q = q.range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

      const { data, error, count } = await q;
      if (error) throw error;
      return { data: data ?? [], count: count ?? 0 };
    },
    enabled: !!workspace,
  });

  const totalPages = useMemo(() => Math.ceil((query.data?.count ?? 0) / PAGE_SIZE), [query.data?.count]);

  return {
    leads: query.data?.data ?? [],
    totalCount: query.data?.count ?? 0,
    totalPages,
    page,
    setPage,
    filters,
    updateFilter,
    resetFilters,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
  };
}
