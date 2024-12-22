import ConnectWalletButton from '../ConnectWalletButton';
import Link from 'next/link';
const Header = () => {
  return (
    <div className="flex w-full flex-row items-center justify-between px-[32px] h-[80px]">
      <Link href="/swap">
        <div className="text-border cursor-pointer">Raylac</div>
      </Link>
      <div>
        <ConnectWalletButton />
      </div>
    </div>
  );
};

export default Header;
