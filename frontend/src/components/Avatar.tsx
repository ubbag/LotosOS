import React from 'react';
import { clsx } from 'clsx';

interface AvatarProps {
  name: string;
  size?: 'sm' | 'md' | 'lg';
  imageUrl?: string;
  className?: string;
}

const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ name, size = 'md', imageUrl, className }, ref) => {
    const getInitials = (fullName: string): string => {
      const parts = fullName.trim().split(' ').filter(Boolean);
      if (parts.length === 1) {
        return parts[0].substring(0, 2).toUpperCase();
      }
      return (parts[0][0] + (parts[parts.length - 1][0] || '')).toUpperCase();
    };

    const sizeClasses = {
      sm: 'h-8 w-8 text-xs',
      md: 'h-10 w-10 text-sm',
      lg: 'h-12 w-12 text-base',
    };

    const colors = [
      'bg-primary/20 text-primary-dark',
      'bg-secondary/20 text-secondary-dark',
      'bg-success/20 text-success',
      'bg-danger/20 text-danger',
      'bg-warning/20 text-warning',
      'bg-fuchsia-500/20 text-fuchsia-800',
      'bg-rose-500/20 text-rose-800',
    ];

    const colorIndex = (name || '').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
    const colorClass = colors[colorIndex];

    return (
      <div
        ref={ref}
        className={clsx(
          'relative flex shrink-0 items-center justify-center rounded-full',
          sizeClasses[size],
          className
        )}
      >
        {imageUrl ? (
          <img
            className="aspect-square h-full w-full rounded-full"
            src={imageUrl}
            alt={name}
          />
        ) : (
          <div
            className={clsx(
              'flex h-full w-full items-center justify-center rounded-full font-semibold',
              colorClass
            )}
          >
            {getInitials(name)}
          </div>
        )}
      </div>
    );
  }
);

Avatar.displayName = 'Avatar';

export { Avatar };

