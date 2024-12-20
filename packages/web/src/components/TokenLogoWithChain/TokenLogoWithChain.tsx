import { getChainIcon } from '@/lib/utils';
import Image from 'next/image';

const TokenLogoWithChain = ({
  logoURI,
  chainId,
  size,
}: {
  logoURI: string;
  chainId: number;
  size: number;
}) => {
  return (
    <div className={`flex flex-row items-end`}>
      <Image
        src={logoURI}
        alt={`${chainId}-logo`}
        width={size}
        height={size}
        className={`rounded-full w-[${size}px] h-[${size}px]`}
      />
      <Image
        src={getChainIcon(chainId)}
        alt={`${chainId}-logo`}
        width={size / 2}
        height={size / 2}
        className={`w-[${size / 2}px] h-[${size / 2}px]]`}
        style={{
          // We use `style` instead of `className` because setting `ml-[${size / 4}px]` doesn't work
          marginLeft: `-${size / 4}px`,
        }}
      />
    </div>
  );
};

export default TokenLogoWithChain;
