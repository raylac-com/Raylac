import { Skeleton } from '@/components/ui/skeleton';

const SwapCardsSkeleton = () => {
  return (
    <div className="flex flex-col gap-y-[16px] w-[400px] ">
      <Skeleton className="w-full h-[68px] bg-bg2 rounded-[16px]" />
      <Skeleton className="w-full h-[68px] bg-bg2 rounded-[16px]" />
      <Skeleton className="w-full h-[68px] bg-bg2 rounded-[16px]" />
    </div>
  );
};

export default SwapCardsSkeleton;
