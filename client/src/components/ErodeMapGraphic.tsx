import React from "react";
import { MapPin } from "lucide-react";

export interface ErodeMapGraphicProps {
  mapColor?: string;
  textColor?: string;
  badgeBg?: string;
  badgeBorder?: string;
  pinColor?: string;
  className?: string;
  compact?: boolean;
}

export default function ErodeMapGraphic({
  mapColor = "#123D28",
  textColor = "#123D28",
  badgeBg = "rgba(255, 255, 255, 0.9)",
  badgeBorder = "rgba(18, 61, 40, 0.15)",
  pinColor = "#E11D48",
  className = "",
  compact = false,
}: ErodeMapGraphicProps) {
  // District map silhouette path extracted directly from user reference
  const erodePath =
    "M 93.6 1.3 L 82.1 0.0 L 75.6 5.2 L 73.1 10.4 L 59.0 3.9 L 37.2 3.9 L 21.8 10.4 L 11.5 19.5 L 3.8 32.5 L 0.0 54.5 L 3.8 70.1 L 16.7 88.3 L 37.2 98.7 L 59.0 98.7 L 74.4 92.2 L 84.6 83.1 L 92.3 70.1 L 96.2 54.5 L 94.9 40.3 L 88.5 26.0 L 93.6 23.4 L 98.7 16.9 L 98.7 7.8 Z";

  return (
    <div
      className={`erode-location-badge inline-flex items-center gap-3 p-2.5 rounded-xl border transition-all ${className}`}
      style={{
        backgroundColor: badgeBg,
        borderColor: badgeBorder,
      }}
      title="TRINAYAA Facility & Apothecary — Erode, Tamil Nadu, India"
    >
      {/* Vector Erode District Map Silhouette */}
      <div className="relative flex-shrink-0 w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center">
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full drop-shadow-xs"
          style={{ overflow: "visible" }}
          aria-label="Erode District Tamil Nadu Map Silhouette"
        >
          {/* Subtle glow / shadow beneath map */}
          <path
            d={erodePath}
            fill={mapColor}
            opacity="0.18"
            transform="translate(1.5, 2)"
          />
          {/* Main district silhouette */}
          <path
            d={erodePath}
            fill={mapColor}
            stroke={mapColor}
            strokeWidth="1.2"
            strokeLinejoin="round"
            opacity="0.88"
          />
          {/* River Bhavani / Cauvery confluence hint */}
          <path
            d="M 68 12 Q 74 36 72 52 T 88 88"
            fill="none"
            stroke={badgeBg}
            strokeWidth="1.5"
            opacity="0.45"
            strokeDasharray="2 2"
          />
          {/* Erode City Location Marker (Coordinates: 72, 52) */}
          <g transform="translate(72, 52)">
            {/* Outer radar pulse */}
            <circle r="7" fill={pinColor} opacity="0.25">
              <animate
                attributeName="r"
                values="4;9;4"
                dur="2.8s"
                repeatCount="indefinite"
              />
              <animate
                attributeName="opacity"
                values="0.35;0.05;0.35"
                dur="2.8s"
                repeatCount="indefinite"
              />
            </circle>
            {/* Inner pin point */}
            <circle r="3.2" fill={pinColor} stroke="#FFFFFF" strokeWidth="1" />
          </g>
        </svg>
      </div>

      {/* District & State Location Typography */}
      <div className="flex flex-col justify-center leading-tight">
        <div className="flex items-center gap-1.5">
          <span className="text-xs" role="img" aria-label="India Flag">
            🇮🇳
          </span>
          <span
            className="text-[11px] font-bold tracking-[0.14em] uppercase"
            style={{ color: textColor }}
          >
            ERODE
          </span>
        </div>
        <span
          className="text-[9.5px] font-semibold tracking-[0.12em] uppercase opacity-85 mt-0.5"
          style={{ color: textColor }}
        >
          TAMIL NADU
        </span>
        {!compact && (
          <span
            className="text-[8px] tracking-wider opacity-65 mt-1 flex items-center gap-1"
            style={{ color: textColor }}
          >
            <MapPin size={9} style={{ color: pinColor }} /> Apothecary Facility
          </span>
        )}
      </div>
    </div>
  );
}
