import React from 'react';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse rounded-md bg-indigo-100/60 dark:bg-slate-700/50 backdrop-blur-sm ${className || ''}`}
      {...props}
    />
  );
}
