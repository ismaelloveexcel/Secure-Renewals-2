import React from 'react';

export const UndoRedo: React.FC<{ onUndo: () => void; onRedo: () => void; canUndo: boolean; canRedo: boolean }> = ({ onUndo, onRedo, canUndo, canRedo }) => (
  <div className="flex gap-2">
    <button
      onClick={onUndo}
      disabled={!canUndo}
      className="px-3 py-1 rounded bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-200 disabled:opacity-50"
    >Undo</button>
    <button
      onClick={onRedo}
      disabled={!canRedo}
      className="px-3 py-1 rounded bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-200 disabled:opacity-50"
    >Redo</button>
  </div>
);
