'use client';
import {
  Dialog as DialogPrimitive,
  DialogContent as DialogContentPrimitive,
  DialogHeader as DialogHeaderPrimitive,
  DialogTitle as DialogTitlePrimitive,
} from '@/components/ui/dialog';
import useAddresses from '@/hooks/useAddresses';
import { trpc } from '@/lib/trpc';
import { getTokenLogoURI } from '@/lib/utils';
import { Token, TokenSet } from '@raylac/shared';
import { Wallet } from 'lucide-react';
import Image from 'next/image';

// We need to do this to avoid some wired typescript warnings
const Dialog = DialogPrimitive as any;
const DialogContent = DialogContentPrimitive as any;
const DialogHeader = DialogHeaderPrimitive as any;
const DialogTitle = DialogTitlePrimitive as any;

const TokenListItem = ({
  token,
  balanceUsdFormatted,
  onClick,
}: {
  token: Token;
  balanceUsdFormatted?: string;
  onClick: () => void;
}) => {
  return (
    <div
      className="flex items-center justify-between cursor-pointer"
      onClick={onClick}
    >
      <div className="flex flex-row items-center gap-x-[8px]">
        <Image
          src={getTokenLogoURI(token)}
          alt={token.symbol}
          width={38}
          height={38}
        />
        <p>{token.symbol}</p>
      </div>
      {balanceUsdFormatted && (
        <div className="flex flex-row items-center gap-x-[6px]">
          <div className="text-border">${balanceUsdFormatted}</div>
          <Wallet className="w-[20px] h-[20px] text-border" />
        </div>
      )}
    </div>
  );
};

const SelectTokenDialog = ({
  open,
  setOpen,
  type,
  onSelect,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  type: 'input' | 'output';
  onSelect: (token: Token) => void;
}) => {
  const { data: addresses } = useAddresses();
  const { data: tokens } = trpc.getSet.useQuery({ set: TokenSet.ETH });

  const { data: tokenBalances } = trpc.getSetBalances.useQuery(
    {
      set: TokenSet.ETH,
      addresses: addresses ?? [],
    },
    {
      enabled: !!addresses,
    }
  );

  const selectableTokens =
    type === 'input'
      ? tokenBalances?.tokenBalances
      : tokens?.map(token => ({
          token,
          totalBalanceUsdFormatted: undefined,
        }));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[425px] border-none rounded-[16px]">
        <DialogHeader>
          <DialogTitle>
            Select {type === 'input' ? 'Input' : 'Output'} Token
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-y-[16px]">
          {selectableTokens?.map((token, index) => (
            <TokenListItem
              key={index}
              token={token.token}
              balanceUsdFormatted={token.totalBalanceUsdFormatted}
              onClick={() => {
                onSelect(token.token);
                setOpen(false);
              }}
            />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SelectTokenDialog;
