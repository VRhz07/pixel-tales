import React from 'react';
import { Skeleton } from './Skeleton';

export function StoryCardSkeleton() {
  return (
    <div 
      className="flex flex-col gap-3 p-3 bg-white/40 dark:bg-slate-800/40 rounded-2xl shadow-sm border border-white/50 dark:border-slate-700/50 backdrop-blur-md"
      style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}
    >
      {/* Cover Image Skeleton */}
      <Skeleton className="w-full rounded-xl" style={{ width: '100%', aspectRatio: '3/4' }} />
      
      {/* Content Skeleton */}
      <div className="flex flex-col gap-2 mt-2" style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
        {/* Title */}
        <Skeleton className="h-5 w-3/4 rounded-md" style={{ height: '20px', width: '75%' }} />
        <Skeleton className="h-5 w-1/2 rounded-md" style={{ height: '20px', width: '50%' }} />
        
        {/* Author & Stats row */}
        <div className="flex items-center justify-between mt-3" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '12px' }}>
          <Skeleton className="h-4 w-1/3 rounded-md" style={{ height: '16px', width: '33%' }} />
          <div className="flex gap-2" style={{ display: 'flex', gap: '8px' }}>
            <Skeleton className="h-6 w-12 rounded-full" style={{ height: '24px', width: '48px', borderRadius: '9999px' }} />
          </div>
        </div>
      </div>
    </div>
  );
}

export function StoryGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div 
      className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
        gap: '16px',
        width: '100%'
      }}
    >
      {Array.from({ length: count }).map((_, i) => (
        <StoryCardSkeleton key={i} />
      ))}
    </div>
  );
}
