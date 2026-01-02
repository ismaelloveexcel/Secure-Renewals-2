import React from 'react';

export const AttendanceCheckIn: React.FC<{ onCheckIn: () => void; checkedIn: boolean }> = ({ onCheckIn, checkedIn }) => (
  <button
    onClick={onCheckIn}
    className={`px-6 py-3 rounded-lg shadow text-white font-bold transition ${checkedIn ? 'bg-green-500' : 'bg-blue-600 hover:bg-blue-700'}`}
    disabled={checkedIn}
  >
    {checkedIn ? 'Checked In' : 'Check In'}
  </button>
);
