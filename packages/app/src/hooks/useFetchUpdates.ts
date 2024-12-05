import * as Updates from 'expo-updates';
import * as Device from 'expo-device';
import { useEffect, useState } from 'react';

const useFetchUpdates = () => {
  const [isFetchingUpdates, setIsFetchingUpdates] = useState(true);

  useEffect(() => {
    (async () => {
      if (Device.isDevice) {
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
  }, [setIsFetchingUpdates]);

  return {
    isFetchingUpdates,
  };
};

export default useFetchUpdates;
