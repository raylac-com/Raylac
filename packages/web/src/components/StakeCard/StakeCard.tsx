'use client';
import useSignAndSubmitSwap from '@/hooks/useSignAndSubmitSwap';
import { trpc } from '@/lib/trpc';
import { cn, getTokenLogoURI } from '@/lib/utils';
import {
  ETH,
  getChainFromId,
  GetSwapQuoteRequestBody,
  Token,
  WST_ETH,
} from '@raylac/shared';
import { ArrowUpDown, Wallet } from 'lucide-react';
import { motion } from 'framer-motion';
import { useCallback, useEffect, useState } from 'react';
import { parseEther } from 'viem';
import { useAccount, useChainId, useSwitchChain } from 'wagmi';
import TokenLogoWithChain from '../TokenLogoWithChain/TokenLogoWithChain';
import { Skeleton } from '../ui/skeleton';

const WalletBalance = ({
  balanceFormatted,
  onClick,
}: {
  balanceFormatted: string;
  onClick: () => void;
}) => {
  return (
    <div
      className="flex flex-row items-center text-muted-foreground gap-x-[4px] cursor-pointer"
      onClick={onClick}
    >
      <Wallet className="w-[17px] h-[17px]" />
      <div>{balanceFormatted} ETH</div>
    </div>
  );
};

const SwapButton = ({
  chainId,
  onClick,
  inputToken,
  outputToken,
}: {
  chainId: number;
  onClick: () => void;
  inputToken: Token;
  outputToken: Token;
}) => {
  const connectedChainId = useChainId();

  const { switchChainAsync } = useSwitchChain();

  const needsSwitchChain = chainId !== connectedChainId;

  return (
    <motion.div
      whileHover={{ scale: 1.025 }}
      whileTap={{ scale: 0.975 }}
      className={cn(
        'bg-foreground rounded-[32px] h-[46px] flex flex-row items-center justify-center cursor-pointer'
      )}
      onClick={async () => {
        if (needsSwitchChain) {
          await switchChainAsync({ chainId });
        }

        onClick();
      }}
    >
      <div className="text-bg2 font-bold">
        {outputToken.symbol} {`>>`} {inputToken.symbol}
      </div>
    </motion.div>
  );
};

const CardHeader = ({ chainId }: { chainId: number }) => {
  return (
    <div className="flex flex-row items-center gap-x-[12px]">
      <div className="text-foreground font-bold">
        {getChainFromId(chainId).name}
      </div>
    </div>
  );
};

interface StakeCardProps {
  chainId: number;
  balance: bigint;
  balanceFormatted: string;
  balanceUsd: string;
}

