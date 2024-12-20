'use client';
import useSignAndSubmitSwap from '@/hooks/useSignAndSubmitSwap';
import { trpc } from '@/lib/trpc';
import { cn } from '@/lib/utils';
import {
  ETH,
  getChainFromId,
  GetSwapQuoteRequestBody,
  WST_ETH,
} from '@raylac/shared';
import { Wallet } from 'lucide-react';
import Image from 'next/image';
import { useCallback, useEffect, useState } from 'react';
import { parseEther } from 'viem';
import { useAccount, useChainId, useSwitchChain } from 'wagmi';

const WalletBalance = ({
  balanceFormatted,
  usdBalanceFormatted,
}: {
  balanceFormatted: string;
  usdBalanceFormatted: string;
}) => {
  return (
    <div className="flex flex-row items-center text-muted-foreground gap-x-[4px]">
      <Wallet className="w-[17px] h-[17px]" />
      <div>
        {balanceFormatted} ETH ~= ${usdBalanceFormatted}
      </div>
    </div>
  );
};

const SwapButton = ({
  chainId,
  onClick,
}: {
  chainId: number;
  onClick: () => void;
}) => {
  const connectedChainId = useChainId();

  const { switchChainAsync } = useSwitchChain();

  const needsSwitchChain = chainId !== connectedChainId;

  return (
    <div
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
      <div className="text-background font-bold">Convert to wstETH</div>
    </div>
  );
};

interface StakeCardProps {
  chainId: number;
  balance: bigint;
  balanceFormatted: string;
  balanceUsd: string;
}

const StakeCard = ({
  chainId,
  balanceFormatted,
  balanceUsd,
}: StakeCardProps) => {
  const [amountInputText, setAmountInputText] = useState('0');
  const { address } = useAccount();

  const { mutateAsync: getSingleChainSwapQuote, data: quote } =
    trpc.getSingleChainSwapQuote.useMutation({
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

  return (
    <div className="flex flex-col  px-[22px] py-[16px] bg-bg2 rounded-[16px] gap-y-[56px]">
      <div className="flex flex-row items-center gap-x-[12px] justify-between">
        <div className="text-foreground">{getChainFromId(chainId).name}</div>
        <WalletBalance
          balanceFormatted={balanceFormatted}
          usdBalanceFormatted={balanceUsd}
        />
      </div>
      {/** Input */}
      <div className="flex flex-col items-end">
        <div className="flex flex-row items-center gap-x-[12px]">
          <Image
            src="/eth.png"
            alt="eth-logo"
            width={42}
            height={42}
            className="w-[42px] h-[42px]"
          />
          <input
            className="h-[41px] w-[200px] bg-foreground rounded-[8px] px-[16px] py-[12px] text-background"
            type="number"
            placeholder="Amount"
            value={amountInputText}
            onChange={e => setAmountInputText(e.target.value)}
          />
          <div className="text-foreground text-2lg">ETH</div>
        </div>
        <div className="text-muted-foreground">${quote?.amountInUsd}</div>
      </div>
      {/** Output */}
      <div className="flex flex-row items-center gap-x-[12px]">
        <Image
          src="/eth.png"
          alt="eth-logo"
          width={42}
          height={42}
          className="w-[42px] h-[42px]"
        />
        <div className="flex flex-col gap-y-[4px]">
          <div>{quote?.amountOutFormatted} wstETH</div>
          <div className="text-muted-foreground">${quote?.amountOutUsd}</div>
        </div>
      </div>
      <SwapButton chainId={chainId} onClick={onConvertClick} />
    </div>
  );
};

export default StakeCard;
