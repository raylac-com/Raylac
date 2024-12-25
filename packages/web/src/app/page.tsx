'use client';
import { trpc } from '@/lib/trpc';
import { TokenSet } from '@raylac/shared';
import { Token } from '@raylac/shared';
import { Wallet } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, Label, Legend, Tooltip } from 'recharts';
import Image from 'next/image';
import { getTokenLogoURI } from '@/lib/utils';
import useAddresses from '@/hooks/useAddresses';
import AddAddressButton from '@/components/AddAddressButton/AddAddressButton';
import Link from 'next/link';
import PageTitle from '@/components/PageTitle/PageTitle';
import { useIsMobile } from '@/hooks/useIsMobile';

const useChartSize = () => {
  const isMobile = useIsMobile();

  const width = isMobile ? 240 : 180;
  const height = isMobile ? 400 : 300;

  const innerRadius = isMobile ? 100 : 78;
  const outerRadius = isMobile ? 120 : 90;

  return { width, height, innerRadius, outerRadius };
};

const APRChart = ({
  tokenBalances,
  aprUsdFormatted,
}: {
  tokenBalances: {
    totalBalanceUsd: string;
    totalBalanceUsdFormatted: string;
    token: Token;
  }[];
  aprUsdFormatted: string;
}) => {
  const { width, height, innerRadius, outerRadius } = useChartSize();
  const [activeDataKey, setActiveDataKey] = useState('');

  const stakedETHBalances = tokenBalances.filter(
    balance => balance.token.symbol !== 'ETH'
  );

  const data = stakedETHBalances.map(balance => ({
    name: balance.token.symbol,
    value: Number(balance.totalBalanceUsd),
    color: balance.token.color,
    strokeColor:
      activeDataKey === balance.token.symbol ? '#ffffff' : balance.token.color,
    dataKey: balance.token.symbol,
  }));

  return (
    <PieChart width={width} height={height}>
      <Pie
        isAnimationActive={false}
        data={data}
        innerRadius={innerRadius}
        outerRadius={outerRadius}
        fill="#8884d8"
        paddingAngle={3}
        dataKey="value"
        activeIndex={0}
      >
        {data.map(entry => (
          <Cell
            key={entry.dataKey}
            fill={entry.color}
            stroke={entry.strokeColor}
          />
        ))}
        <Label
          value="APR"
          position="center"
          dy={-30} // Move down from center
          fontSize={16}
          fill="#B8ACAC"
        />
        <Label
          value={`$${aprUsdFormatted}`}
          position="center"
          fill="#FAFAFA"
          className="text-2lg font-bold"
        />
      </Pie>
      <Tooltip
        formatter={value => {
          return `$${Number(value).toLocaleString()}`;
        }}
      />
      <Legend
        height={80}
        verticalAlign="bottom"
        layout="vertical"
        onMouseEnter={o => {
          setActiveDataKey(o.value as string);
        }}
        onMouseLeave={() => {
          setActiveDataKey('');
        }}
      />
    </PieChart>
  );
};

const BalanceChart = ({
  tokenBalances,
  totalBalanceUsdFormatted,
}: {
  tokenBalances: {
    totalBalanceUsd: string;
    totalBalanceUsdFormatted: string;
    token: Token;
  }[];
  totalBalanceUsdFormatted: string;
}) => {
  const { width, height, innerRadius, outerRadius } = useChartSize();
  const [activeDataKey, setActiveDataKey] = useState('');

  const data = tokenBalances.map(balance => ({
    name: balance.token.symbol,
    value: Number(Number(balance.totalBalanceUsd).toFixed(2)),
    color: balance.token.color,
    strokeColor:
      activeDataKey === balance.token.symbol ? '#ffffff' : balance.token.color,
    dataKey: balance.token.symbol,
  }));

  return (
    <PieChart width={width} height={height}>
      <Pie
        isAnimationActive={false}
        data={data}
        innerRadius={innerRadius}
        outerRadius={outerRadius}
        fill="#8884d8"
        paddingAngle={3}
        dataKey="value"
      >
        {data.map(entry => (
          <Cell
            key={entry.dataKey}
            fill={entry.color}
            stroke={entry.strokeColor}
          />
        ))}
        <Label
          value="Balance"
          position="center"
          dy={-30} // Move down from center
          fontSize={16}
          fill="#B8ACAC"
        />
        <Label
          value={`$${totalBalanceUsdFormatted}`}
          position="center"
          fill="#FAFAFA"
          className="text-2lg font-bold"
        />
      </Pie>
      <Legend
        height={80}
        verticalAlign="bottom"
        layout="vertical"
        onMouseEnter={o => {
          setActiveDataKey(o.value as string);
        }}
        onMouseLeave={() => {
          setActiveDataKey('');
        }}
      />
      <Tooltip
        formatter={value => {
          return `$${Number(value).toLocaleString()}`;
        }}
      />
    </PieChart>
  );
};

