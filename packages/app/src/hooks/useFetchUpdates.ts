import * as Updates from 'expo-updates';
import Constants from 'expo-constants';
import { useQuery } from '@tanstack/react-query';

const fetchUpdateAsync = async () => {
  const isExpoGo = Constants.appOwnership === 'expo';

  if (!isExpoGo) {
    const { isAvailable } = await Updates.checkForUpdateAsync();
    if (isAvailable) {
      await Updates.fetchUpdateAsync();
      await Updates.reloadAsync();
    }
  } else {
    // eslint-disable-next-line no-console
    console.log('Skipping update check in Expo Go');
  }

  return null;
};

const useFetchUpdates = () => {
  return useQuery({
    queryKey: ['fetchUpdates'],
    queryFn: fetchUpdateAsync,
  });
};

export default useFetchUpdates;
