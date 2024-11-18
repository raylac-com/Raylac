import getAddressBalancesPerChain from './getAddressBalancesPerChain';

export const getTokenBalanceDetails = async ({
  userId,
  tokenId,
}: {
  userId: number;
  tokenId: string;
}) => {
  const addressBalancesPerChain = await getAddressBalancesPerChain({
    userId: userId,
  });

  const tokenBalancesPerChain = addressBalancesPerChain.filter(
    balance => balance.tokenId === tokenId
  );

  return tokenBalancesPerChain;
};
