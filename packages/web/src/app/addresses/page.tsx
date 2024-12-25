'use client';
import AddAddressButton from '@/components/AddAddressButton/AddAddressButton';
import PageTitle from '@/components/PageTitle/PageTitle';
import useAddresses from '@/hooks/useAddresses';
import useDeleteAddress from '@/hooks/useDeleteAddress';
import { getWalletIcon, shortenAddress } from '@/lib/utils';
import { X } from 'lucide-react';
import Image from 'next/image';
import { Hex } from 'viem';

interface AddressListItemProps {
  address: Hex;
  connectorId: string;
}

const AddressListItem = ({ address, connectorId }: AddressListItemProps) => {
  const { mutate: deleteAddress } = useDeleteAddress();

  const onDeleteClick = () => {
    if (window.confirm(`Remove ${shortenAddress(address)}?`)) {
      deleteAddress(address);
    }
  };

  return (
    <div className="w-full flex flex-row items-center justify-between rounded-[16px] bg-bg2 py-[16px] px-[22px]">
      <div className="flex flex-row items-center gap-x-[6px]">
        <Image
          src={getWalletIcon(connectorId)}
          alt={connectorId}
          width={24}
          height={24}
        />
        <div className="text-border">{shortenAddress(address)}</div>
      </div>
      <X
        className="w-[20px] h-[20px] text-border cursor-pointer"
        onClick={onDeleteClick}
      />
    </div>
  );
};

const Addresses = () => {
  const { data: addresses } = useAddresses();

  return (
    <div className="flex flex-col w-[350px] md:w-[400px]">
      <PageTitle>Addresses</PageTitle>
      <div className="flex flex-col gap-y-[16px]">
        {addresses?.map(({ address, connectorId }, index) => (
          <AddressListItem
            address={address}
            connectorId={connectorId}
            key={index}
          />
        ))}
      </div>
      <div className="mt-[16px]">
        <AddAddressButton />
      </div>
    </div>
  );
};

export default Addresses;
