import React from 'react';

export const Toast: React.FC<{ message: string; type?: 'success' | 'error' | 'info' }> = ({ message, type = 'info' }) => {
  const color = type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500';
  return (
    <div className={`fixed top-6 right-6 z-50 px-4 py-2 rounded shadow text-white ${color} animate-fade-in`}>{message}</div>
  );
};
