'use client';
import PageTitle from '@/components/PageTitle/PageTitle';
import useAddAddress from '@/hooks/useAddAddress';
import useAddresses from '@/hooks/useAddresses';
import useDeleteAddress from '@/hooks/useDeleteAddress';
import useEnsAddress from '@/hooks/useEnsAddress';
import { shortenAddress } from '@/lib/utils';
import { Check, Plus, X } from 'lucide-react';
import { useState } from 'react';
import { Hex, isAddress } from 'viem';

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

const AddAddressButton = ({ onClick }: { onClick: () => void }) => {
  return (
    <div
      className="flex flex-row items-center justify-center gap-x-[10px] py-[16px] px-[22px] hover:bg-bg2 rounded-[16px] cursor-pointer"
      onClick={onClick}
    >
      <Plus className="w-[20px] h-[20px] text-border" />
      <div className="text-border">Add Address</div>
    </div>
  );
};

const Addresses = () => {
  const { data: addresses } = useAddresses();

  const [isAddressInputOpen, setIsAddressInputOpen] = useState(false);
  const [inputText, setInputText] = useState('');

  const { data: ensAddress } = useEnsAddress(inputText);

  const { mutate: addAddress } = useAddAddress();

  const handleAddAddressConfirm = () => {
    if (inputText && isAddress(inputText)) {
      addAddress(inputText as Hex);
    }

    if (ensAddress) {
      addAddress(ensAddress as Hex);
    }
    setIsAddressInputOpen(false);
    setInputText('');
  };

  const handleCancel = () => {
    setIsAddressInputOpen(false);
    setInputText('');
  };

  const canAddAddress = inputText && (isAddress(inputText) || ensAddress);

  return (
    <div className="flex flex-col w-[350px]">
      <PageTitle>Addresses</PageTitle>
      <div className="flex flex-col gap-y-[16px]">
        {addresses?.map((address, index) => (
          <AddressListItem address={address} key={index} />
        ))}
      </div>
      <div className="mt-[16px]">
        {isAddressInputOpen ? (
          <div className="flex flex-col gap-y-[8px]">
            <div className="flex flex-row items-center gap-x-[10px] justify-between">
              <input
                autoFocus
                autoComplete="off"
                autoCapitalize="off"
                className="w-full text-left px-[23px] bg-background text-foreground cursor-pointer h-[46px] rounded-[8px] border border-border"
                placeholder="ENS or address"
                onChange={e => setInputText(e.target.value)}
              ></input>
              <Check
                className={`w-[20px] h-[20px] text-border cursor-pointer ${
                  canAddAddress ? 'opacity-100' : 'opacity-50'
                }`}
                onClick={handleAddAddressConfirm}
              />
            </div>
            <div
              className="w-full text-center text-border cursor-pointer"
              onClick={handleCancel}
            >
              Cancel
            </div>
          </div>
        ) : (
          <AddAddressButton
            onClick={() => {
              setIsAddressInputOpen(true);
            }}
          />
        )}
      </div>
    </div>
  );
};

export default Addresses;
