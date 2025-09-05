// components/common/StatusBadge.tsx - Status Badge Component
'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export type StatusType = 
  | 'active' 
  | 'inactive' 
  | 'pending' 
  | 'approved' 
  | 'rejected' 
  | 'completed' 
  | 'cancelled'
  | 'draft'
  | 'published';

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const statusConfig: Record<StatusType, { 
  label: string; 
  className: string; 
  dotColor: string; 
}> = {
  active: {
    label: 'Actif',
    className: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800',
    dotColor: 'bg-green-500',
  },
  inactive: {
    label: 'Inactif',
    className: 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-950 dark:text-gray-300 dark:border-gray-800',
    dotColor: 'bg-gray-500',
  },
  pending: {
    label: 'En attente',
    className: 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-300 dark:border-yellow-800',
    dotColor: 'bg-yellow-500',
  },
  approved: {
    label: 'Approuvé',
    className: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800',
    dotColor: 'bg-blue-500',
  },
  rejected: {
    label: 'Refusé',
    className: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800',
    dotColor: 'bg-red-500',
  },
  completed: {
    label: 'Terminé',
    className: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800',
    dotColor: 'bg-green-500',
  },
  cancelled: {
    label: 'Annulé',
    className: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800',
    dotColor: 'bg-red-500',
  },
  draft: {
    label: 'Brouillon',
    className: 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-950 dark:text-gray-300 dark:border-gray-800',
    dotColor: 'bg-gray-400',
  },
  published: {
    label: 'Publié',
    className: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800',
    dotColor: 'bg-green-500',
  },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  className,
  size = 'md',
}) => {
  const config = statusConfig[status];
  
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base',
  };

  const dotSizeClasses = {
    sm: 'h-1.5 w-1.5',
    md: 'h-2 w-2',
    lg: 'h-2.5 w-2.5',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border font-medium',
        config.className,
        sizeClasses[size],
        className
      )}
    >
      <span className={cn('rounded-full', config.dotColor, dotSizeClasses[size])} />
      {config.label}
    </span>
  );
};
