import { Plus } from 'lucide-react';
import { useState } from 'react';
import AddAddressDialog from '../AddAddressDialog/AddAddressDialog';

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
  const [isAddAddressDialogOpen, setIsAddAddressDialogOpen] = useState(false);

  return (
    <>
      <AddButton
        onClick={() => {
          setIsAddAddressDialogOpen(true);
        }}
      />
      <AddAddressDialog
        open={isAddAddressDialogOpen}
        setOpen={setIsAddAddressDialogOpen}
      />
    </>
  );
};

export default AddAddressButton;
