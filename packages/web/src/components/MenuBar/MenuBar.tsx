import { ArrowLeftRight, Home } from 'lucide-react';
import Link from 'next/link';

const MenuBar = () => {
  return (
    <div className="fixed bottom-[42px] px-[122px] left-1/2 -translate-x-1/2 w-[420px] h-[51px] flex flex-row items-center justify-between bg-bg2 p-2 gap-2 rounded-[16px]">
      <Link href="/">
        <Home className="cursor-pointer w-[24px] h-[24px] text-border" />
      </Link>
      <Link href="/stake">
        <ArrowLeftRight className="cursor-pointer w-[24px] h-[24px] text-border" />
      </Link>
      <div className="flex h-[42px] w-[420px] bg-background"></div>
    </div>
  );
};

export default MenuBar;
