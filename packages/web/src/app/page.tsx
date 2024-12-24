'use client';
import { trpc } from '@/lib/trpc';
import { TokenSet } from '@raylac/shared';
import { Token } from '@raylac/shared';
import { Wallet } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { PieChart, Pie, Cell, Label } from 'recharts';
import Image from 'next/image';
import { getTokenLogoURI } from '@/lib/utils';
import Separator from '@/components/Separator';
import { useState } from 'react';
import useAddresses from '@/hooks/useAddresses';
import AddAddressButton from '@/components/AddAddressButton/AddAddressButton';

const BalanceChart = ({
  tokenBalances,
  totalBalanceUsdFormatted,
  aprUsdFormatted,
}: {
  tokenBalances: {
    totalBalanceUsd: string;
    totalBalanceUsdFormatted: string;
    token: Token;
  }[];
  totalBalanceUsdFormatted: string;
  aprUsdFormatted: string;
}) => {
  const data = tokenBalances.map(balance => ({
    name: balance.token.symbol,
    value: Number(balance.totalBalanceUsd),
    color: balance.token.color,
  }));

  return (
    <PieChart width={450} height={300}>
      <Pie
        isAnimationActive={false}
        data={data}
        innerRadius={100}
        outerRadius={120}
        fill="#8884d8"
        paddingAngle={3}
        dataKey="value"
        activeIndex={0}
      >
        {data.map((entry, index) => (
          <Cell key={`cell-${index}`} fill={entry.color} />
        ))}
        <Label
          value={`$${totalBalanceUsdFormatted}`}
          position="center"
          fill="#FAFAFA"
          className="text-2lg font-bold"
        />
        <Label
          value={`APR $${aprUsdFormatted}`}
          position="center"
          dy={35} // Move down from center
          fontSize={16}
          fill="#B8ACAC"
          className="text-base"
        />
      </Pie>
      <text x={210} y={300} textAnchor="middle" fill="white">
        {data.map((entry, index) => (
          <tspan key={index} x={160 + index * 85} y={300}>
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
  const { data: addresses } = useAddresses();

  useEffect(() => {
    if (addresses !== undefined && addresses.length === 0) {
      router.push('/start');
    }
  }, [addresses]);

  const { data: setBalances } = trpc.getSetBalances.useQuery(
    {
      set: TokenSet.ETH,
      addresses: addresses ?? [],
    },
    {
      enabled: addresses !== undefined && addresses.length > 0,
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
        <BalanceChart
          tokenBalances={setBalances.tokenBalances}
          totalBalanceUsdFormatted={setBalances.totalBalanceUsdFormatted}
          aprUsdFormatted={setBalances.aprUsdFormatted}
        />
      </div>
      <div className="flex flex-col items-center justify-center border-[1px] border-border gap-y-[12px] rounded-[16px] p-[16px] w-full">
        {setBalances.tokenBalances.map((balance, index) => (
          <div
            className="flex flex-col items-center justify-center w-full gap-y-[12px]"
            key={index}
          >
            <BalanceListItem
              token={balance.token}
              balanceFormatted={balance.totalBalanceUsdFormatted}
              balanceUsd={balance.totalBalanceUsdFormatted}
              onClick={() => {
                router.push(`/${balance.token.symbol}/balance`);
              }}
            />
            {index !== setBalances.tokenBalances.length - 1 && <Separator />}
          </div>
        ))}
      </div>
      <AddAddressButton />
    </div>
  );
}
