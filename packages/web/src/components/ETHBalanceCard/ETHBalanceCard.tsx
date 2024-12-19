import Image from 'next/image';
import { formatEther } from 'viem';
import MulticahinBadge from '../MulticahinBadge/MulticahinBadge';
import { ChevronRightIcon, DropletIcon } from 'lucide-react';

interface ETHBalanceCardProps {
  balance: bigint;
}

const ETHBalanceCard = ({ balance }: ETHBalanceCardProps) => {
  return (
    <div className="flex flex-col w-[350px] px-[22px] py-[18px] gap-y-[22px] border-t-[2px] border-b-[2px] border-bg2">
      <div className="flex flex-row justify-between">
        <div className="flex flex-col gap-y-[4px]">
          <div>{formatEther(balance)} ETH</div>
          <div className="text-muted-foreground">${formatEther(balance)}</div>
        </div>
        <div className="flex flex-row gap-x-[6px] items-center">
          <DropletIcon className="w-[15px] h-[15px] text-tertiary" />
          <div className="text-tertiary font-bold cursor-pointer">
            Earn yield
          </div>
          <ChevronRightIcon className="w-[18px] h-[18px] text-tertiary" />
        </div>
      </div>
      <div className="flex flex-row gap-x-[6px] justify-between">
        <div className="flex flex-row gap-x-[6px] items-center">
          <Image
            src="/eth.png"
            alt="eth-logo"
            width={24}
            height={24}
            className="w-[24px] h-[24px]"
          />
          <div>Ethereum</div>
        </div>
        <MulticahinBadge />
      </div>
    </div>
  );
};

export default ETHBalanceCard;
