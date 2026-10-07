import React from 'react';

interface GasFlameProps {
  className?: string;
  size?: number;
}

export default function GasFlame({ className = "w-7 h-7", size = 28 }: GasFlameProps) {
  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      {/* Sutil halo térmico azul/cian detrás */}
      <div className="absolute inset-0 rounded-full blur-md bg-cyan-500/20 pointer-events-none scale-125" />
      
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="relative z-10 drop-shadow-[0_0_8px_rgba(6,182,212,0.4)] transition-transform duration-300 hover:scale-105"
      >
        <defs>
          {/* Degradado característico del gas natural: base azul profundo a núcleo cian de alta temperatura */}
          <linearGradient id="gnvFlameEnvelope" x1="12" y1="22" x2="12" y2="2" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#1d4ed8" />      {/* Azul térmico base */}
            <stop offset="50%" stopColor="#06b6d4" />     {/* Cian combustión limpia */}
            <stop offset="100%" stopColor="#67e8f9" />    {/* Vértice de ignición */}
          </linearGradient>

          <linearGradient id="gnvFlameInner" x1="12" y1="20" x2="12" y2="10" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#0284c7" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#e0f2fe" stopOpacity="0.95" />
          </linearGradient>
        </defs>

        {/* Envolvente exterior de la llama */}
        <path
          d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"
          stroke="url(#gnvFlameEnvelope)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="url(#gnvFlameEnvelope)"
          fillOpacity="0.15"
        />

        {/* Núcleo interior (combustión estequiométrica concentrada) */}
        <path
          d="M12 18.5c-1.2 0-2.2-1-2.2-2.2 0-1.2 1-2.2 2.2-3.8 1.2 1.6 2.2 2.6 2.2 3.8 0 1.2-1 2.2-2.2 2.2z"
          fill="url(#gnvFlameInner)"
        />
      </svg>
    </div>
  );
}
