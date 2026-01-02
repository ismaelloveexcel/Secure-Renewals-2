import React from 'react';

export const HelpButton: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <button
    onClick={onClick}
    className="fixed bottom-4 right-4 z-50 bg-blue-600 text-white rounded-full p-3 shadow hover:bg-blue-700 transition"
    aria-label="Help"
  >
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 14v.01M12 10a4 4 0 10-4 4h.01M12 10a4 4 0 014 4h-.01M12 14a4 4 0 01-4-4h.01M12 14a4 4 0 004-4h-.01" /></svg>
  </button>
);
