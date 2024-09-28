import * as Updates from 'expo-updates';
import { useEffect } from 'react';
import Constants from 'expo-constants';

const fetchUpdateAsync = async () => {
  const isExpoGo = Constants.appOwnership === 'expo';

  if (!isExpoGo) {
    const { isAvailable } = await Updates.checkForUpdateAsync();
    if (isAvailable) {
      await Updates.fetchUpdateAsync();
      await Updates.reloadAsync();
    }
  } else {
    console.log('Skipping update check in Expo Go');
  }
};

const useFetchUpdates = () => {
  useEffect(() => {
    fetchUpdateAsync();
  }, []);
};

export default useFetchUpdates;
