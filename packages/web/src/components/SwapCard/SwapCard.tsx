'use client';
import useSwap from '@/hooks/useSwap';
import { trpc } from '@/lib/trpc';
import { cn, getTokenLogoURI, shortenAddress } from '@/lib/utils';
import { AnimatePresence } from 'motion/react';
import { getChainFromId, GetSwapQuoteRequestBody, Token } from '@raylac/shared';
import { ArrowUpDown, ChevronDownIcon, Loader2, Wallet } from 'lucide-react';
import { motion } from 'framer-motion';
import { useCallback, useEffect, useState } from 'react';
import { getAddress, Hex, parseEther, zeroAddress } from 'viem';
import { useAccount, useChainId, useSwitchChain } from 'wagmi';
import TokenLogoWithChain from '../TokenLogoWithChain/TokenLogoWithChain';
import { Skeleton } from '../ui/skeleton';
import Image from 'next/image';
import { toast } from '@/hooks/use-toast';

const SwapButton = ({
  chainId,
  onClick,
  outputToken,
  isSwapping,
  needsSwitchToAddress,
}: {
  chainId: number;
  onClick: () => void;
  inputToken: Token;
  outputToken: Token;
  needsSwitchToAddress: Hex | null;
  isSwapping: boolean;
}) => {
  const connectedChainId = useChainId();

  const { switchChainAsync } = useSwitchChain();

  const needsSwitchChain = chainId !== connectedChainId;

  return (
    <motion.div
      whileHover={{ scale: needsSwitchToAddress ? 1 : 1.025 }}
      whileTap={{ scale: needsSwitchToAddress ? 1 : 0.975 }}
      className={cn(
        'bg-foreground rounded-[32px] h-[46px] flex flex-row items-center justify-center cursor-pointer',
        needsSwitchToAddress ? 'opacity-50' : ''
      )}
      onClick={async () => {
        if (needsSwitchToAddress) {
          return;
        }

        if (needsSwitchChain) {
          await switchChainAsync({ chainId });
        }

        onClick();
      }}
    >
      {isSwapping ? (
        <div className="flex flex-row items-center gap-x-[8px]">
          <Loader2 className="w-[20px] h-[20px] text-bg2 animate-spin" />
        </div>
      ) : needsSwitchToAddress ? (
        <div className="flex flex-row items-center gap-x-[8px]">
          <div className="text-bg2 font-bold">Switch to</div>
          <div className="text-bg2 font-bold">
            {shortenAddress(needsSwitchToAddress)}
          </div>
        </div>
      ) : (
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
      )}
    </motion.div>
  );
};

const CardHeader = ({
  chainId,
  isOpen,
  onOpenChange,
  onBalanceClick,
  fromToken,
  fromTokenBalance,
}: {
  chainId: number;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onBalanceClick: () => void;
  fromToken: Token;
  fromTokenBalance: {
    balanceFormatted: string;
    balanceUsd: string;
  };
}) => {
  return (
    <div
      className="flex flex-row items-center justify-between gap-x-[12px] cursor-pointer"
      onClick={() => onOpenChange(!isOpen)}
    >
      <div className="text-muted-foreground flex flex-row items-center gap-x-[6px]">
        <TokenLogoWithChain
          logoURI={getTokenLogoURI(fromToken)}
          chainId={chainId}
          size={36}
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
            ${fromTokenBalance?.balanceUsd}
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

const containsNonNumericCharacters = (text: string) => {
  return /[^0-9.]/.test(text);
};

interface SwapCardProps {
  chainId: number;
  fromToken: Token;
  toToken: Token;
  fromTokenBalance: {
    balanceFormatted: string;
    balanceUsd: string;
  };
  address: Hex;
}

const SwapCard = ({
  chainId,
  fromToken,
  toToken,
  fromTokenBalance,
  address,
}: SwapCardProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const [inputToken, setInputToken] = useState<Token>(fromToken);
  const [outputToken, setOutputToken] = useState<Token>(toToken);

  const [amountInputText, setAmountInputText] = useState('');

  const account = useAccount();

  const {
    mutateAsync: getSingleChainSwapQuote,
    data: quote,
    isPending: isGettingQuote,
    reset: resetQuote,
  } = trpc.getSingleChainSwapQuote.useMutation({
    throwOnError: false,
  });

  const { mutateAsync: signAndSubmitSwap, isPending: isSwapping } = useSwap();

  useEffect(() => {
    if (amountInputText && !containsNonNumericCharacters(amountInputText)) {
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
  }, [amountInputText, chainId, inputToken, outputToken]);

  const onConvertClick = useCallback(async () => {
    if (
      quote &&
      getAddress(account.address ?? zeroAddress) === getAddress(address)
    ) {
      await signAndSubmitSwap({
        swapSteps: quote.swapSteps,
      });

      setAmountInputText('');
      resetQuote();

      toast({
        title: 'Swap successful',
      });
    }
  }, [quote, signAndSubmitSwap, account]);

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
    if (fromTokenBalance !== undefined) {
      setAmountInputText(fromTokenBalance.balanceFormatted);
    }
  };

  const amountInUsd = quote?.amountInUsd || '0';
  const amountOutUsd = quote?.amountOutUsd || '0';
  const amountOutFormatted = quote?.amountOutFormatted || '0';

  const needsSwitchToAddress =
    getAddress(account.address ?? zeroAddress) !== getAddress(address)
      ? getAddress(address)
      : null;

  return (
    <div className="flex flex-col gap-y-[48px] px-[22px] py-[16px] bg-bg2 rounded-[16px] w-full hover:bg-bg3">
      <CardHeader
        chainId={chainId}
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        onBalanceClick={onWalletBalanceClick}
        fromToken={fromToken}
        fromTokenBalance={fromTokenBalance}
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
              isSwapping={isSwapping}
              needsSwitchToAddress={needsSwitchToAddress}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SwapCard;
