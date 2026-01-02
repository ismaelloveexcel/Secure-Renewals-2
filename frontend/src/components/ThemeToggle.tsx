import React from 'react';

export const ThemeToggle: React.FC<{ onToggle: () => void; dark: boolean }> = ({ onToggle, dark }) => (
  <button
    onClick={onToggle}
    className="fixed top-4 right-4 z-50 bg-gray-200 dark:bg-gray-800 rounded-full p-2 shadow hover:scale-105 transition"
    aria-label="Toggle theme"
  >
    {dark ? (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m8.66-13.66l-.71.71M4.05 19.95l-.71.71M21 12h-1M4 12H3m16.95 7.05l-.71-.71M4.05 4.05l-.71-.71M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
    ) : (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12.79A9 9 0 1111.21 3a7 7 0 009.79 9.79z" /></svg>
    )}
  </button>
);
