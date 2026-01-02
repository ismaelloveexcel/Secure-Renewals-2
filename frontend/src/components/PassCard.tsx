import React, { useState } from 'react';
import QRCode from 'qrcode.react';

// Example props, adjust as needed
type PassCardProps = {
  name: string;
  photoUrl: string;
  passType: string;
  passId: string;
  validFrom: string;
  validTo: string;
  status: string;
  logoUrl?: string;
  orgName?: string;
  timeline: string[];
  currentStage: number;
  qrValue: string;
  backContent?: React.ReactNode;
};

const statusColors: Record<string, string> = {
  Active: 'bg-green-500',
  Pending: 'bg-yellow-500',
  Expired: 'bg-gray-400',
  Revoked: 'bg-red-500',
};

export const PassCard: React.FC<PassCardProps> = ({
  name,
  photoUrl,
  passType,
  passId,
  validFrom,
  validTo,
  status,
  logoUrl,
  orgName,
  timeline,
  currentStage,
  qrValue,
  backContent,
}) => {
  const [flipped, setFlipped] = useState(false);
  return (
    <div className="relative w-80 aspect-[1.6/1] cursor-pointer group perspective" onClick={() => setFlipped(f => !f)}>
      <div className={`transition-transform duration-500 preserve-3d w-full h-full ${flipped ? 'rotate-y-180' : ''}`}>
        {/* Front Side */}
        <div className="absolute w-full h-full backface-hidden bg-white rounded-lg shadow-md border flex flex-col justify-between p-4">
          <div className="flex items-center justify-between">
            {logoUrl && <img src={logoUrl} alt="Logo" className="h-6" />}
            <span className={`text-xs px-3 py-1 rounded-full text-white ${statusColors[status] || 'bg-gray-500'}`}>{status}</span>
          </div>
          <div className="flex items-center gap-4 mt-2">
            <img src={photoUrl} alt="Profile" className="w-16 h-16 rounded-full object-cover border" />
            <div>
              <div className="font-semibold text-lg">{name}</div>
              <div className="text-sm text-gray-500">{passType}</div>
            </div>
          </div>
          <div className="flex flex-col gap-1 mt-2 text-xs text-gray-600">
            <div>ID: {passId}</div>
            <div>Valid: {validFrom} - {validTo}</div>
          </div>
          {/* Timeline */}
          <div className="flex items-center justify-between mt-2">
            {timeline.map((stage, idx) => (
              <div key={stage} className="flex-1 flex flex-col items-center">
                <div className={`w-2 h-2 rounded-full ${idx <= currentStage ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
                <span className={`text-[10px] mt-1 ${idx === currentStage ? 'font-bold text-blue-700' : 'text-gray-400'}`}>{stage}</span>
                {idx < timeline.length - 1 && <div className="w-full h-0.5 bg-gray-200 mt-1" />}
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between mt-2">
            <QRCode value={qrValue} size={48} />
            <span className="text-xs text-gray-400">{orgName}</span>
          </div>
        </div>
        {/* Back Side */}
        <div className="absolute w-full h-full backface-hidden rotate-y-180 bg-gray-50 rounded-lg shadow-md border flex flex-col justify-center items-center p-4">
          {backContent || <span className="text-gray-400">(Add actions or info here)</span>}
        </div>
      </div>
    </div>
  );
};
