import React from 'react';

export const AttendanceDashboard: React.FC<{ present: number; absent: number; total: number }> = ({ present, absent, total }) => (
  <div className="w-full max-w-md mx-auto my-8 p-6 bg-white dark:bg-gray-900 rounded-lg shadow flex flex-col items-center">
    <div className="text-lg font-bold mb-2">Attendance Overview</div>
    <div className="flex gap-6 mb-2">
      <div className="flex flex-col items-center">
        <span className="text-green-500 font-bold text-2xl">{present}</span>
        <span className="text-xs text-gray-400">Present</span>
      </div>
      <div className="flex flex-col items-center">
        <span className="text-red-500 font-bold text-2xl">{absent}</span>
        <span className="text-xs text-gray-400">Absent</span>
      </div>
      <div className="flex flex-col items-center">
        <span className="text-blue-500 font-bold text-2xl">{total}</span>
        <span className="text-xs text-gray-400">Total</span>
      </div>
    </div>
  </div>
);
