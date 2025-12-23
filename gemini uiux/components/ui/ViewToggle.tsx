import React from 'react';
import { LayoutGrid, List } from 'lucide-react';

interface ViewToggleProps {
  viewMode: 'list' | 'grid';
  setViewMode: (mode: 'list' | 'grid') => void;
}

export const ViewToggle: React.FC<ViewToggleProps> = ({ viewMode, setViewMode }) => {
  return (
    <div className="flex bg-white p-1 rounded-lg border border-gray-200 shadow-sm">
      <button
        onClick={() => setViewMode('list')}
        className={`p-2 rounded-md transition-all ${
          viewMode === 'list'
            ? 'bg-blue-100 text-blue-600 shadow-sm'
            : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
        }`}
        title="Widok listy"
      >
        <List size={20} />
      </button>
      <button
        onClick={() => setViewMode('grid')}
        className={`p-2 rounded-md transition-all ${
          viewMode === 'grid'
            ? 'bg-blue-100 text-blue-600 shadow-sm'
            : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
        }`}
        title="Widok siatki"
      >
        <LayoutGrid size={20} />
      </button>
    </div>
  );
};
