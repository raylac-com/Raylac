import { useMutation } from '@tanstack/react-query';
import { CloudStorage, CloudStorageScope } from 'react-native-cloud-storage';

const writeToCloud = async (recoveryPhrase: string) => {
  await CloudStorage.writeFile(
    '/recoveryPhrase.txt',
    recoveryPhrase,
    CloudStorageScope.AppData
  );
  console.log('Successfully wrote file to cloud');
};

const useBackupRecoveryPhraseToCloud = () => {
  return useMutation({
    mutationFn: async ({ recoveryPhrase }: { recoveryPhrase: string }) => {
      await writeToCloud(recoveryPhrase);
    },
  });
};

export default useBackupRecoveryPhraseToCloud;
