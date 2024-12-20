'use client';
import { trpc } from '@/lib/trpc';
import { getChainIcon } from '@/lib/utils';
import Image from 'next/image';
import { Hex } from 'viem';
import { useAccount } from 'wagmi';
import BackButton from '@/components/BackButton/BackButton';

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
  formattedTotalBalance: string;
  totalBalanceUsd: string;
}

const TotalBalanceCard = ({
  formattedTotalBalance,
  totalBalanceUsd,
}: TotalBalanceCardProps) => {
  return (
    <div className="flex flex-col w-full bg-bg2 rounded-[16px] px-[28px] pt-[26px] pb-[22px] gap-y-[55px]">
      <div className="flex flex-col gap-y-[6px]">
        <div className="text-2lg">{formattedTotalBalance} ETH</div>
        <div className="text-border">${totalBalanceUsd}</div>
      </div>
      <div className="flex flex-row justify-between">
        <div className="flex flex-row gap-x-[6px] items-center">
          <Image src="/eth.png" alt="ETH" width={24} height={24} />
          <div className="text-border">Staked ETH</div>
        </div>
        <div className="text-border">APY 2.3%</div>
      </div>
    </div>
  );
};

const BalanceDetailsPage = () => {
  const { address } = useAccount();

  const { data: ethBalance } = trpc.getETHBalance.useQuery(
    {
      address: address as Hex,
    },
    {
      enabled: !!address,
    }
  );

  if (!ethBalance) {
    return null;
  }

  return (
    <div className="flex flex-col items-center justify-center w-[350px] gap-y-[55px]">
      <BackButton />
      <TotalBalanceCard
        formattedTotalBalance={ethBalance.formattedTotalBalance}
        totalBalanceUsd={ethBalance.totalBalanceUsd}
      />
      <div className="flex flex-col items-center justify-center border-[1px] border-border rounded-[16px] p-[16px] w-full">
        {ethBalance.balances.map((balance, i) => (
          <ChainBalanceListItem
            chainId={balance.chain}
            balanceFormatted={balance.balanceFormatted}
            balanceUsd={balance.balanceUsd}
            key={i}
            isLast={i === ethBalance.balances.length - 1}
          />
        ))}
      </div>
    </div>
  );
};

export default BalanceDetailsPage;
