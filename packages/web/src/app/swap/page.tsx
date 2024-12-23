'use client';
import PageTitle from '@/components/PageTitle/PageTitle';
import SwapCard from '@/components/SwapCard/SwapCard';
import { trpc } from '@/lib/trpc';
import { ETH, Token, TokenSet } from '@raylac/shared';
import { WST_ETH } from '@raylac/shared';
import { ArrowLeftRight, Wallet } from 'lucide-react';
import Image from 'next/image';
import { zeroAddress } from 'viem';
import { useAccount } from 'wagmi';
import { PieChart, Pie, Cell, Label } from 'recharts';

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
    <PieChart width={420} height={300}>
      <Pie
        data={data}
        innerRadius={60}
        outerRadius={80}
        fill="#8884d8"
        paddingAngle={3}
        dataKey="value"
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

const SwapPage = () => {
  const { address } = useAccount();

  //  const { data: lidoApy } = trpc.getLidoApy.useQuery();

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

  const ethMultiChainBalance = setBalances.balances.find(
    balance => balance.token.symbol === 'ETH'
  );

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
            src="/wsteth.png"
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
        <BalanceChart setBalances={setBalances} />
      </div>
      <div className="mt-[32px] flex flex-col gap-y-[8px] items-center justify-center w-full">
        <div className="flex flex-row gap-x-[6px] items-center w-full">
          <ArrowLeftRight className="w-[20px] h-[20px] text-border" />
          <div className="text-border">Swap</div>
        </div>
        <div className="flex flex-col gap-y-[16px] items-center justify-center w-full">
          {ethMultiChainBalance?.balances.map((balance, i) => (
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
