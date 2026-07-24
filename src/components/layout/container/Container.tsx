import { type ReactNode } from 'react';

type ContainerProps = {
  children: ReactNode;
  className?: string;
};

export function Container({ children, className }: ContainerProps) {
  return (
    <div className={['mx-auto max-w-[1440px] px-4 md:px-6', className || ''].join(' ')}>
      {children}
    </div>
  );
}
