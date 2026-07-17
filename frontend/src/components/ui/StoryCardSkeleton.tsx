import React from 'react';
import { Skeleton } from './Skeleton';

export function StoryCardSkeleton() {
  return (
    <div className="flex flex-col gap-3 p-3 bg-white/40 dark:bg-slate-800/40 rounded-2xl shadow-sm border border-white/50 dark:border-slate-700/50 backdrop-blur-md">
      {/* Cover Image Skeleton */}
      <Skeleton className="w-full aspect-[3/4] rounded-xl" />
      
      {/* Content Skeleton */}
      <div className="flex flex-col gap-2 mt-2">
        {/* Title */}
        <Skeleton className="h-5 w-3/4 rounded-md" />
        <Skeleton className="h-5 w-1/2 rounded-md" />
        
        {/* Author & Stats row */}
        <div className="flex items-center justify-between mt-3">
          <Skeleton className="h-4 w-1/3 rounded-md" />
          <div className="flex gap-2">
            <Skeleton className="h-6 w-12 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function StoryGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <StoryCardSkeleton key={i} />
      ))}
    </div>
  );
}
