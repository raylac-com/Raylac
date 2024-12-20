import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { formatEther } from 'viem';
import { Skeleton } from '../ui/skeleton';

interface StakedETHCardProps {
  stakedBalance: bigint;
  isLoading: boolean;
}

const StakedETHCard = ({ stakedBalance, isLoading }: StakedETHCardProps) => {
  const router = useRouter();

  const onCardClick = () => {
    router.push(`/steth/balance`);
  };

  return (
    <div
      className="bg-bg2 w-[350px] rounded-[32px] flex flex-col gap-y-[86px] px-[28px] pt-[32px] pb-[22px] cursor-pointer"
      onClick={onCardClick}
    >
      <div className="flex flex-col gap-y-[4px]">
        <div className="text-xl">
          {isLoading ? (
            <Skeleton className="h-[48px] w-full rounded-[8px]" />
          ) : (
            `${formatEther(stakedBalance)} wstETH`
          )}
        </div>
        <div className="text-base text-muted-foreground">$123.45</div>
      </div>
      <div className="flex flex-row justify-between">
        <div className="flex flex-row gap-x-[6px] items-center">
          <Image
            src="/wsteth.svg"
            alt="wsteth-logo"
            width={24}
            height={24}
            className="w-[24px] h-[24px]"
          />
          <div>Staked ETH</div>
        </div>
        <div>APY 2.3%</div>
      </div>
    </div>
  );
};

export default StakedETHCard;
