import { ArrowLeftRight, Home } from 'lucide-react';
import Link from 'next/link';

const MenuItem = ({ icon, href }: { icon: React.ReactNode; href: string }) => {
  return (
    <Link href={href}>
      <div className="cursor-pointer w-[24px] h-[24px] text-border hover:text-muted-foreground">
        {icon}
      </div>
    </Link>
  );
};

const MenuBar = () => {
  return (
    <div className="fixed bottom-[0px] left-1/2 -translate-x-1/2 w-[520px] flex flex-col">
      <div className="h-[51px] px-[120px] flex flex-row items-center justify-between bg-bg2 p-2 gap-2 rounded-[16px] w-full">
        <MenuItem icon={<Home />} href="/" />
        <MenuItem icon={<ArrowLeftRight />} href="/stake" />
      </div>
      <div className="bg-background flex flex-row h-[42px] w-full"></div>
    </div>
  );
};

export default MenuBar;
