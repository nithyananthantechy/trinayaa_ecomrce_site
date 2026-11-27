import React, { useMemo } from "react";
import { qrcodegen, Ecc } from "@/lib/qrcodegen";

export interface QRCodeDisplayProps {
  value: string;
  size?: number;
  className?: string;
  quietZone?: number;
  title?: string;
}

export function QRCodeDisplay({
  value,
  size = 120,
  className = "",
  quietZone = 2,
  title,
}: QRCodeDisplayProps) {
  const qrData = useMemo(() => {
    try {
      if (!value) return null;
      const qr = qrcodegen.QrCode.encodeText(value, Ecc.MEDIUM);
      const modCount = qr.size;
      const totalModules = modCount + quietZone * 2;

      let path = "";
      for (let y = 0; y < modCount; y++) {
        for (let x = 0; x < modCount; x++) {
          if (qr.getModule(x, y)) {
            const rx = x + quietZone;
            const ry = y + quietZone;
            path += `M${rx},${ry}h1v1h-1z `;
          }
        }
      }

      return {
        viewBox: `0 0 ${totalModules} ${totalModules}`,
        path: path.trim(),
        totalModules,
      };
    } catch (err) {
      console.error("Failed to generate QR code SVG", err);
      return null;
    }
  }, [value, quietZone]);

  if (!qrData) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-100 text-gray-400 text-[10px] border border-dashed border-gray-300 ${className}`}
        style={{ width: size, height: size }}
      >
        QR Unavailable
      </div>
    );
  }

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={qrData.viewBox}
      width={size}
      height={size}
      className={className}
      shapeRendering="crispEdges"
      aria-label={title || "QR Code"}
      style={{ display: "block" }}
    >
      {title && <title>{title}</title>}
      <rect width="100%" height="100%" fill="#ffffff" />
      <path d={qrData.path} fill="#000000" />
    </svg>
  );
}

export default QRCodeDisplay;
