import { useEffect, useRef } from 'react';

interface QRCodeProps {
  value: string;
  size?: number;
}

export function QRCode({ value, size = 200 }: QRCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const loadQRCode = async () => {
      // Dynamic import for QR code library
      const QRCodeLib = await import('qrcode');
      
      if (canvasRef.current) {
        QRCodeLib.toCanvas(canvasRef.current, value, {
          width: size,
          margin: 2,
          color: {
            dark: '#ffffff',
            light: '#00000000',
          },
        });
      }
    };

    loadQRCode();
  }, [value, size]);

  return (
    <div className="glass rounded-xl p-4 inline-block">
      <canvas ref={canvasRef} />
    </div>
  );
}