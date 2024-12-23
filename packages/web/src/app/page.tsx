'use client';
import { trpc } from '@/lib/trpc';
import { TokenSet } from '@raylac/shared';
import { Token } from '@raylac/shared';
import { Wallet } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { zeroAddress } from 'viem';
import { useAccount } from 'wagmi';
import { PieChart, Pie, Cell, Label } from 'recharts';
import Image from 'next/image';
import { getTokenLogoURI } from '@/lib/utils';
import Separator from '@/components/Separator';
import { useState } from 'react';

const BalanceChart = ({
  setBalances,
}: {
  setBalances: {
    totalBalanceUsd: number;
    totalBalanceUsdFormatted: string;
    balances: {
      totalBalanceUsd: string;
      totalBalanceUsdFormatted: string;
      token: Token;
      balances: {
        balance: string;
        balanceFormatted: string;
        balanceUsd: string;
        chain: number;
      }[];
    }[];
  };
}) => {
  const data = setBalances.balances.map(balance => ({
    name: balance.token.symbol,
    value: Number(balance.totalBalanceUsd),
    color: balance.token.color,
  }));

  return (
    <PieChart width={450} height={280}>
      <Pie
        isAnimationActive
        animationDuration={1000}
        data={data}
        innerRadius={70}
        outerRadius={90}
        fill="#8884d8"
        paddingAngle={3}
        dataKey="value"
        activeIndex={0}
      >
        {data.map((entry, index) => (
          <Cell key={`cell-${index}`} fill={entry.color} />
        ))}
        <Label
          value={`$${setBalances.totalBalanceUsdFormatted}`}
          position="center"
          fontSize={16}
          fill="white"
          className="text-lg font-bold"
        />
      </Pie>
      <text x={210} y={270} textAnchor="middle" fill="white">
        {data.map((entry, index) => (
          <tspan key={index} x={160 + index * 85} y={270}>
            <tspan fill={entry.color}>■</tspan>
            <tspan fill="white">{` ${entry.name}`}</tspan>
          </tspan>
        ))}
      </text>
    </PieChart>
  );
};

interface BalanceListItemProps {
  token: Token;
  balanceFormatted: string;
  balanceUsd: string;
  onClick: () => void;
}

const BalanceListItem = ({
  token,
  balanceUsd,
  onClick,
}: BalanceListItemProps) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="flex flex-row items-center justify-between border-border w-full cursor-pointer"
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex flex-row items-center justify-center gap-x-[4px]">
        <Image
          src={getTokenLogoURI(token)}
          alt={token.symbol}
          width={24}
          height={24}
        />
        <div className={`text-border ${isHovered ? 'text-foreground' : ''}`}>
          {token.symbol}
        </div>
      </div>
      <div className={`text-border ${isHovered ? 'text-foreground' : ''}`}>
        ${balanceUsd}
      </div>
    </div>
  );
};

export default function Home() {
  const router = useRouter();
  const { isConnecting, address } = useAccount();

  useEffect(() => {
    if (isConnecting === false && !address) {
      router.push('/start');
    }
  }, [isConnecting, router, address]);

  const { data: setBalances } = trpc.getSetBalances.useQuery(
    {
      set: TokenSet.ETH,
      address: address || zeroAddress,
    },
    {
      enabled: !!address,
    }
  );

  if (!setBalances) {
    return <div></div>;
  }

  return (
    <div className="flex flex-col items-center w-[350px] pb-[220px] gap-y-[56px]">
      <div className="flex flex-col gap-y-[8px] items-center justify-center w-full">
        <div className="flex flex-row gap-x-[6px] items-center w-full">
          <Wallet className="w-[20px] h-[20px] text-border" />
          <div className="text-border">Balance</div>
        </div>
        <BalanceChart setBalances={setBalances} />
      </div>
      <div className="flex flex-col items-center justify-center border-[1px] border-border gap-y-[12px] rounded-[16px] p-[16px] w-full">
        {setBalances.balances.map((balance, index) => (
          <div
            className="flex flex-col items-center justify-center w-full gap-y-[12px]"
            key={index}
          >
            <BalanceListItem
              token={balance.token}
              balanceFormatted={balance.totalBalanceFormatted}
              balanceUsd={balance.totalBalanceUsdFormatted}
              onClick={() => {
                router.push(`/${balance.token.symbol}/balance`);
              }}
            />
            {index !== setBalances.balances.length - 1 && <Separator />}
          </div>
        ))}
      </div>
    </div>
  );
}