const StakeCard = ({ chainId, balanceFormatted }: StakeCardProps) => {
  const [inputToken, setInputToken] = useState<Token>(ETH);
  const [outputToken, setOutputToken] = useState<Token>(WST_ETH);

  const [amountInputText, setAmountInputText] = useState('0');
  const { address } = useAccount();

  const {
    mutateAsync: getSingleChainSwapQuote,
    data: quote,
    isPending: isGettingQuote,
  } = trpc.getSingleChainSwapQuote.useMutation({
    throwOnError: false,
  });

  const { mutateAsync: signAndSubmitSwap } = useSignAndSubmitSwap();

  useEffect(() => {
    if (amountInputText && address) {
      const amount = parseEther(amountInputText);

      if (amount === BigInt(0)) {
        return;
      }

      const getSwapQuoteRequestBody: GetSwapQuoteRequestBody = {
        amount: amount.toString(),
        inputToken: ETH,
        outputToken: WST_ETH,
        sender: address,
        chainId: chainId,
      };

      getSingleChainSwapQuote(getSwapQuoteRequestBody);
    }
  }, [amountInputText, address, chainId]);

  const onConvertClick = useCallback(async () => {
    if (quote) {
      await signAndSubmitSwap({
        swapSteps: quote.swapSteps,
      });
    }
  }, [quote, signAndSubmitSwap]);

  const onChangeDirectionClick = () => {
    if (amountInputText && address) {
      const amount = parseEther(amountInputText);

      if (amount !== BigInt(0)) {
        const getSwapQuoteRequestBody: GetSwapQuoteRequestBody = {
          amount: amount.toString(),
          inputToken: outputToken,
          outputToken: inputToken,
          sender: address,
          chainId: chainId,
        };

        getSingleChainSwapQuote(getSwapQuoteRequestBody);
      }
    }

    setInputToken(outputToken);
    setOutputToken(inputToken);
  };

  const onWalletBalanceClick = () => {
    setAmountInputText(balanceFormatted);
  };

  const amountInUsd = quote?.amountInUsd || '0';
  const amountOutUsd = quote?.amountOutUsd || '0';
  const amountOutFormatted = quote?.amountOutFormatted || '0';

  return (
    <div className="flex flex-col px-[22px] py-[16px] bg-bg2 rounded-[16px] gap-y-[54px]">
      <CardHeader chainId={chainId} />
      <div className="flex flex-row gap-x-[12px] justify-between">
        <div className="flex flex-col mt-[26px] gap-y-[12px] items-center">
          <TokenLogoWithChain
            logoURI={getTokenLogoURI(inputToken)}
            chainId={chainId}
            size={45}
          />
          <ArrowUpDown
            className="mr-[12px] w-[24px] h-[24px] cursor-pointer text-muted-foreground hover:text-foreground"
            onClick={onChangeDirectionClick}
          />
          <TokenLogoWithChain
            logoURI={getTokenLogoURI(outputToken)}
            chainId={chainId}
            size={45}
          />
        </div>
        <div className="flex flex-col gap-y-[25px]">
          <div className="flex flex-col gap-y-[4px]">
            <div className="flex flex-row justify-end">
              <WalletBalance
                balanceFormatted={balanceFormatted}
                onClick={onWalletBalanceClick}
              />
            </div>
            <div className="flex flex-row items-center h-[45px] w-[257px] text-2lg border-[1px] border-border bg-bg2 rounded-[8px] px-[16px] text-foreground gap-x-[4px]">
              <input
                className="font-inter flex bg-transparent w-full h-full outline-none text-right"
                value={amountInputText}
                onChange={e => setAmountInputText(e.target.value)}
                spellCheck={false}
              />
              <div className="text-border">{inputToken.symbol}</div>
            </div>
            <div className="flex flex-row justify-end">
              <div className="text-muted-foreground  h-[18px]">
                {isGettingQuote ? (
                  <Skeleton className="w-[100px] h-full bg-background" />
                ) : (
                  `$${amountInUsd}`
                )}
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-y-[4px]">
            <div className="text-foreground h-[18px] font-bold">
              {isGettingQuote ? (
                <Skeleton className="w-[100px] h-full bg-background" />
              ) : (
                `${amountOutFormatted} ${outputToken.symbol}`
              )}
            </div>
            <div className="text-muted-foreground h-[18px]">
              {isGettingQuote ? (
                <Skeleton className="w-[100px] h-full bg-background" />
              ) : (
                `$${amountOutUsd}`
              )}
            </div>
          </div>
        </div>
      </div>
      <SwapButton
        chainId={chainId}
        onClick={onConvertClick}
        inputToken={inputToken}
        outputToken={outputToken}
      />

      {/**
      <div className="flex flex-col items-end">
        <div className="flex flex-row items-center gap-x-[9px]">
          <TokenLogoWithChain
            logoURI={getTokenLogoURI(inputToken)}
            chainId={chainId}
            size={42}
          />
          <input
            className="h-[47px] w-[200px] text-2lg border-[1px] border-border bg-bg2 rounded-[8px] px-[16px] py-[12px] text-foreground"
            value={amountInputText}
            onChange={e => setAmountInputText(e.target.value)}
          />
          <div className="text-foreground text-2lg">{inputToken.symbol}</div>
        </div>
        <div className="text-muted-foreground">${quote?.amountInUsd}</div>
      </div>
      <div className="flex flex-row items-center">
        <ArrowUpDown
          className="w-[24px] h-[24px] cursor-pointer text-muted-foreground hover:text-foreground"
          onClick={onChangeDirectionClick}
        />
      </div>
      <div className="flex flex-row items-center gap-x-[12px]">
        <TokenLogoWithChain
          logoURI={getTokenLogoURI(outputToken)}
          chainId={chainId}
          size={42}
        />
        <div className="flex flex-col gap-y-[4px]">
          <div>
            {quote?.amountOutFormatted} {outputToken.symbol}
          </div>
          <div className="text-muted-foreground">
            {isGettingQuote ? (
              <Skeleton className="w-[100px] h-[16px] bg-background" />
            ) : (
              `$${amountOutUsd}`
            )}
          </div>
        </div>
      </div>
      * 
       */}
    </div>
  );
};

export default StakeCard;
