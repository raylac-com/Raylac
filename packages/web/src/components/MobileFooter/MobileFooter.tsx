'use client';
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

const MobileFooter = () => {
  const pathname = usePathname();

  if (pathname === '/start' || pathname === '/watch-mode') {
    return null;
  }

  return (
    <div className="fixed bottom-[16px] left-[50%] translate-x-[-50%] w-[350px] md:hidden h-[60px] flex flex-row justify-center items-center gap-x-[87px] bg-bg2 rounded-[38px]">
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

export default MobileFooter;
