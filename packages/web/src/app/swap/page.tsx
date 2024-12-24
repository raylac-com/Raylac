'use client';
import AddAddressButton from '@/components/AddAddressButton/AddAddressButton';
import PageTitle from '@/components/PageTitle/PageTitle';
import SelectTokenDialog from '@/components/SelectTokenDialog/SelectTokenDialog';
import SwapCard from '@/components/SwapCard/SwapCard';
import SwapCardsSkeleton from '@/components/SwapCardsSkeleton';
import useTokenBalance from '@/hooks/useTokenBalance';
import { getTokenLogoURI, shortenAddress } from '@/lib/utils';
import { ETH, Token } from '@raylac/shared';
import { WST_ETH } from '@raylac/shared';
import { ArrowRight, ChevronsUpDown, Wallet } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';

const SwapToken = ({
  token,
  onClick,
}: {
  token: Token;
  onClick: () => void;
}) => {
  return (
    <div className="flex flex-row items-center gap-x-[6px]">
      <div className="flex flex-row items-end cursor-pointer" onClick={onClick}>
        <Image
          src={getTokenLogoURI(token)}
          alt={token.symbol}
          width={38}
          height={38}
          className="w-[38px] h-[38px] select-none "
        />
        <ChevronsUpDown
          className="w-[20px] h-[20px] text-foreground"
          style={{
            marginLeft: '-10px',
          }}
        />
      </div>
      <div className="text-border">{token.symbol}</div>
    </div>
  );
};

const SwapPage = () => {
  const [inputToken, setInputToken] = useState<Token>(ETH);
  const [outputToken, setOutputToken] = useState<Token>(WST_ETH);
  const [selectTokenDialogOpen, setSelectTokenDialogOpen] = useState<
    boolean | 'input' | 'output'
  >(false);

  const inputTokenBalances = useTokenBalance({
    token: inputToken,
  });

  const onChangeDirectionClick = () => {
    setInputToken(outputToken);
    setOutputToken(inputToken);
  };

  const outputTokenAvailableChainIds = outputToken.addresses.map(
    address => address.chainId
  );

  // Boolean indicating if there are any swaps available
  // If this is false, we show "No available swaps"
  const noSwapsAvailable =
    inputTokenBalances !== undefined &&
    !inputTokenBalances.addressBalances.some(balance =>
      balance.chainBalances?.some(chainBalance =>
        outputTokenAvailableChainIds.includes(chainBalance.chain)
      )
    );
  return (
    <>
      <div className="flex flex-col items-center w-[350px] md:w-[400px] pb-[220px]">
        <PageTitle>Swap</PageTitle>
        <div className="flex flex-col items-center justify-center w-full">
          <div className="flex flex-col gap-y-[10px] w-full rounded-[16px] bg-bg2 px-[20px] py-[24px] ">
            <div className="flex flex-row gap-x-[16px] items-center w-full">
              <SwapToken
                token={inputToken}
                onClick={() => setSelectTokenDialogOpen('input')}
              />
              <ArrowRight
                className="w-[24px] h-[24px] text-border cursor-pointer"
                onClick={onChangeDirectionClick}
              />
              <SwapToken
                token={outputToken}
                onClick={() => setSelectTokenDialogOpen('output')}
              />
            </div>
            <div className="flex flex-row items-center gap-x-[6px] px-[2px]">
              <Wallet className="w-[20px] h-[20px] text-border" />
              <div className="text-border">
                ${inputTokenBalances?.totalBalanceUsdFormatted}
              </div>
            </div>
          </div>
          {inputTokenBalances === undefined && (
            <div className="w-full mt-[34px]">
              <SwapCardsSkeleton></SwapCardsSkeleton>
            </div>
          )}
          <div className="flex flex-col gap-y-[48px] items-center justify-center w-full mt-[34px]">
            {inputTokenBalances?.addressBalances.map(balance => {
              const swappableChainBalances = balance.chainBalances?.filter(
                chainBalance =>
                  outputTokenAvailableChainIds.includes(chainBalance.chain)
              );

              if (swappableChainBalances?.length === 0) {
                return null;
              }

              return (
                <div
                  className="flex flex-col gap-y-[8px] w-full"
                  key={balance.address}
                >
                  <div className="text-border">
                    {shortenAddress(balance.address)}
                  </div>
                  <div className="flex flex-col gap-y-[12px] w-full">
                    {swappableChainBalances?.map(chainBalance => (
                      <SwapCard
                        key={`${balance.address}-${chainBalance.chain}`}
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
              );
            })}
            {noSwapsAvailable && (
              <div className="text-border">No available swaps</div>
            )}
          </div>
        </div>
        <div className="flex flex-row mt-[32px] items-center justify-center w-full">
          <AddAddressButton />
        </div>
      </div>
      <SelectTokenDialog
        open={selectTokenDialogOpen !== false}
        setOpen={setSelectTokenDialogOpen}
        type={selectTokenDialogOpen as 'input' | 'output'}
        onSelect={token => {
          if (selectTokenDialogOpen === 'input') {
            setInputToken(token);
          } else {
            setOutputToken(token);
          }
        }}
      />
    </>
  );
};

export default SwapPage;
