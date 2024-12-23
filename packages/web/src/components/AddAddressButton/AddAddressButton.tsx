import useAddAddress from '@/hooks/useAddAddress';
import useEnsAddress from '@/hooks/useEnsAddress';
import { Check, Plus } from 'lucide-react';
import { Hex } from 'viem';
import { useState } from 'react';
import { isAddress } from 'viem';

const AddButton = ({ onClick }: { onClick: () => void }) => {
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

const AddAddressButton = () => {
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
    <>
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
        <AddButton
          onClick={() => {
            setIsAddressInputOpen(true);
          }}
        />
      )}
    </>
  );
};

export default AddAddressButton;
