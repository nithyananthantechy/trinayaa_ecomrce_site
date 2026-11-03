import React from "react";

interface BrandMarkProps {
  inverse?: boolean;
  className?: string;
}

export default function BrandMark({ inverse = false, className = "" }: BrandMarkProps) {
  return (
    <div
      className={`brand-mark ${inverse ? "brand-mark-inverse" : ""} inline-flex items-center gap-2.5 sm:gap-3 select-none text-left ${className}`}
      aria-label="TRINAYAA — Pure Seeds · Raw Powders · True Herbs"
    >
      <img
        src={inverse ? "/images/brand/emblem_white.png" : "/images/brand/emblem_crisp.png"}
        alt="TRINAYAA Emblem"
        className="h-9 sm:h-10 md:h-11 w-auto object-contain flex-shrink-0"
      />
      <div className="flex flex-col justify-center leading-none">
        <span
          className={`font-serif text-lg sm:text-xl font-bold tracking-[0.14em] leading-none ${
            inverse ? "text-white" : "text-[#6B1D2F]"
          }`}
          style={{ fontFamily: "'Cinzel', Georgia, serif" }}
        >
          TRINAYAA
        </span>
        <div
          className={`flex items-center gap-1 text-[7px] sm:text-[8px] md:text-[8.5px] font-bold tracking-[0.15em] uppercase mt-1 leading-none ${
            inverse ? "text-[#E5DECF]" : "text-[#123D28]"
          }`}
          style={{ fontFamily: "Montserrat, system-ui, sans-serif" }}
        >
          <span className="text-[6.5px]">🍃</span>
          <span>PURE SEEDS · RAW POWDERS · TRUE HERBS</span>
          <span className="text-[6.5px]">🍃</span>
        </div>
      </div>
    </div>
  );
}

