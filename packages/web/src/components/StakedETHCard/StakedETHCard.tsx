import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Skeleton } from '../ui/skeleton';

interface StakedETHCardProps {
  balanceFormatted?: string;
  balanceUsdFormatted?: string;
}

const StakedETHCard = ({
  balanceFormatted,
  balanceUsdFormatted,
}: StakedETHCardProps) => {
  const router = useRouter();

  const onCardClick = () => {
    router.push(`/wsteth/balance`);
  };

  return (
    <div
      className="bg-bg2 w-[350px] rounded-[32px] flex flex-col gap-y-[86px] px-[28px] pt-[32px] pb-[22px] cursor-pointer"
      onClick={onCardClick}
    >
      <div className="flex flex-col gap-y-[4px]">
        <div className="text-xl">
          {balanceFormatted === undefined ? (
            <Skeleton className="h-[48px] w-full rounded-[8px]" />
          ) : (
            `${balanceFormatted} wstETH`
          )}
        </div>
        <div className="text-base text-muted-foreground">
          {balanceUsdFormatted === undefined ? (
            <Skeleton className="h-[24px] w-[100px] rounded-[8px]" />
          ) : (
            `$${balanceUsdFormatted}`
          )}
        </div>
      </div>
      <div className="flex flex-row justify-between">
        <div className="flex flex-row gap-x-[6px] items-center">
          <Image
            src="/wsteth.png"
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