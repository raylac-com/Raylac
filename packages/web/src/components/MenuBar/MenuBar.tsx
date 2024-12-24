'use client';
import { useIsMobile } from '@/hooks/useIsMobile';
import { cn } from '@/lib/utils';
import { ArrowLeftRight, Home, List } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const MenuItem = ({
  icon,
  href,
  isCurrent,
}: {
  icon: React.ReactNode;
  href: string;
  isCurrent: boolean;
}) => {
  return (
    <Link href={href}>
      <div
        className={cn(
          'cursor-pointer w-[24px] h-[24px] text-border hover:text-[hsl(0,0%,40%)]',
          isCurrent && 'text-foreground'
        )}
      >
        {icon}
      </div>
    </Link>
  );
};

const MenuBar = () => {
  const pathname = usePathname();
  const isMobile = useIsMobile();

  if (pathname === '/start' || pathname === '/watch-mode') {
    return null;
  }

  if (isMobile) {
    return null;
  }

  return (
    <div className="hidden md:flex flex-col fixed left-[20vw] w-[60px] h-[460px] py-[137px] top-[152px]  items-center justify-between bg-bg2  rounded-[8px]">
      <MenuItem icon={<Home />} href="/" isCurrent={pathname === '/'} />
      <MenuItem
        icon={<ArrowLeftRight />}
        href="/swap"
        isCurrent={pathname === '/swap'}
      />
      <MenuItem
        icon={<List />}
        href="/addresses"
        isCurrent={pathname === '/addresses'}
      />
    </div>
  );
};

export default MenuBar;
