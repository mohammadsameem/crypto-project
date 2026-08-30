import React from "react";

interface ProjectLogoProps {
  size?: number | string;
  className?: string;
}

export const ProjectLogo: React.FC<ProjectLogoProps> = ({
  size = 40,
  className = "",
}) => {
  return (
    <div
      className={`relative inline-flex items-center justify-center rounded-full overflow-hidden shrink-0 shadow-md ${className}`}
      style={{ width: size, height: size }}
      id="project-logo"
    >
      <svg
        viewBox="0 0 200 200"
        className="w-full h-full"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Radiant Gold Glow Gradients */}
          <radialGradient id="goldCoreGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFE066" stopOpacity="0.25" />
            <stop offset="60%" stopColor="#D4A359" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#0B0B0A" stopOpacity="1" />
          </radialGradient>

          <linearGradient id="goldLineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFF2A3" />
            <stop offset="50%" stopColor="#E5A93B" />
            <stop offset="100%" stopColor="#9E6B18" />
          </linearGradient>

          <linearGradient id="brightGold" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFF8D1" />
            <stop offset="50%" stopColor="#F5BE47" />
            <stop offset="100%" stopColor="#C4871A" />
          </linearGradient>

          <filter id="goldGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Deep Black Background */}
        <circle cx="100" cy="100" r="100" fill="#0D0C0A" />
        <circle cx="100" cy="100" r="98" fill="url(#goldCoreGlow)" />

        {/* Outer Tech Ring 1 (Tick marks & orbital) */}
        <circle
          cx="100"
          cy="100"
          r="92"
          stroke="#7A5617"
          strokeWidth="1"
          strokeDasharray="2 4"
          opacity="0.6"
        />
        <circle
          cx="100"
          cy="100"
          r="86"
          stroke="url(#goldLineGrad)"
          strokeWidth="1.5"
          opacity="0.8"
        />

        {/* Segmented Arc Outer Ring */}
        <circle
          cx="100"
          cy="100"
          r="80"
          stroke="url(#brightGold)"
          strokeWidth="2.5"
          strokeDasharray="38 12 18 10 50 14"
          strokeLinecap="round"
          filter="url(#goldGlow)"
        />

        {/* Concentric Middle HUD Rings */}
        <circle
          cx="100"
          cy="100"
          r="72"
          stroke="#D4A359"
          strokeWidth="1"
          strokeDasharray="4 6 12 6"
          opacity="0.7"
        />
        <circle
          cx="100"
          cy="100"
          r="65"
          stroke="url(#goldLineGrad)"
          strokeWidth="3.5"
          strokeDasharray="24 16 48 12 16 10"
        />

        {/* Inner Solid Tech Ring with notches */}
        <circle
          cx="100"
          cy="100"
          r="56"
          stroke="url(#brightGold)"
          strokeWidth="2"
          opacity="0.9"
        />
        <circle
          cx="100"
          cy="100"
          r="51"
          stroke="#E5A93B"
          strokeWidth="1"
          strokeDasharray="2 3"
          opacity="0.6"
        />

        {/* Futuristic Accent Tech Blocks on Rings */}
        <path
          d="M 100 12 L 100 20 M 100 180 L 100 188 M 12 100 L 20 100 M 180 100 L 188 100"
          stroke="url(#brightGold)"
          strokeWidth="2.5"
          strokeLinecap="square"
        />
        <path
          d="M 38 38 L 44 44 M 162 162 L 156 156 M 162 38 L 156 44 M 38 162 L 44 156"
          stroke="#E5A93B"
          strokeWidth="1.5"
        />

        {/* Central Glowing Aura Behind B */}
        <circle
          cx="100"
          cy="100"
          r="42"
          fill="#FFE066"
          fillOpacity="0.08"
          filter="url(#goldGlow)"
        />

        {/* Iconic Outlined Bitcoin Symbol */}
        <g transform="translate(68, 55) scale(0.65)" id="bitcoin-symbol">
          {/* Vertical Double Stems Top/Bottom */}
          <path
            d="M 32 6 L 32 18 M 52 6 L 52 18 M 32 118 L 32 130 M 52 118 L 52 130"
            stroke="url(#brightGold)"
            strokeWidth="5"
            strokeLinecap="round"
          />

          {/* Main Bitcoin Double-Loop Outline */}
          <path
            d="M 18 18 
               L 56 18 
               C 74 18 84 27 84 41 
               C 84 50 78 58 68 62 
               C 81 66 88 76 88 92 
               C 88 108 75 118 54 118 
               L 18 118 
               Z
               M 32 32 
               L 32 104
               M 32 32 
               L 52 32 
               C 62 32 68 36 68 45 
               C 68 54 62 58 52 58 
               L 32 58
               M 32 68 
               L 55 68 
               C 66 68 72 73 72 83 
               C 72 93 66 98 55 98 
               L 32 98"
            stroke="url(#brightGold)"
            strokeWidth="5"
            strokeLinejoin="round"
            strokeLinecap="round"
            fill="none"
            filter="url(#goldGlow)"
          />
        </g>
      </svg>
    </div>
  );
};
