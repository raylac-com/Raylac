import { ChevronLeftIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';

const BackButton = () => {
  const router = useRouter();

  return (
    <div className="w-[600px] h-[42px] mb-[-42px]">
      <div
        onClick={() => router.back()}
        className="flex flex-row items-center justify-start gap-x-[4px] text-border cursor-pointer"
      >
        <ChevronLeftIcon className="w-[18px] h-[18px]" />
        Back
      </div>
    </div>
  );
};

export default BackButton;
