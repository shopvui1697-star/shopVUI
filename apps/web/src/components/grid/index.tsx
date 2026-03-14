import clsx from 'clsx';

export function Grid({ children, className }: { children: React.ReactNode; className?: string }) {
  return <ul className={clsx('grid grid-flow-row gap-4', className)}>{children}</ul>;
}

export function GridItem({ children, className }: { children: React.ReactNode; className?: string }) {
  return <li className={clsx('aspect-square transition-opacity', className)}>{children}</li>;
}
