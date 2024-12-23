'use client';
import useAddresses from '@/hooks/useAddresses';
import { saveAddress, shortenAddress } from '@/lib/utils';
import { Check, Plus } from 'lucide-react';
import { useState } from 'react';
import { Hex, isAddress } from 'viem';

interface AddressListItemProps {
  address: Hex;
}

const AddressListItem = ({ address }: AddressListItemProps) => {
  return (
    <div className="w-full flex flex-row items-center justify-between rounded-[16px] border-[1px] border-border py-[16px] px-[22px]">
      <div className="text-border">{shortenAddress(address)}</div>
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

  const handleAddAddress = () => {
    setIsAddressInputOpen(true);
  };

  const handleAddAddressConfirm = () => {
    if (inputText && isAddress(inputText)) {
      saveAddress(inputText as Hex);
      setIsAddressInputOpen(false);
      setInputText('');
    }
  };

  const handleCancel = () => {
    setIsAddressInputOpen(false);
    setInputText('');
  };

  return (
    <div className="flex flex-col gap-y-[16px] w-[350px]">
      {addresses?.map((address, index) => (
        <AddressListItem address={address} key={index} />
      ))}
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
              className="w-[20px] h-[20px] text-border cursor-pointer"
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
        <AddAddressButton onClick={handleAddAddress} />
      )}
    </div>
  );
};

export default Addresses;
