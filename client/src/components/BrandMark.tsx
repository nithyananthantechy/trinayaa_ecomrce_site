import React from "react";

interface BrandMarkProps {
  inverse?: boolean;
  compact?: boolean;
  className?: string;
}

export default function BrandMark({ inverse = false, compact = false, className = "" }: BrandMarkProps) {
  if (compact) {
    return (
      <div
        className={`brand-mark ${inverse ? "brand-mark-inverse" : ""} inline-flex items-center gap-2.5 select-none text-left shrink-0 ${className}`}
        aria-label="TRINAYAA — Pure Seeds · Raw Powders · True Herbs"
      >
        <img
          src={inverse ? "/images/brand/emblem_white.png" : "/images/brand/emblem_crisp.png"}
          alt="TRINAYAA Emblem"
          className="h-8 w-auto object-contain flex-shrink-0"
        />
        <div className="flex flex-col justify-center leading-none min-w-[150px]">
          <div
            className={`font-serif text-[15px] font-bold flex items-center justify-between w-full tracking-[0.05em] leading-none select-none px-0.5 ${
              inverse ? "text-white" : "text-[#6B1D2F]"
            }`}
            style={{ fontFamily: "'Cinzel', Georgia, serif" }}
          >
            <span>T</span>
            <span>R</span>
            <span>I</span>
            <span>N</span>
            <span>A</span>
            <span>Y</span>
            <span>A</span>
            <span>A</span>
          </div>
          <div
            className={`flex items-center justify-between gap-1 text-[6.5px] font-bold tracking-[0.08em] uppercase mt-1 leading-none ${
              inverse ? "text-[#E5DECF]" : "text-[#123D28]"
            }`}
            style={{ fontFamily: "Montserrat, system-ui, sans-serif" }}
          >
            <span className="text-[5.5px]">🍃</span>
            <span className="whitespace-nowrap">PURE SEEDS · RAW POWDERS</span>
            <span className="text-[5.5px]">🍃</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`brand-mark ${inverse ? "brand-mark-inverse" : ""} inline-flex items-center gap-2.5 sm:gap-3.5 select-none text-left ${className}`}
      aria-label="TRINAYAA — Pure Seeds · Raw Powders · True Herbs"
    >
      <img
        src={inverse ? "/images/brand/emblem_white.png" : "/images/brand/emblem_crisp.png"}
        alt="TRINAYAA Emblem"
        className="h-9 sm:h-10 md:h-11 w-auto object-contain flex-shrink-0"
      />
      <div className="flex flex-col justify-center leading-none min-w-[190px] sm:min-w-[210px]">
        {/* TRINAYAA calibrated full-length letter distribution centered over tagline */}
        <div
          className={`font-serif text-[17px] sm:text-[19px] md:text-[20px] font-bold flex items-center justify-between w-full tracking-[0.08em] leading-none select-none px-0.5 ${
            inverse ? "text-white" : "text-[#6B1D2F]"
          }`}
          style={{ fontFamily: "'Cinzel', Georgia, serif" }}
        >
          <span>T</span>
          <span>R</span>
          <span>I</span>
          <span>N</span>
          <span>A</span>
          <span>Y</span>
          <span>A</span>
          <span>A</span>
        </div>
        <div
          className={`flex items-center justify-between gap-1 text-[6.5px] sm:text-[7.5px] md:text-[8px] font-bold tracking-[0.14em] uppercase mt-1 leading-none ${
            inverse ? "text-[#E5DECF]" : "text-[#123D28]"
          }`}
          style={{ fontFamily: "Montserrat, system-ui, sans-serif" }}
        >
          <span className="text-[6px]">🍃</span>
          <span className="whitespace-nowrap">PURE SEEDS · RAW POWDERS · TRUE HERBS</span>
          <span className="text-[6px]">🍃</span>
        </div>
      </div>
    </div>
  );
}
