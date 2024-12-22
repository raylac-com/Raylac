'use client';
import useSwap from '@/hooks/useSwap';
import { trpc } from '@/lib/trpc';
import { cn, getChainIcon, getTokenLogoURI } from '@/lib/utils';
import { AnimatePresence } from 'motion/react';
import {
  ETH,
  getChainFromId,
  GetSwapQuoteRequestBody,
  Token,
  WST_ETH,
} from '@raylac/shared';
import { ArrowUpDown, ChevronDownIcon, Wallet } from 'lucide-react';
import { motion } from 'framer-motion';
import { useCallback, useEffect, useState } from 'react';
import { parseEther } from 'viem';
import { useAccount, useChainId, useSwitchChain } from 'wagmi';
import TokenLogoWithChain from '../TokenLogoWithChain/TokenLogoWithChain';
import { Skeleton } from '../ui/skeleton';
import Image from 'next/image';
import useChainBalance from '@/hooks/useChainBalance';

const SwapButton = ({
  chainId,
  onClick,
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
      <div className="flex flex-row items-center gap-x-[8px]">
        <div className="text-bg2 font-bold">Swap to {outputToken.symbol}</div>
        <Image
          src={getTokenLogoURI(outputToken)}
          alt="output-token-logo"
          width={20}
          height={20}
          className="w-[20px] h-[20px]"
        />
      </div>
    </motion.div>
  );
};

const CardHeader = ({
  chainId,
  isOpen,
  onOpenChange,
  onBalanceClick,
  inputToken,
}: {
  chainId: number;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onBalanceClick: () => void;
  inputToken: Token;
}) => {
  const { balanceFormatted } = useChainBalance({
    tokenId: inputToken.symbol,
    chainId,
  });

  return (
    <div
      className="flex flex-row items-center justify-between gap-x-[12px] cursor-pointer"
      onClick={() => onOpenChange(!isOpen)}
    >
      <div className="text-muted-foreground flex flex-row items-center gap-x-[6px]">
        <Image
          src={getChainIcon(chainId)}
          alt="chain-logo"
          width={24}
          height={24}
          className="w-[24px] h-[24px]"
        />
        {getChainFromId(chainId).name}
      </div>
      <div className="flex flex-row items-center gap-x-[16px]">
        <div
          className="flex flex-row items-center gap-x-[6px] cursor-pointer"
          onClick={e => {
            e.stopPropagation();

            if (isOpen) {
              onBalanceClick();
            } else {
              onOpenChange(true);
            }
          }}
        >
          <div className="text-muted-foreground">
            {balanceFormatted} {inputToken.symbol}
          </div>
          <Wallet className="w-[17px] h-[17px] text-muted-foreground" />
        </div>
        <ChevronDownIcon
          className={cn(
            'w-[24px] h-[24px] text-muted-foreground cursor-pointer',
            isOpen ? 'rotate-180' : ''
          )}
        />
      </div>
    </div>
  );
};

interface SwapCardProps {
  chainId: number;
  fromToken: Token;
  toToken: Token;
}

const SwapCard = ({ chainId }: SwapCardProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const [inputToken, setInputToken] = useState<Token>(ETH);
  const [outputToken, setOutputToken] = useState<Token>(WST_ETH);

  const [amountInputText, setAmountInputText] = useState('');
  const { address } = useAccount();

  const { balanceFormatted } = useChainBalance({
    tokenId: inputToken.symbol,
    chainId,
  });

  const {
    mutateAsync: getSingleChainSwapQuote,
    data: quote,
    isPending: isGettingQuote,
  } = trpc.getSingleChainSwapQuote.useMutation({
    throwOnError: false,
  });

  const { mutateAsync: signAndSubmitSwap } = useSwap();

  useEffect(() => {
    if (amountInputText && address) {
      const amount = parseEther(amountInputText);

      if (amount === BigInt(0)) {
        return;
      }

      const getSwapQuoteRequestBody: GetSwapQuoteRequestBody = {
        amount: amount.toString(),
        inputToken: inputToken,
        outputToken: outputToken,
        sender: address,
        chainId: chainId,
      };

      getSingleChainSwapQuote(getSwapQuoteRequestBody);
    }
  }, [amountInputText, address, chainId, inputToken, outputToken]);

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
    if (balanceFormatted !== undefined) {
      setAmountInputText(balanceFormatted);
    }
  };

  const amountInUsd = quote?.amountInUsd || '0';
  const amountOutUsd = quote?.amountOutUsd || '0';
  const amountOutFormatted = quote?.amountOutFormatted || '0';

  return (
    <div className="flex flex-col gap-y-[48px] px-[22px] py-[16px] bg-bg2 rounded-[16px] w-[420px] hover:bg-bg3">
      <CardHeader
        chainId={chainId}
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        onBalanceClick={onWalletBalanceClick}
        inputToken={inputToken}
      />
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="flex flex-col gap-y-[54px]"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex flex-row gap-x-[12px] justify-between">
              <div className="flex flex-col gap-y-[12px] items-center">
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
                  <div className="flex flex-row items-center h-[45px] w-[305px] text-2lg border-[1px] border-border bg-bg2 rounded-[8px] px-[16px] text-foreground gap-x-[10px]">
                    <input
                      className="flex bg-transparent w-full h-full outline-none text-right"
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
                        `~$${amountInUsd}`
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SwapCard;
