import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

const MulticahinBadge = () => {
  const router = useRouter();

  return (
    <motion.div
      className="rounded-[16px] px-[12px] py-[4px] border-[1px] border-border cursor-pointer"
      whileTap={{ scale: 0.95 }}
      onClick={() => router.push('/eth/balance')}
    >
      Multicahin
    </motion.div>
  );
};

export default MulticahinBadge;
