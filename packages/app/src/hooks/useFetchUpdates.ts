import * as Updates from 'expo-updates';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { useEffect, useState } from 'react';

const useFetchUpdates = () => {
  const [isFetchingUpdates, setIsFetchingUpdates] = useState(true);

  const isExpoGo = Constants.appOwnership === 'expo';

  useEffect(() => {
    (async () => {
      if (!isExpoGo && Device.isDevice) {
        const { isAvailable } = await Updates.checkForUpdateAsync();
        if (isAvailable) {
          await Updates.fetchUpdateAsync();
          await Updates.reloadAsync();
        }
      } else {
        // eslint-disable-next-line no-console
        console.log('Skipping update check in Expo Go');
      }

      setIsFetchingUpdates(false);
    })();
  }, []);

  return {
    isFetchingUpdates,
  };
};

export default useFetchUpdates;
