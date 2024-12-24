'use client';
import AddAddressButton from '@/components/AddAddressButton/AddAddressButton';
import PageTitle from '@/components/PageTitle/PageTitle';
import SwapCard from '@/components/SwapCard/SwapCard';
import useTokenBalance from '@/hooks/useTokenBalance';
import { getTokenLogoURI, shortenAddress } from '@/lib/utils';
import { ETH, Token } from '@raylac/shared';
import { WST_ETH } from '@raylac/shared';
import { ArrowRight, Wallet } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';

const SwapToken = ({ token }: { token: Token }) => {
  return (
    <div className="flex flex-row items-center gap-x-[6px] relative">
      <Image
        src={getTokenLogoURI(token)}
        alt={token.symbol}
        width={38}
        height={38}
        className="w-[38px] h-[38px] select-none cursor-pointer"
      />
      <div className="text-border">{token.symbol}</div>
    </div>
  );
};

const SwapPage = () => {
  const [inputToken, setInputToken] = useState<Token>(ETH);
  const [outputToken, setOutputToken] = useState<Token>(WST_ETH);

  const inputTokenBalances = useTokenBalance({
    token: inputToken,
  });

  const onChangeDirectionClick = () => {
    setInputToken(outputToken);
    setOutputToken(inputToken);
  };

  return (
    <div className="flex flex-col items-center w-[400px] pb-[220px]">
      <PageTitle>Swap</PageTitle>
      <div className="flex flex-col items-center justify-center w-full">
        <div className="flex flex-col gap-y-[10px] w-full rounded-[16px] bg-bg2 px-[20px] py-[24px] ">
          <div className="flex flex-row gap-x-[16px] items-center w-full">
            <SwapToken token={inputToken} />
            <ArrowRight
              className="w-[24px] h-[24px] text-border cursor-pointer"
              onClick={onChangeDirectionClick}
            />
            <SwapToken token={outputToken} />
          </div>
          <div className="flex flex-row items-center gap-x-[6px] px-[2px]">
            <Wallet className="w-[20px] h-[20px] text-border" />
            <div className="text-border">
              ${inputTokenBalances?.totalBalanceUsdFormatted}
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-y-[48px] items-center justify-center w-full mt-[34px]">
          {inputTokenBalances?.addressBalances.map(balance => (
            <div
              className="flex flex-col gap-y-[8px] w-full"
              key={balance.address}
            >
              <div className="text-border">
                {shortenAddress(balance.address)}
              </div>
              <div className="flex flex-col gap-y-[12px] w-full">
                {balance.chainBalances?.map((chainBalance, index) => (
                  <SwapCard
                    key={`${balance.address}-${index}`}
                    address={balance.address}
                    fromToken={inputToken}
                    toToken={outputToken}
                    chainId={chainBalance.chain}
                    fromTokenBalance={{
                      balanceFormatted: chainBalance.balanceFormatted,
                      balanceUsd: chainBalance.balanceUsd,
                    }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="flex flex-row mt-[32px] items-center justify-center w-full">
        <AddAddressButton />
      </div>
    </div>
  );
};

export default SwapPage;
