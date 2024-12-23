'use client';
import AddAddressButton from '@/components/AddAddressButton/AddAddressButton';
import SwapCard from '@/components/SwapCard/SwapCard';
import useTokenBalance from '@/hooks/useTokenBalance';
import { trpc } from '@/lib/trpc';
import { getTokenLogoURI, shortenAddress } from '@/lib/utils';
import { ETH, Token, TokenSet } from '@raylac/shared';
import { WST_ETH } from '@raylac/shared';
import { ArrowLeftRight, ArrowRightLeft } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';

const SelectableToken = ({
  token,
  onClick,
}: {
  token: Token;
  onClick: () => void;
}) => {
  return (
    <Image
      src={getTokenLogoURI(token)}
      alt={token.symbol}
      width={36}
      height={36}
      className="w-[36px] h-[36px] select-none hover:border-[2px] border-foreground rounded-full cursor-pointer"
      onClick={onClick}
    />
  );
};

const SwapToken = ({
  token,
  setToken,
}: {
  token: Token;
  setToken: (token: Token) => void;
}) => {
  const { data: tokens } = trpc.getSet.useQuery({ set: TokenSet.ETH });
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="w-[60px] flex flex-row relative">
      <div className="flex flex-col gap-y-[6px] items-center justify-center">
        <Image
          onMouseEnter={() => setExpanded(true)}
          onMouseLeave={() => setExpanded(false)}
          src={getTokenLogoURI(token)}
          alt={token.symbol}
          width={36}
          height={36}
          className="w-[36px] h-[36px] select-none cursor-pointer"
        />
        <div className="text-border">{token.symbol}</div>
      </div>
      <div
        onMouseEnter={() => {
          setExpanded(true);
        }}
        onMouseLeave={() => setExpanded(false)}
        className={`flex w-[250px] flex-row absolute ${'left-[40px]'} top-0 ${
          expanded ? 'opacity-100 w-[250px]' : 'opacity-0 w-0'
        } transition-all duration-300 ease-in-out overflow-hidden`}
      >
        {tokens
          ?.filter(t => t.symbol !== token.symbol)
          .map(t => (
            <SelectableToken
              key={t.symbol}
              token={t}
              onClick={() => {
                setExpanded(false);
                setToken(t);
              }}
            />
          ))}
      </div>
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
    <div className="flex flex-col items-center w-[420px] pb-[220px]">
      <div className="mt-[32px] flex flex-col gap-y-[8px] items-center justify-center w-full">
        <div className="flex flex-row gap-x-[6px] items-center w-full">
          <ArrowLeftRight className="w-[20px] h-[20px] text-border" />
          <div className="text-border">Swap</div>
        </div>
        <div className="flex flex-row gap-[16px] py-[12px] items-center justify-center w-full">
          <SwapToken token={inputToken} setToken={setInputToken} />
          <ArrowRightLeft
            className="w-[24px] h-[24px] text-border cursor-pointer"
            onClick={onChangeDirectionClick}
          />
          <SwapToken token={outputToken} setToken={setOutputToken} />
        </div>
        <div className="flex flex-col gap-y-[48px] items-center justify-center w-full">
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
        <AddAddressButton onClick={() => {}} />
      </div>
    </div>
  );
};

export default SwapPage;
