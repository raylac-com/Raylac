'use client';
import AddAddressButton from '@/components/AddAddressButton/AddAddressButton';
import PageTitle from '@/components/PageTitle/PageTitle';
import useAddresses from '@/hooks/useAddresses';
import useDeleteAddress from '@/hooks/useDeleteAddress';
import { shortenAddress } from '@/lib/utils';
import { X } from 'lucide-react';
import { Hex } from 'viem';

interface AddressListItemProps {
  address: Hex;
}

const AddressListItem = ({ address }: AddressListItemProps) => {
  const { mutate: deleteAddress } = useDeleteAddress();

  const onDeleteClick = () => {
    if (window.confirm(`Remove ${shortenAddress(address)}?`)) {
      deleteAddress(address);
    }
  };

  return (
    <div className="w-full flex flex-row items-center justify-between rounded-[16px] bg-bg2 py-[16px] px-[22px]">
      <div className="text-border">{shortenAddress(address)}</div>
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
    <div className="flex flex-col w-[350px]">
      <PageTitle>Addresses</PageTitle>
      <div className="flex flex-col gap-y-[16px]">
        {addresses?.map((address, index) => (
          <AddressListItem address={address} key={index} />
        ))}
      </div>
      <div className="mt-[16px]">
        <AddAddressButton />
      </div>
    </div>
  );
};

export default Addresses;
