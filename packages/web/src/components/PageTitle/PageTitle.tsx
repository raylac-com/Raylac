import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

const PageTitle = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => {
  return (
    <div
      className={cn(
        'w-full text-left text-foreground text-md font-bold py-[16px]',
        className
      )}
    >
      <div className="w-[350px]">{children as React.ReactNode}</div>
    </div>
  );
};

export default PageTitle;
