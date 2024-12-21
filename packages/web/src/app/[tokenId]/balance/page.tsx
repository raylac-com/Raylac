'use client';
import { trpc } from '@/lib/trpc';
import { getChainIcon, getTokenLogoURI } from '@/lib/utils';
import Image from 'next/image';
import { Hex } from 'viem';
import { useAccount } from 'wagmi';
import BackButton from '@/components/BackButton/BackButton';
import { useEffect } from 'react';
import { use } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { ETH, Token, WST_ETH } from '@raylac/shared';

interface ChainBalanceListItemProps {
  chainId: number;
  balanceFormatted: string;
  balanceUsd: string;
  isLast: boolean;
}

const ChainBalanceListItem = ({
  chainId,
  balanceFormatted,
  balanceUsd,
  isLast,
}: ChainBalanceListItemProps) => {
  return (
    <div
      className={`flex flex-row items-center justify-between  border-border py-[16px] w-full ${
        !isLast ? 'border-b-[1px]' : ''
      }`}
    >
      <div className="flex flex-row items-center justify-center gap-x-[4px]">
        <Image
          src={getChainIcon(chainId)}
          alt={chainId.toString()}
          width={24}
          height={24}
        />
        <div className="text-border">{balanceFormatted} ETH</div>
      </div>
      <div>${balanceUsd}</div>
    </div>
  );
};

interface TotalBalanceCardProps {
  totalBalanceFormatted?: string;
  totalBalanceUsd?: string;
  token: Token;
}

const TotalBalanceCard = ({
  totalBalanceFormatted,
  totalBalanceUsd,
  token,
}: TotalBalanceCardProps) => {
  return (
    <div className="flex flex-col w-full bg-bg2 rounded-[16px] px-[28px] pt-[26px] pb-[22px] gap-y-[55px]">
      <div className="flex flex-col gap-y-[6px]">
        <div className="text-2lg">
          {totalBalanceFormatted ? (
            `${totalBalanceFormatted} ${token.symbol}`
          ) : (
            <Skeleton className="h-[39px] w-[200px] rounded-[8px]" />
          )}
        </div>
        <div className="text-border">
          {totalBalanceUsd ? (
            `$${totalBalanceUsd}`
          ) : (
            <Skeleton className="h-[24px] w-[100px] rounded-[8px]" />
          )}
        </div>
      </div>
      <div className="flex flex-row justify-between">
        <div className="flex flex-row gap-x-[6px] items-center">
          <Image
            src={getTokenLogoURI(token)}
            alt={token.symbol}
            width={24}
            height={24}
          />
          <div className="text-border">{token.name}</div>
        </div>
      </div>
    </div>
  );
};

const BalanceDetailsPage = ({
  params: paramsPromise,
}: {
  params: Promise<{ tokenId: string }>;
}) => {
  const { address } = useAccount();

  const { data: ethBalance } = trpc.getETHBalance.useQuery(
    {
      address: address as Hex,
    },
    {
      enabled: !!address,
    }
  );

  const { data: stakedEthBalance } = trpc.getStakedBalance.useQuery(
    {
      address: address as Hex,
    },
    {
      enabled: !!address,
    }
  );

  const params = use(paramsPromise);
  const tokenId = params.tokenId;

  useEffect(() => {
    if (tokenId !== 'eth' && tokenId !== 'wsteth') {
      throw new Error(`Unknown tokenId: ${tokenId}`);
    }
  }, [tokenId]);

  const balances =
    tokenId === 'eth' ? ethBalance?.balances : stakedEthBalance?.balances;

  return (
    <div className="flex flex-col items-center justify-center w-[350px] gap-y-[55px]">
      <BackButton />
      <TotalBalanceCard
        totalBalanceFormatted={stakedEthBalance?.totalBalanceFormatted ?? ''}
        totalBalanceUsd={stakedEthBalance?.totalBalanceUsd ?? ''}
        token={tokenId === 'wsteth' ? WST_ETH : ETH}
      />
      <div className="flex flex-col items-center justify-center border-[1px] border-border rounded-[16px] p-[16px] w-full">
        {balances?.map((balance, i) => (
          <ChainBalanceListItem
            chainId={balance.chain}
            balanceFormatted={balance.balanceFormatted}
            balanceUsd={balance.balanceUsd}
            key={i}
            isLast={i === balances.length - 1}
          />
        ))}
      </div>
    </div>
  );
};

export default BalanceDetailsPage;
