'use client';

import { getAddresses } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';

const useAddresses = () => {
  return useQuery({
    queryKey: ['addresses'],
    queryFn: () => getAddresses(),
  });
};

export default useAddresses;
