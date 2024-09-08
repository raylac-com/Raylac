import { trpc } from '@/lib/trpc';
import useDebounce from './useDebounce';

const useCheckUsername = (username: string) => {
  const { debouncedValue: debouncedUsername, isPending } = useDebounce(
    username,
    500
  );

  const { data: isUsernameAvailable, isPending: isCheckingUsername } =
    trpc.isUsernameAvailable.useQuery({
      username: debouncedUsername,
    });

  return {
    isUsernameAvailable,
    isCheckingUsername: isPending || isCheckingUsername,
  };
};

export default useCheckUsername;