interface BalanceListItemProps {
  token: Token;
  balanceFormatted?: string;
  balanceUsd: string;
  apr?: number;
  onClick: () => void;
}

const BalanceListItem = ({
  token,
  balanceUsd,
  balanceFormatted,
  apr,
  onClick,
}: BalanceListItemProps) => {
  return (
    <div
      className="py-[16px] pl-[16px] pr-[22px] flex flex-row items-start justify-between w-full cursor-pointer"
      onClick={onClick}
    >
      <div className="flex flex-row items-center justify-center gap-x-[8px]">
        <Image
          src={getTokenLogoURI(token)}
          alt={token.symbol}
          width={42}
          height={42}
        />
        <div className="flex flex-col gap-y-[1px]">
          <div className={`text-foreground`}>{token.symbol}</div>
          <div className={`text-border`}>
            {balanceFormatted} {token.symbol}
          </div>
        </div>
      </div>
      <div className="flex flex-col justify-start items-end">
        <div className={`text-foreground font-bold`}>${balanceUsd}</div>
        <div className={`text-border`}>{apr ? `APR ${apr}%` : ''}</div>
      </div>
    </div>
  );
};

const WalletsLabel = () => {
  const { data: addresses } = useAddresses();

  return (
    <Link
      href="/addresses"
      className="flex flex-row items-center justify-start gap-x-[4px] cursor-pointer"
    >
      <Wallet className="w-[18px] h-[18px] text-border" />
      <div className="text-border">{addresses?.length} addresses</div>
    </Link>
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
      addresses: addresses?.map(a => a.address) ?? [],
    },
    {
      enabled: addresses !== undefined && addresses.length > 0,
    }
  );

  const { data: lidoApr } = trpc.getLidoApy.useQuery();

  if (!setBalances) {
    return <div></div>;
  }

  return (
    <div className="flex flex-col items-center w-[350px] md:w-[400px] pb-[220px]">
      <PageTitle>Home</PageTitle>
      <div className="flex flex-col gap-y-[8px] items-center justify-center w-full">
        <div className="flex flex-col md:flex-row justify-between items-center w-full">
          <BalanceChart
            tokenBalances={setBalances.tokenBalances}
            totalBalanceUsdFormatted={setBalances.totalBalanceUsdFormatted}
          />
          <APRChart
            tokenBalances={setBalances.tokenBalances}
            aprUsdFormatted={setBalances.aprUsdFormatted}
          />
        </div>
      </div>
      <div className="flex flex-col gap-y-[15px] w-full mt-[60px]">
        <WalletsLabel />
        <div className="flex flex-col items-center justify-center bg-bg2 rounded-[16px] w-full">
          {setBalances.tokenBalances.map((balance, index) => (
            <BalanceListItem
              key={index}
              token={balance.token}
              balanceFormatted={balance.totalBalanceFormatted}
              balanceUsd={balance.totalBalanceUsdFormatted}
              apr={balance.token.symbol === 'ETH' ? undefined : lidoApr}
              onClick={() => {
                router.push(`/${balance.token.symbol}/balance`);
              }}
            />
          ))}
        </div>
      </div>
      <div className="mt-[32px]">
        <AddAddressButton />
      </div>
    </div>
  );
}
