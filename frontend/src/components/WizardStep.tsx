import React from 'react';

export const WizardStep: React.FC<{ step: number; total: number; title: string; description?: string }> = ({ step, total, title, description }) => (
  <div className="w-full max-w-md mx-auto my-8 p-6 bg-white dark:bg-gray-900 rounded-lg shadow flex flex-col items-center">
    <div className="text-xs text-gray-400 mb-2">Step {step} of {total}</div>
    <div className="text-lg font-bold mb-1">{title}</div>
    {description && <div className="text-sm text-gray-500 dark:text-gray-300 mb-2">{description}</div>}
    {/* Place step content here */}
  </div>
);
