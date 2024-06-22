import { generatePrivateKey } from 'viem/accounts';

const useSignUp = () => {
  const signUp = () => {
    const privKey = generatePrivateKey();
  };

  return { signUp };
};

export default useSignUp;
