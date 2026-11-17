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
          src="/images/brand/emblem_crisp.png"
          alt="TRINAYAA Emblem"
          className="h-7 sm:h-7.5 w-auto object-contain shrink-0 drop-shadow-xs"
        />
        <div className="flex flex-col items-center justify-center text-center leading-none">
          <div
            className={`font-serif text-[15px] sm:text-[16px] font-bold tracking-[0.08em] leading-tight select-none text-center ${
              inverse ? "text-white" : "text-[#7A1B28]"
            }`}
            style={{ fontFamily: "'Cinzel', Georgia, serif" }}
          >
            TRINAYAA
          </div>
          <div
            className={`flex items-center justify-center gap-0.5 text-[5.5px] sm:text-[6px] font-semibold tracking-[0.04em] uppercase mt-0.5 leading-none text-center ${
              inverse ? "text-[#E5DECF]" : "text-[#123D28]"
            }`}
            style={{ fontFamily: "'Montserrat', system-ui, sans-serif" }}
          >
            <span className="text-[5px] text-[#123D28]/80 font-bold">«</span>
            <span className="whitespace-nowrap px-0.5">PURE SEEDS · RAW POWDERS · TRUE HERBS</span>
            <span className="text-[5px] text-[#123D28]/80 font-bold">»</span>
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
        src="/images/brand/emblem_crisp.png"
        alt="TRINAYAA Emblem"
        className="h-9 sm:h-10 md:h-11 w-auto object-contain shrink-0 drop-shadow-xs"
      />
      <div className="flex flex-col items-center justify-center text-center leading-none">
        {/* Centralized, prominent TRINAYAA wordmark without letter-stretching */}
        <div
          className={`font-serif text-[19px] sm:text-[21px] md:text-[23px] font-bold tracking-[0.1em] leading-tight select-none text-center ${
            inverse ? "text-white" : "text-[#7A1B28]"
          }`}
          style={{ fontFamily: "'Cinzel', Georgia, serif" }}
        >
          TRINAYAA
        </div>
        <div
          className={`flex items-center justify-center gap-1.5 text-[6.5px] sm:text-[7.5px] md:text-[8px] font-bold tracking-[0.1em] uppercase mt-0.5 leading-none text-center ${
            inverse ? "text-[#E5DECF]" : "text-[#123D28]"
          }`}
          style={{ fontFamily: "'Montserrat', system-ui, sans-serif" }}
        >
          <span className="text-[7px] text-[#123D28]/80 font-bold">«</span>
          <span className="whitespace-nowrap">PURE SEEDS · RAW POWDERS · TRUE HERBS</span>
          <span className="text-[7px] text-[#123D28]/80 font-bold">»</span>
        </div>
      </div>
    </div>
  );
}
