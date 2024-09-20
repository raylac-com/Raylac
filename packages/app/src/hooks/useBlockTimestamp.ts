import { useQuery } from '@tanstack/react-query';

const useBlockTimestamp = () => {
  return useQuery({
    queryKey: ['blockTimestamp'],
  });
};

export default useBlockTimestamp;
