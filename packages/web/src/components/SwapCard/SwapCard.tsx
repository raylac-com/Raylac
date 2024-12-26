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
import {
  useAccount,
  useChainId,
  useConnect,
  useDisconnect,
  useSwitchChain,
} from 'wagmi';
import TokenLogoWithChain from '../TokenLogoWithChain/TokenLogoWithChain';
import { Skeleton } from '../ui/skeleton';
import Image from 'next/image';
import { toast } from '@/hooks/use-toast';
import useAddresses from '@/hooks/useAddresses';

const SwapButton = ({
  quoteLoaded,
  chainId,
  onClick,
  outputToken,
  isSwapping,
  address,
}: {
  quoteLoaded: boolean;
  chainId: number;
  onClick: () => void;
  inputToken: Token;
  outputToken: Token;
  address: Hex;
  isSwapping: boolean;
}) => {
  const connectedChainId = useChainId();
  const { data: addresses } = useAddresses();

  const { switchChainAsync } = useSwitchChain();
  const connectedAccount = useAccount();
  const { connectors, connectAsync } = useConnect();
  const { disconnectAsync } = useDisconnect();

  const needsSwitchChain = chainId !== connectedChainId;

  const onSwitchAccountClick = async () => {
    if (!addresses) {
      throw new Error('Addresses not loaded');
    }

    const connectorId = addresses.find(a => a.address === address)?.connectorId;

    if (!connectorId) {
      throw new Error(`No connector id found for address ${address}`);
    }

    const connector = connectors.find(c => c.id === connectorId);

    if (connector) {
      await disconnectAsync();
      await connectAsync({ connector });
    } else {
      window.alert(`Wallet ${connectorId} not found`);
    }
  };

  if (
    getAddress(connectedAccount.address ?? zeroAddress) !== getAddress(address)
  ) {
    return (
      <motion.div
        whileHover={{ scale: 1.025 }}
        whileTap={{ scale: 0.975 }}
        className="bg-foreground rounded-[32px] h-[46px] flex flex-row items-center justify-center cursor-pointer"
        onClick={onSwitchAccountClick}
      >
        <div className="flex flex-row items-center gap-x-[8px]">
          <div className="text-bg2 font-bold">Connect</div>
          <div className="text-bg2 font-bold">{shortenAddress(address)}</div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      whileHover={{ scale: quoteLoaded ? 1.025 : 1 }}
      whileTap={{ scale: quoteLoaded ? 0.975 : 1 }}
      className={cn(
        'bg-foreground rounded-[32px] h-[46px] flex flex-row items-center justify-center cursor-pointer',
        quoteLoaded ? 'opacity-100' : 'opacity-50'
      )}
      onClick={async () => {
        if (!quoteLoaded) {
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
      ) : (
        <div className="flex flex-row items-center gap-x-[8px]">
          <div className="text-bg2 font-bold">Swap to {outputToken.symbol}</div>
          <Image
            src={getTokenLogoURI(outputToken)}
            alt="output-token-logo"
            width={20}
            height={20}
            className="w-[20px] h-[20px] select-none"
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
  fromToken,
  fromTokenBalance,
  amountInputText,
  setAmountInputText,
}: {
  chainId: number;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  fromToken: Token;
  fromTokenBalance: {
    balanceUsd: string;
  };
  amountInputText: string;
  setAmountInputText: (text: string) => void;
}) => {
  return (
    <div
      className="flex flex-row items-center justify-between gap-x-[12px] cursor-pointer"
      onClick={() => onOpenChange(!isOpen)}
    >
      <div className="flex flex-row items-center gap-x-[8px]">
        <TokenLogoWithChain
          logoURI={getTokenLogoURI(fromToken)}
          chainId={chainId}
          size={36}
        />
        {!isOpen && (
          <div className="text-border">{getChainFromId(chainId).name}</div>
        )}
      </div>
      <div className="flex flex-row items-center gap-x-[16px]">
        {isOpen ? (
          <div
            className="flex flex-row items-center gap-x-[4px] cursor-pointer"
            onClick={e => e.stopPropagation()}
          >
            <input
              className="w-full h-[38px] font-bold border-[1px] bg-transparent border-border rounded-[10px] px-[12px] text-foreground outline-none"
              value={amountInputText}
              onChange={e => setAmountInputText(e.target.value)}
              spellCheck={false}
              autoFocus={true}
            />
            <div className="text-muted-foreground">{fromToken.symbol}</div>
          </div>
        ) : (
          <div className="flex flex-row items-center gap-x-[6px] cursor-pointer">
            <div className="text-muted-foreground">
              ${fromTokenBalance?.balanceUsd}
            </div>
            <Wallet className="w-[17px] h-[17px] text-muted-foreground" />
          </div>
        )}
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
    if (!quote) {
      throw new Error('onConvertClick: No quote');
    }

    if (getAddress(account.address ?? zeroAddress) !== getAddress(address)) {
      throw new Error('onConvertClick: Account address does not match address');
    }

    await signAndSubmitSwap({
      swapSteps: quote.swapSteps,
    });

    setAmountInputText('');
    resetQuote();

    toast({
      title: 'Swap successful',
    });
  }, [quote, signAndSubmitSwap, account]);

  const _onChangeDirectionClick = () => {
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

  const amountInUsd = quote?.amountInUsd;
  const amountOutUsd = quote?.amountOutUsd;

  return (
    <div className="flex flex-col px-[22px] py-[16px] bg-bg2 rounded-[16px] w-full hover:bg-bg3">
      <CardHeader
        chainId={chainId}
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        fromToken={fromToken}
        fromTokenBalance={fromTokenBalance}
        amountInputText={amountInputText}
        setAmountInputText={setAmountInputText}
      />
      <AnimatePresence>
        {isOpen && (
          <div className="flex flex-row items-center justify-between w-full mt-[8px]">
            <div
              className="flex flex-row items-center gap-x-[6px] cursor-pointer"
              onClick={onWalletBalanceClick}
            >
              <div className="text-muted-foreground">
                ${fromTokenBalance?.balanceUsd}
              </div>
              <Wallet className="w-[17px] h-[17px] text-muted-foreground" />
            </div>
            <div>
              <div className="text-muted-foreground">
                {isGettingQuote ? (
                  <Skeleton className="w-[100px] h-[24px] bg-background" />
                ) : amountInUsd ? (
                  `~$${amountInUsd}`
                ) : (
                  ''
                )}
              </div>
            </div>
          </div>
        )}
        {isOpen && (
          <motion.div
            key={`swap-card-${chainId}-${inputToken.symbol}-${outputToken.symbol}`}
            className="flex flex-col"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <ArrowUpDown className="ml-[10px] my-[14px] mr-[12px] w-[24px] h-[24px] cursor-pointer text-muted-foreground hover:text-foreground" />
            <div className="flex flex-row  items-center gap-x-[12px] justify-between">
              <div className="flex flex-row items-center gap-x-[10px]">
                {/** Output token logo */}
                <TokenLogoWithChain
                  logoURI={getTokenLogoURI(outputToken)}
                  chainId={chainId}
                  size={38}
                />
                {/** Output usd amount */}
                <div className="font-bold text-foreground">
                  {isGettingQuote ? (
                    <Skeleton className="w-[100px] h-[24px] bg-background" />
                  ) : amountOutUsd ? (
                    `$${amountOutUsd}`
                  ) : (
                    ''
                  )}
                </div>
              </div>
              {/** TODO: Output APY */}
            </div>
            <div className="mt-[30px]">
              <SwapButton
                chainId={chainId}
                onClick={onConvertClick}
                quoteLoaded={!!quote}
                inputToken={inputToken}
                outputToken={outputToken}
                isSwapping={isSwapping}
                address={address}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SwapCard;
