import Link from 'next/link';
const Header = () => {
  return (
    <div className="flex w-full flex-row items-center justify-between px-[32px] h-[80px]">
      <Link href="/swap">
        <div className="text-border cursor-pointer">Raylac</div>
      </Link>
      <div className="text-border">
        <span className="font-bold cursor-pointer">Sign up </span>
        to get updates
      </div>
    </div>
  );
};

export default Header;
