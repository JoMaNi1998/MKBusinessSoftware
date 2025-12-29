import React, { useEffect, useRef, useState } from 'react';
import QrScanner from 'qr-scanner';
import { X, Camera, AlertCircle } from 'lucide-react';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (data: string) => void;
}

const QRScannerModal: React.FC<QRScannerModalProps> = ({ isOpen, onClose, onScan }) => {
  const [error, setError] = useState<string | null>(null);
  const [hasCamera, setHasCamera] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const scannerRef = useRef<QrScanner | null>(null);

  useEffect(() => {
    let qrScanner: QrScanner | null = null;

    const initScanner = async () => {
      if (!isOpen || !videoRef.current) return;

      // Prüfen ob Kamera verfügbar ist
      const hasWebcam = await QrScanner.hasCamera();
      if (!hasWebcam) {
        setHasCamera(false);
        setError('Keine Kamera gefunden');
        return;
      }

      try {
        qrScanner = new QrScanner(
          videoRef.current,
          (result) => {
            // QR-Code erfolgreich gescannt
            if (qrScanner) {
              qrScanner.stop();
            }
            onScan(result.data);
            onClose();
          },
          {
            preferredCamera: 'environment', // Rückkamera bevorzugen
            highlightScanRegion: true,
            highlightCodeOutline: true,
            maxScansPerSecond: 5,
          }
        );

        scannerRef.current = qrScanner;
        await qrScanner.start();
        setError(null);
      } catch (err) {
        console.error('QR Scanner Error:', err);
        if (err instanceof Error) {
          if (err.name === 'NotAllowedError') {
            setError('Kamera-Zugriff wurde verweigert. Bitte erlaube den Zugriff in den Browser-Einstellungen.');
          } else if (err.name === 'NotFoundError') {
            setError('Keine Kamera gefunden.');
          } else {
            setError('Kamera konnte nicht gestartet werden.');
          }
        } else {
          setError('Kamera konnte nicht gestartet werden.');
        }
      }
    };

    initScanner();

    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop();
        scannerRef.current.destroy();
        scannerRef.current = null;
      }
    };
  }, [isOpen, onScan, onClose]);

  // Reset error when modal opens
  useEffect(() => {
    if (isOpen) {
      setError(null);
      setHasCamera(true);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-4 max-w-md w-full mx-4 shadow-2xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-lg flex items-center text-gray-900">
            <Camera className="h-5 w-5 mr-2 text-blue-600" />
            QR-Code scannen
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Video Container */}
        <div className="relative rounded-xl overflow-hidden bg-gray-900 aspect-square">
          {hasCamera ? (
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              playsInline
              muted
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <AlertCircle className="h-16 w-16 text-gray-500" />
            </div>
          )}

          {/* Scan-Rahmen Overlay */}
          {hasCamera && !error && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-48 h-48 border-2 border-white/50 rounded-lg">
                <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-blue-500 rounded-tl-lg" />
                <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-blue-500 rounded-tr-lg" />
                <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-blue-500 rounded-bl-lg" />
                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-blue-500 rounded-br-lg" />
              </div>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start">
            <AlertCircle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Instruction */}
        {!error && (
          <p className="text-gray-500 text-sm mt-4 text-center">
            Halte den QR-Code des Materials vor die Kamera
          </p>
        )}

        {/* Cancel Button */}
        <button
          onClick={onClose}
          className="w-full mt-4 py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
        >
          Abbrechen
        </button>
      </div>
    </div>
  );
};

export default QRScannerModal;
