'use client';
import {
  Dialog as DialogPrimitive,
  DialogContent as DialogContentPrimitive,
  DialogHeader as DialogHeaderPrimitive,
  DialogTitle as DialogTitlePrimitive,
} from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import useAddAddress from '@/hooks/useAddAddress';
import useAddresses from '@/hooks/useAddresses';
import { getWalletIcon, shortenAddress } from '@/lib/utils';
import Image from 'next/image';
import { useCallback, useEffect } from 'react';
import { useAccount, useConnect, useConnectors, useDisconnect } from 'wagmi';

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
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
}) => {
  const { disconnectAsync } = useDisconnect();
  const { connect } = useConnect();

  const { addresses: connectedAddresses, connector } = useAccount();

  const { data: savedAddresses } = useAddresses();
  const connectors = useConnectors();

  const { mutate: addAddress } = useAddAddress();

  useEffect(() => {
    if (connector) {
      const newConnectedAddresses =
        connectedAddresses?.filter(
          a => !savedAddresses?.some(sa => sa.address === a)
        ) || [];

      if (newConnectedAddresses.length === 1) {
        toast({
          title: `Connected ${shortenAddress(newConnectedAddresses[0])} (${connector.name})`,
        });
      } else if (newConnectedAddresses.length > 1) {
        toast({
          title: `Connected ${newConnectedAddresses.length} addresses (${connector.name})`,
        });
      }

      for (const address of newConnectedAddresses) {
        addAddress({
          address,
          connectorId: connector.id,
        });
      }

      setOpen(false);
    }
  }, [savedAddresses, connectedAddresses]);

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
