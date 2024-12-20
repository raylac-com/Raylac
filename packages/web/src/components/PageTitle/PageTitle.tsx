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
        'w-full text-left text-foreground text-lg font-bold p-[8px]',
        className
      )}
    >
      {children as React.ReactNode}
    </div>
  );
};

export default PageTitle;
