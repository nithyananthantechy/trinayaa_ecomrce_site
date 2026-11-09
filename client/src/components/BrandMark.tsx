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
        className={`brand-mark ${inverse ? "brand-mark-inverse" : ""} inline-flex items-center gap-2 select-none shrink-0 ${className}`}
        aria-label="TRINAYAA — Pure Seeds · Raw Powders · True Herbs"
      >
        <img
          src={inverse ? "/images/brand/emblem_white.png" : "/images/brand/emblem_crisp.png"}
          alt="TRINAYAA Emblem"
          className="h-8 sm:h-8.5 w-auto object-contain shrink-0"
        />
        <div className="flex flex-col items-center justify-center text-center leading-none">
          <div
            className={`font-serif text-[17px] sm:text-[18px] font-bold tracking-[0.12em] leading-tight select-none text-center ${
              inverse ? "text-white" : "text-[#7A1B28]"
            }`}
            style={{ fontFamily: "'Cinzel', Georgia, serif" }}
          >
            TRINAYAA
          </div>
          <div
            className={`flex items-center justify-center gap-1 text-[6.5px] sm:text-[7px] font-bold tracking-[0.12em] uppercase mt-0.5 leading-none text-center ${
              inverse ? "text-[#E5DECF]" : "text-[#123D28]"
            }`}
            style={{ fontFamily: "Montserrat, system-ui, sans-serif" }}
          >
            <span className="text-[5.5px] opacity-80">🍃</span>
            <span className="whitespace-nowrap">PURE SEEDS · RAW POWDERS</span>
            <span className="text-[5.5px] opacity-80">🍃</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`brand-mark ${inverse ? "brand-mark-inverse" : ""} inline-flex items-center gap-2.5 sm:gap-3 select-none ${className}`}
      aria-label="TRINAYAA — Pure Seeds · Raw Powders · True Herbs"
    >
      <img
        src={inverse ? "/images/brand/emblem_white.png" : "/images/brand/emblem_crisp.png"}
        alt="TRINAYAA Emblem"
        className="h-10 sm:h-11 md:h-12 w-auto object-contain shrink-0"
      />
      <div className="flex flex-col items-center justify-center text-center leading-none">
        {/* Centralized, prominent TRINAYAA wordmark without letter-stretching */}
        <div
          className={`font-serif text-[20px] sm:text-[23px] md:text-[25px] font-bold tracking-[0.12em] leading-tight select-none text-center ${
            inverse ? "text-white" : "text-[#7A1B28]"
          }`}
          style={{ fontFamily: "'Cinzel', Georgia, serif" }}
        >
          TRINAYAA
        </div>
        <div
          className={`flex items-center justify-center gap-1.5 text-[7px] sm:text-[8px] md:text-[8.5px] font-bold tracking-[0.14em] uppercase mt-1 leading-none text-center ${
            inverse ? "text-[#E5DECF]" : "text-[#123D28]"
          }`}
          style={{ fontFamily: "Montserrat, system-ui, sans-serif" }}
        >
          <span className="text-[6.5px] opacity-80">🍃</span>
          <span className="whitespace-nowrap">PURE SEEDS · RAW POWDERS · TRUE HERBS</span>
          <span className="text-[6.5px] opacity-80">🍃</span>
        </div>
      </div>
    </div>
  );
}
