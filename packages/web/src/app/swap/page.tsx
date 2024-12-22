'use client';
import PageTitle from '@/components/PageTitle/PageTitle';
import Separator from '@/components/Separator';
import SwapCard from '@/components/SwapCard/SwapCard';
import { trpc } from '@/lib/trpc';
import { getTokenLogoURI } from '@/lib/utils';
import { ETH, Token } from '@raylac/shared';
import { WST_ETH } from '@raylac/shared';
import { ArrowLeftRight, Wallet } from 'lucide-react';
import Image from 'next/image';
import { zeroAddress } from 'viem';
import { useAccount } from 'wagmi';

const BalanceCard = ({
  token,
  balanceFormatted,
  balanceUsd,
  apy,
}: {
  token: Token;
  balanceFormatted: string | undefined;
  balanceUsd: string | undefined;
  apy?: number;
}) => {
  return (
    <div className="flex flex-row items-center justify-between w-full p-[16px]">
      <div className="flex flex-col gap-y-[6px]">
        <div className="flex flex-row items-center gap-x-[6px]">
          <Image
            src={getTokenLogoURI(token)}
            alt={token.name}
            width={24}
            height={24}
          />
          <div>{token.symbol === 'ETH' ? 'ETH' : 'Staked ETH'}</div>
        </div>
        <div className="text-border">APR {apy ? `${apy}%` : ''}</div>
      </div>
      <div className="flex flex-col items-end gap-y-[2px]">
        <div className="text-lg">
          {balanceFormatted} {token.symbol}
        </div>
        <div className="text-border">${balanceUsd}</div>
      </div>
    </div>
  );
};

const SwapPage = () => {
  const { address } = useAccount();

  const { data: lidoApy } = trpc.getLidoApy.useQuery();

  const { data: stakedBalance } = trpc.getStakedBalance.useQuery({
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
    <div className="flex flex-col items-center w-[420px] pb-[220px]">
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
      <div className="flex flex-col gap-y-[8px] items-center justify-center w-full">
        <div className="flex flex-row gap-x-[6px] items-center w-full">
          <Wallet className="w-[20px] h-[20px] text-border" />
          <div className="text-border">Balance</div>
        </div>
        <div className="w-full flex flex-col border-[1px] border-border rounded-[16px]">
          <BalanceCard
            token={WST_ETH}
            balanceFormatted={stakedBalance?.totalBalanceFormatted}
            balanceUsd={stakedBalance?.totalBalanceUsd}
            apy={lidoApy}
          />
          <Separator />
          <BalanceCard
            token={ETH}
            balanceFormatted={ethMultiChainBalance?.totalBalanceFormatted}
            balanceUsd={ethMultiChainBalance?.totalBalanceUsd}
          />
        </div>
      </div>
      <div className="mt-[32px] flex flex-col gap-y-[8px] items-center justify-center w-full">
        <div className="flex flex-row gap-x-[6px] items-center w-full">
          <ArrowLeftRight className="w-[20px] h-[20px] text-border" />
          <div className="text-border">Swap</div>
        </div>
        <div className="flex flex-col gap-y-[16px] items-center justify-center w-full">
          {ethMultiChainBalance.balances.map((balance, i) => (
            <SwapCard
              chainId={balance.chain}
              key={i}
              fromToken={ETH}
              toToken={WST_ETH}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default SwapPage;
