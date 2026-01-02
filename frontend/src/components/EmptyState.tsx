import React from 'react';

export const EmptyState: React.FC<{ message: string; illustrationUrl?: string }> = ({ message, illustrationUrl }) => (
  <div className="flex flex-col items-center justify-center py-12 text-center text-gray-400">
    {illustrationUrl && <img src={illustrationUrl} alt="Empty" className="w-32 h-32 mb-4 opacity-70" />}
    <div className="text-lg font-medium mb-2">{message}</div>
    <div className="text-sm">No data to display.</div>
  </div>
);
