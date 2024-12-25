'use client';
import {
  Dialog as DialogPrimitive,
  DialogContent as DialogContentPrimitive,
  DialogHeader as DialogHeaderPrimitive,
  DialogTitle as DialogTitlePrimitive,
} from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { getWalletIcon, shortenAddress } from '@/lib/utils';
import Image from 'next/image';
import { useCallback } from 'react';
import { Hex } from 'viem';
import {
  useAccountEffect,
  useConnect,
  useConnectors,
  useDisconnect,
} from 'wagmi';

// We need to do this to avoid some wired typescript warnings
const Dialog = DialogPrimitive as any;
const DialogContent = DialogContentPrimitive as any;
const DialogHeader = DialogHeaderPrimitive as any;
const DialogTitle = DialogTitlePrimitive as any;

const WalletListItem = ({
  connectorId,
  onClick,
}: {
  connectorId: string;
  onClick: () => void;
}) => {
  const connectors = useConnectors();
  const connector = connectors.find(c => c.id === connectorId);

  if (!connector) {
    throw new Error(`Connector not found for connector id ${connectorId}`);
  }

  const name = connector.name;

  return (
    <div
      className="flex flex-row border-border border-[1px] rounded-[16px] gap-x-[10px] items-center px-[21px] py-[16px] cursor-pointer"
      onClick={onClick}
    >
      <Image
        src={getWalletIcon(connectorId)}
        alt={name}
        width={32}
        height={32}
      />
      <div className="text-border">{name}</div>
    </div>
  );
};

const AddAddressDialog = ({
  open,
  setOpen,
  onAddressConnect,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  onAddressConnect: ({
    address,
    connectorId,
  }: {
    address: Hex;
    connectorId: string;
  }) => void;
}) => {
  const { disconnectAsync } = useDisconnect();
  const { connect } = useConnect();

  const connectors = useConnectors();

  useAccountEffect({
    onConnect(data) {
      if (data.addresses.length === 1) {
        toast({
          title: `Added ${shortenAddress(data.address)} (${data.connector.name})`,
        });
      } else {
        toast({
          title: `Added ${data.addresses.length} addresses (${data.connector.name})`,
        });
      }

      for (const address of data.addresses) {
        onAddressConnect({
          address,
          connectorId: data.connector.id,
        });
      }

      setOpen(false);
    },
  });

  const onConnectClick = useCallback(
    async (connectorId: string) => {
      const connector = connectors.find(
        connector => connector.id === connectorId
      );

      if (!connector) {
        throw new Error('Connector not found');
      }

      await disconnectAsync();
      connect({ connector });
    },
    [connectors, disconnectAsync]
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[425px] border-none rounded-[32px]">
        <DialogHeader>
          <DialogTitle>Connect Wallet</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-y-[16px] mt-[42px]">
          <WalletListItem
            connectorId="metaMaskSDK"
            onClick={() => {
              onConnectClick('metaMaskSDK');
            }}
          />
          <WalletListItem
            connectorId="me.rainbow"
            onClick={() => {
              onConnectClick('me.rainbow');
            }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddAddressDialog;
