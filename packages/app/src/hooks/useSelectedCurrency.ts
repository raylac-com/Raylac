import { getSelectedCurrency } from '@/lib/currency';
import { useQuery } from '@tanstack/react-query';

const useSelectedCurrency = () => {
  return useQuery({
    queryKey: ['selectedCurrency'],
    queryFn: getSelectedCurrency,
  });
};

export default useSelectedCurrency;
