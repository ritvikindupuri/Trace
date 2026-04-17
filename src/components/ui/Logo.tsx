import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
}

export default function Logo({ className = "", size = 32 }: LogoProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div 
        className="rounded-full border-4 border-[#1D1D1F] flex items-center justify-center relative bg-white shadow-sm"
        style={{ width: size * 2, height: size * 2 }}
      >
        <div 
          className="bg-[#1D1D1F] rotate-45"
          style={{ width: size, height: 2 }}
        ></div>
        <div 
          className="absolute bg-blue-500 rounded-full"
          style={{ 
            width: size / 4, 
            height: size / 4, 
            top: size / 4, 
            right: size / 4 
          }}
        ></div>
      </div>
      <span 
        className="font-bold tracking-tight text-[#1D1D1F]"
        style={{ fontSize: size }}
      >
        Trace
      </span>
    </div>
  );
}
