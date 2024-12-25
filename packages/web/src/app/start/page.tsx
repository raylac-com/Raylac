'use client';

import AddAddressDialog from '@/components/AddAddressDialog/AddAddressDialog';
import { motion } from 'motion/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const StartPage = () => {
  const router = useRouter();
  const [openAddAddressDialog, setOpenAddAddressDialog] = useState(false);

  const onAddressConnect = () => {
    setOpenAddAddressDialog(false);
    router.push('/');
  };

  return (
    <>
      <div className="h-[80vh]  flex flex-col items-center justify-center pb-[48px] gap-y-[80px]">
        <div className="text-2lg text-center text-foreground font-bold">
          <p>See your staked ETH</p>
          <p>in one place</p>
        </div>
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex flex-col items-center justify-center rounded-[32px] bg-tertiary text-background font-bold h-[56px] w-[264px] cursor-pointer"
          onClick={() => setOpenAddAddressDialog(true)}
        >
          Connect Wallet
        </motion.div>
      </div>
      <AddAddressDialog
        open={openAddAddressDialog}
        setOpen={setOpenAddAddressDialog}
        onAddressConnect={onAddressConnect}
      />
    </>
  );
};

export default StartPage;
