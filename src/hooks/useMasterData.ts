import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-client';

// Types
interface Branch {
  id: string;
  name: string;
  code: string;
}

interface SalesAgent {
  id: string;
  agent_number: string;
  name: string | null;
  branch_id: string;
  is_active: boolean;
}

interface Country {
  id: string;
  name: string;
  code: string;
}

interface Platform {
  id: string;
  name: string;
  code: string;
  is_active: boolean | null;
}

interface MediaBuyer {
  id: string;
  name: string;
  email: string;
  branch_id: string;
}

// API functions with error handling and performance optimization
const fetchBranches = async (): Promise<Branch[]> => {
  const response = await fetch('/api/master-data/branches', {
    headers: {
      'Cache-Control': 'public, max-age=300', // 5 minutes browser cache
    },
  });
  if (!response.ok) throw new Error('Failed to fetch branches');
  const data = await response.json();
  return data.success ? data.data : [];
};

const fetchSalesAgents = async (): Promise<SalesAgent[]> => {
  const response = await fetch('/api/master-data/agents', {
    headers: {
      'Cache-Control': 'public, max-age=300',
    },
  });
  if (!response.ok) throw new Error('Failed to fetch sales agents');
  const data = await response.json();
  return data.success ? data.data : [];
};

const fetchTargetCountries = async (): Promise<Country[]> => {
  const response = await fetch('/api/master-data/target-countries', {
    headers: {
      'Cache-Control': 'public, max-age=600', // 10 minutes - changes rarely
    },
  });
  if (!response.ok) throw new Error('Failed to fetch target countries');
  const data = await response.json();
  return data.success ? data.data : [];
};

const fetchDestinationCountries = async (): Promise<Country[]> => {
  const response = await fetch('/api/master-data/destination-countries', {
    headers: {
      'Cache-Control': 'public, max-age=600',
    },
  });
  if (!response.ok) throw new Error('Failed to fetch destination countries');
  const data = await response.json();
  return data.success ? data.data : [];
};

const fetchPlatforms = async (): Promise<Platform[]> => {
  const response = await fetch('/api/master-data/platforms', {
    headers: {
      'Cache-Control': 'public, max-age=600',
    },
  });
  if (!response.ok) throw new Error('Failed to fetch platforms');
  const data = await response.json();
  return data.success ? data.data : [];
};

const fetchMediaBuyers = async (): Promise<MediaBuyer[]> => {
  const response = await fetch('/api/master-data/media-buyers', {
    headers: {
      'Cache-Control': 'public, max-age=300',
    },
  });
  if (!response.ok) throw new Error('Failed to fetch media buyers');
  const data = await response.json();
  return data.success ? data.data : [];
};

// Custom hooks with optimized caching
export function useBranches() {
  return useQuery({
    queryKey: queryKeys.branches(),
    queryFn: fetchBranches,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
}

export function useSalesAgents() {
  return useQuery({
    queryKey: queryKeys.salesAgents(),
    queryFn: fetchSalesAgents,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 20 * 60 * 1000, // 20 minutes
  });
}

export function useTargetCountries() {
  return useQuery({
    queryKey: queryKeys.targetCountries(),
    queryFn: fetchTargetCountries,
    staleTime: 30 * 60 * 1000, // 30 minutes - rarely changes
    gcTime: 60 * 60 * 1000, // 1 hour
  });
}

export function useDestinationCountries() {
  return useQuery({
    queryKey: queryKeys.destinationCountries(),
    queryFn: fetchDestinationCountries,
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  });
}

export function usePlatforms() {
  return useQuery({
    queryKey: queryKeys.platforms(),
    queryFn: fetchPlatforms,
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  });
}

export function useMediaBuyers() {
  return useQuery({
    queryKey: queryKeys.mediaBuyers(),
    queryFn: fetchMediaBuyers,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}

// Combined hook for all master data with parallel fetching
export function useMasterData() {
  const branches = useBranches();
  const salesAgents = useSalesAgents();
  const targetCountries = useTargetCountries();
  const destinationCountries = useDestinationCountries();
  const platforms = usePlatforms();
  const mediaBuyers = useMediaBuyers();

  return {
    branches: branches.data || [],
    salesAgents: salesAgents.data || [],
    targetCountries: targetCountries.data || [],
    destinationCountries: destinationCountries.data || [],
    platforms: platforms.data || [],
    mediaBuyers: mediaBuyers.data || [],
    isLoading: branches.isLoading || salesAgents.isLoading || 
               targetCountries.isLoading || destinationCountries.isLoading || 
               platforms.isLoading || mediaBuyers.isLoading,
    isError: branches.isError || salesAgents.isError || 
             targetCountries.isError || destinationCountries.isError || 
             platforms.isError || mediaBuyers.isError,
    errors: {
      branches: branches.error,
      salesAgents: salesAgents.error,
      targetCountries: targetCountries.error,
      destinationCountries: destinationCountries.error,
      platforms: platforms.error,
      mediaBuyers: mediaBuyers.error,
    }
  };
}