import React from 'react';

export const Header: React.FC = () => {
  return (
    <header className="bg-surface border-b border-background-dark sticky top-0 z-10">
      <div className="h-16 flex items-center justify-between px-6">
        {/* Breadcrumbs or Page Title can go here */}
        <div />

        {/* Search, Notifications, etc. can go here */}
        <div />
      </div>
    </header>
  );
};
