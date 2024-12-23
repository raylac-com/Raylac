'use client';
import { getChainIcon, getTokenLogoURI, shortenAddress } from '@/lib/utils';
import Image from 'next/image';
import BackButton from '@/components/BackButton/BackButton';
import { use } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { KNOWN_TOKENS, Token } from '@raylac/shared';
import useTokenBalance from '@/hooks/useTokenBalance';

interface ChainBalanceListItemProps {
  chainId: number;
  balanceFormatted: string;
  balanceUsd: string;
  isLast: boolean;
  token: Token;
}

const ChainBalanceListItem = ({
  chainId,
  balanceFormatted,
  balanceUsd,
  isLast,
  token,
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
        <div className="text-border">
          {balanceFormatted} {token.symbol}
        </div>
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
  params: Promise<{ tokenSymbol: string }>;
}) => {
  const params = use(paramsPromise);
  const tokenSymbol = params.tokenSymbol;

  const token = KNOWN_TOKENS.find(t => t.symbol === tokenSymbol);

  const tokenBalance = useTokenBalance({
    token: token,
  });

  if (!token) {
    return null;
  }

  return (
    <div className="flex flex-col items-center justify-center w-[350px] gap-y-[55px]">
      <BackButton />
      <TotalBalanceCard
        totalBalanceFormatted={tokenBalance?.totalBalanceFormatted ?? ''}
        totalBalanceUsd={tokenBalance?.totalBalanceUsdFormatted ?? ''}
        token={token}
      />
      {tokenBalance?.addressBalances.map((balance, index) => (
        <div className="flex flex-col gap-y-[8px] w-full" key={index}>
          {balance.chainBalances?.length ? (
            <div className="text-border">{shortenAddress(balance.address)}</div>
          ) : (
            <></>
          )}
          {balance.chainBalances && balance.chainBalances.length > 0 && (
            <div className="flex flex-col items-center justify-center border-[1px] border-border rounded-[16px] px-[16px] w-full">
              {balance.chainBalances.map((chainBalance, index) => (
                <ChainBalanceListItem
                  key={index}
                  chainId={chainBalance.chain}
                  balanceFormatted={chainBalance.balanceFormatted}
                  balanceUsd={chainBalance.balanceUsd}
                  isLast={index === (balance.chainBalances?.length ?? 0) - 1}
                  token={token}
                />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default BalanceDetailsPage;
