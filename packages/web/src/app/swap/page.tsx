'use client';
import PageTitle from '@/components/PageTitle/PageTitle';
import SwapCard from '@/components/SwapCard/SwapCard';
import { trpc } from '@/lib/trpc';
import { ArrowLeftRight } from 'lucide-react';
import Image from 'next/image';
import { zeroAddress } from 'viem';
import { useAccount } from 'wagmi';

const SwapPage = () => {
  const { address } = useAccount();

  const { data: _stakedBalance } = trpc.getStakedBalance.useQuery({
    address: address || zeroAddress,
  });

  const { data: ethMultiChainBalance } = trpc.getETHBalance.useQuery(
    {
      address: address || zeroAddress,
    },
    {
      enabled: !!address,
    }
  );

  if (!ethMultiChainBalance) {
    return <div></div>;
  }

  return (
    <div className="flex flex-col items-center">
      <PageTitle className="flex flex-row gap-x-[10px] items-center">
        Swap
        <div className="flex flex-row gap-x-[6px] items-center">
          <Image src="/eth.png" alt="eth-logo" width={24} height={24} />
          <ArrowLeftRight
            className="w-[24px] h-[24px]"
            width={24}
            height={24}
          />
          <Image
            src="/wsteth.svg"
            alt="wsteth-logo"
            className="w-[24px] h-[24px]"
            width={24}
            height={24}
          />
        </div>
      </PageTitle>
      <div className="flex flex-col gap-y-[16px] items-center justify-center overflow-scroll px-[16px]">
        {ethMultiChainBalance.balances.map((balance, i) => (
          <SwapCard
            chainId={balance.chain}
            key={i}
            balance={BigInt(balance.balance)}
            balanceFormatted={balance.balanceFormatted}
            balanceUsd={balance.balanceUsd}
          />
        ))}
      </div>
    </div>
  );
};

export default SwapPage;
