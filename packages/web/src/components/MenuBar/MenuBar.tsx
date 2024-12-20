'use client';
import { ArrowLeftRight, Home } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const MenuItem = ({ icon, href }: { icon: React.ReactNode; href: string }) => {
  return (
    <Link href={href}>
      <div className="cursor-pointer w-[24px] h-[24px] text-border">{icon}</div>
    </Link>
  );
};

const MenuBar = () => {
  const pathname = usePathname();

  if (pathname === '/start' || pathname === '/watch-mode') {
    return null;
  }

  return (
    <div className="fixed left-[20vw] w-[60px] h-[460px] py-[120px] top-1/2 -translate-y-1/2 flex flex-col items-center justify-between bg-bg2 rounded-[8px]">
      <MenuItem icon={<Home />} href="/" />
      <MenuItem icon={<ArrowLeftRight />} href="/stake" />
    </div>
  );
};

export default MenuBar;
