import { ChevronLeftIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

const BackButton = () => {
  const router = useRouter();

  return (
    <div className="w-[600px] h-[42px] mb-[-42px]">
      <motion.div
        onClick={() => router.back()}
        whileTap={{ scale: 0.95 }}
        whileHover={{ scale: 1.05 }}
        className="flex flex-row items-center justify-start gap-x-[4px] text-border cursor-pointer"
      >
        <ChevronLeftIcon className="w-[18px] h-[18px]" />
        Back
      </motion.div>
    </div>
  );
};

export default BackButton;
