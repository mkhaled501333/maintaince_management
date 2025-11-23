'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import jsQR from 'jsqr';

// Type declarations for legacy getUserMedia
declare global {
  interface Navigator {
    getUserMedia?: (constraints: MediaStreamConstraints, successCallback: (stream: MediaStream) => void, errorCallback: (error: Error) => void) => void;
  }
}

// Helper function to detect browser
const getBrowserInfo = () => {
  const userAgent = navigator.userAgent;
  if (userAgent.includes('Chrome')) return 'Chrome';
  if (userAgent.includes('Firefox')) return 'Firefox';
  if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) return 'Safari';
  if (userAgent.includes('Edge')) return 'Edge';
  if (userAgent.includes('Opera')) return 'Opera';
  return 'Unknown';
};

interface QRScannerProps {
  onScanSuccess: (result: string) => void;
  onError: (error: string) => void;
  onClose?: () => void;
}

const QRScanner: React.FC<QRScannerProps> = ({ onScanSuccess, onError, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number | null>(null);
  const isMountedRef = useRef(true);
  
  // Add mounted state to prevent SSR hydration issues
  const [isMounted, setIsMounted] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  // Set mounted state after component mounts (client-side only)
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    if (isMountedRef.current) {
      setIsScanning(false);
    }
  }, []);

  const startCamera = useCallback(async () => {
    try {
      setIsInitializing(true);
      setError(null);

      // Enhanced camera API detection and fallback
      let stream;
      
      // Only access navigator after mounting to prevent SSR issues
      if (!isMounted) return;
      
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const isAndroid = /Android/.test(navigator.userAgent);
      
      console.log('Device info:', {
        userAgent: navigator.userAgent,
        isMobile: isMobile,
        isIOS: isIOS,
        isAndroid: isAndroid,
        hasMediaDevices: !!navigator.mediaDevices,
        hasGetUserMedia: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
        hasLegacyGetUserMedia: !!navigator.getUserMedia,
        protocol: window.location.protocol,
        host: window.location.host,
        isSecureContext: window.isSecureContext,
        browser: getBrowserInfo()
      });

      // Check for secure context (HTTPS or localhost)
      const hostname = window.location.hostname;
      const isLocalHost = hostname === 'localhost' || 
                          hostname === '127.0.0.1' ||
                          hostname.endsWith('.localhost');
      
      // Check if it's a local network IP (e.g., 192.168.x.x, 10.x.x.x, 172.16-31.x.x)
      const isLocalNetwork = /^(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.)/.test(hostname);
      
      const isSecureContext = window.isSecureContext || isLocalHost;
      
      console.log('Security Context Check:', {
        hostname,
        protocol: window.location.protocol,
        isSecureContext: window.isSecureContext,
        isLocalHost,
        isLocalNetwork,
        allowsCamera: isSecureContext || isLocalNetwork
      });
      
      // Allow camera access for localhost, HTTPS, or local network
      // Note: Most modern browsers will allow camera on localhost even without HTTPS
      if (!isSecureContext && !isLocalHost && !isLocalNetwork) {
        console.warn('Camera may not work on HTTP connections outside localhost/local network');
      }
      
      if ((isLocalNetwork || isLocalHost) && !isSecureContext) {
        console.log('Using camera on local network/localhost without HTTPS - this is allowed for local development.');
      }
      
      // Try multiple camera access methods with progressive fallback
      console.log('Attempting to access camera with available APIs...');
      
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        console.log('Using modern navigator.mediaDevices.getUserMedia API');
        // Modern browsers - try multiple constraint combinations
        const constraintsToTry = [];
        
        if (isMobile) {
          // Mobile-specific constraints (try multiple options)
          constraintsToTry.push(
            { video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } } },
            { video: { facingMode: 'environment' } },
            { video: { width: { ideal: 640 }, height: { ideal: 480 } } },
            { video: true }
          );
        } else {
          // Desktop constraints
          constraintsToTry.push(
            { video: { width: { ideal: 1280 }, height: { ideal: 720 } } },
            { video: { width: { ideal: 640 }, height: { ideal: 480 } } },
            { video: true }
          );
        }
        
        let lastError;
        for (const constraints of constraintsToTry) {
          try {
            console.log('Trying camera constraints:', constraints);
            stream = await navigator.mediaDevices.getUserMedia(constraints);
            console.log('Camera access successful with constraints:', constraints);
            break;
          } catch (error) {
            console.log('Camera constraints failed:', constraints, error);
            lastError = error;
            continue;
          }
        }
        
        if (!stream) {
          throw lastError || new Error('All camera constraint attempts failed');
        }
      } else if (navigator.getUserMedia) {
        console.log('Using legacy navigator.getUserMedia API');
        // Legacy browsers
        stream = await new Promise<MediaStream>((resolve, reject) => {
          navigator.getUserMedia!(
            { video: true },
            resolve,
            reject
          );
        });
      } else if ((navigator as any).webkitGetUserMedia) {
        console.log('Trying webkit getUserMedia fallback');
        // Webkit fallback
        stream = await new Promise<MediaStream>((resolve, reject) => {
          (navigator as any).webkitGetUserMedia(
            { video: true },
            resolve,
            reject
          );
        });
      } else if ((navigator as any).mozGetUserMedia) {
        console.log('Trying moz getUserMedia fallback');
        // Mozilla fallback
        stream = await new Promise<MediaStream>((resolve, reject) => {
          (navigator as any).mozGetUserMedia(
            { video: true },
            resolve,
            reject
          );
        });
      } else {
        // Provide detailed diagnostic information
        const diagnostics = {
          hasMediaDevices: !!navigator.mediaDevices,
          hasGetUserMedia: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
          hasLegacyGetUserMedia: !!navigator.getUserMedia,
          hasWebkitGetUserMedia: !!(navigator as any).webkitGetUserMedia,
          hasMozGetUserMedia: !!(navigator as any).mozGetUserMedia,
          userAgent: navigator.userAgent,
          isSecureContext: window.isSecureContext,
          protocol: window.location.protocol,
          hostname: window.location.hostname
        };
        console.error('Camera API not available. Diagnostics:', diagnostics);
        throw new Error(`Camera API not supported. Available APIs: ${JSON.stringify(diagnostics, null, 2)}`);
      }

      streamRef.current = stream as MediaStream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream as MediaProvider;
        console.log('Video stream attached to video element');
        
        // Properly handle the play() promise
        try {
          await videoRef.current.play();
          console.log('Video playback started successfully');
        } catch (playError) {
          // Ignore abort errors - they occur when component unmounts during play
          if (playError instanceof Error && playError.name !== 'AbortError') {
            console.error('Video play error:', playError);
            throw playError;
          }
          console.log('Video play aborted (component unmounting)');
          return; // Early return if play was aborted
        }
      }

      // Only set state if component is still mounted
      if (!isMountedRef.current) {
        console.log('Component unmounted, aborting camera initialization');
        return;
      }

      console.log('✅ Camera initialized successfully, starting QR detection');
      setIsScanning(true);
      setHasPermission(true);
      setIsInitializing(false);

    } catch (err) {
      // Don't update state if component is unmounted
      if (!isMountedRef.current) {
        return;
      }

      console.error('Error accessing camera:', err);
      let errorMessage = 'Failed to access camera';
      
      if (err instanceof Error) {
        if (err.message.includes('Camera API not supported') || err.message === 'All camera constraint attempts failed') {
          const browser = getBrowserInfo();
          const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
          
          // Check if we have diagnostic info
          if (err.message.includes('Available APIs:')) {
            errorMessage = 'Camera API not available on this browser.\n\nPlease check the browser console for details.\n\nTry:\n- Updating your browser\n- Using Chrome, Firefox, or Edge\n- Checking browser settings for camera permissions';
          } else if (isMobile) {
            if (browser === 'Safari') {
              errorMessage = 'Camera not supported. Try updating Safari or use Chrome on mobile.';
            } else if (browser === 'Chrome') {
              errorMessage = 'Camera not supported. Try updating Chrome or check camera permissions.';
            } else {
              errorMessage = 'Camera not supported on this mobile browser. Try Chrome or Safari.';
            }
          } else {
            errorMessage = `Camera not supported in ${browser}. Try Chrome, Firefox, or Edge.`;
          }
        } else if (err.message.includes('Camera requires HTTPS')) {
          errorMessage = 'Camera access may be limited. Try using HTTPS or allow camera access in your browser settings.';
        } else if (err.name === 'NotAllowedError') {
          errorMessage = 'Camera permission denied. Please allow camera access and try again.';
        } else if (err.name === 'NotFoundError') {
          errorMessage = 'No camera found on this device. Please connect a camera and try again.';
        } else if (err.name === 'NotSupportedError') {
          errorMessage = 'Camera not supported on this device. Try Chrome or Safari.';
        } else if (err.name === 'NotReadableError') {
          errorMessage = 'Camera is already in use by another application. Close other camera apps and try again.';
        } else if (err.name === 'OverconstrainedError') {
          errorMessage = 'Camera constraints cannot be satisfied. Please try again.';
        } else if (err.name === 'SecurityError') {
          errorMessage = 'Camera access blocked for security reasons. Try using HTTPS or allow insecure camera access in your browser settings.';
        } else if (err.name === 'AbortError') {
          errorMessage = 'Camera access was interrupted. Please try again.';
        } else if (err.name === 'TypeError') {
          errorMessage = 'Camera API error. Try refreshing the page or using a different browser.';
        }
      }
      
      setError(errorMessage);
      onError(errorMessage);
      setHasPermission(false);
      setIsInitializing(false);
    }
  }, [onError, isMounted]);

  const detectQRCode = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !isScanning) {
      if (isScanning) {
        animationRef.current = requestAnimationFrame(detectQRCode);
      }
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d', { willReadFrequently: true });

    if (!context) {
      animationRef.current = requestAnimationFrame(detectQRCode);
      return;
    }

    // Check if video is ready
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      // Set canvas size to match video
      if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        console.log('Canvas sized to video dimensions:', canvas.width, 'x', canvas.height);
      }

      // Draw video frame to canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Get image data
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);

      // Detect QR code with default inversion attempts for better detection
      const code = jsQR(imageData.data, imageData.width, imageData.height);

      if (code) {
        console.log('✅ QR Code detected:', code.data);
        onScanSuccess(code.data);
        stopCamera();
        return;
      }
    }

    // Continue scanning
    animationRef.current = requestAnimationFrame(detectQRCode);
  }, [isScanning, onScanSuccess, stopCamera]);

  useEffect(() => {
    // Reset mounted ref when component mounts
    isMountedRef.current = true;
    
    // Only start camera after component is mounted (client-side)
    if (isMounted) {
      console.log('Component mounted, starting camera...');
      startCamera();
    }

    // Cleanup on unmount
    return () => {
      console.log('Component unmounting, stopping camera...');
      isMountedRef.current = false;
      stopCamera();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMounted]);

  // Start QR detection when scanning begins
  useEffect(() => {
    if (isScanning && !isInitializing && !error) {
      console.log('Starting QR detection loop...');
      detectQRCode();
    }
    
    // Cleanup on unmount or when scanning stops
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isScanning, isInitializing, error]);

  const retryScanning = useCallback(() => {
    stopCamera();
    setTimeout(() => {
      startCamera();
    }, 100);
  }, [stopCamera, startCamera]);

  const requestCameraPermission = useCallback(async () => {
    try {
      // Check if getUserMedia is available and request camera access with fallback
      let stream;
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        // Modern browsers - try different constraints for mobile vs desktop
        try {
          if (isMobile) {
            // Mobile-specific constraints
            stream = await navigator.mediaDevices.getUserMedia({
              video: {
                facingMode: 'environment',
                width: { ideal: 640, max: 1280 },
                height: { ideal: 480, max: 720 }
              }
            });
          } else {
            // Desktop constraints
            stream = await navigator.mediaDevices.getUserMedia({
              video: {
                width: { ideal: 1280 },
                height: { ideal: 720 }
              }
            });
          }
        } catch (mobileError) {
          console.log('Mobile constraints failed, trying basic constraints:', mobileError);
          // Fallback to basic constraints if mobile-specific ones fail
          stream = await navigator.mediaDevices.getUserMedia({
            video: true
          });
        }
      } else if (navigator.getUserMedia) {
        // Legacy browsers
        stream = await new Promise<MediaStream>((resolve, reject) => {
          navigator.getUserMedia!(
            { video: true },
            resolve,
            reject
          );
        });
      } else {
        throw new Error('Camera API not supported on this device');
      }
      
      // Stop the test stream
      (stream as MediaStream).getTracks().forEach((track: MediaStreamTrack) => track.stop());
      
      // Now try to start the camera
      startCamera();
    } catch (err) {
      // Don't update state if component is unmounted
      if (!isMountedRef.current) {
        return;
      }

      console.error('Error requesting camera permission:', err);
      let errorMessage = 'Camera permission denied';
      
      if (err instanceof Error) {
        if (err.message === 'Camera API not supported on this device') {
          errorMessage = 'Camera not supported on this device. Please use Chrome or Safari on mobile.';
        } else if (err.message.includes('Camera requires HTTPS')) {
          errorMessage = 'Camera access may be limited. Try using HTTPS or allow camera access in your browser settings.';
        } else if (err.name === 'NotAllowedError') {
          errorMessage = 'Camera permission denied. Please allow camera access in your browser settings and try again.';
        } else if (err.name === 'NotFoundError') {
          errorMessage = 'No camera found on this device';
        } else if (err.name === 'NotSupportedError') {
          errorMessage = 'Camera not supported on this device. Try Chrome or Safari.';
        }
      }
      
      setError(errorMessage);
      onError(errorMessage);
    }
  }, [startCamera, onError]);

  const handleClose = () => {
    stopCamera();
    if (onClose) {
      onClose();
    }
  };

  // Don't render camera content until mounted (prevents SSR hydration issues)
  if (!isMounted) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex flex-col items-center justify-center">
        <div className="text-white text-center">
          <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Initializing scanner...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center p-4 bg-black bg-opacity-50">
        <h2 className="text-white text-lg font-semibold">Scan QR Code</h2>
        <button
          onClick={handleClose}
          className="text-white hover:text-gray-300 p-2"
          aria-label="Close scanner"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Camera View */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="relative w-full max-w-md">
          <video
            ref={videoRef}
            className="w-full h-auto rounded-lg"
            playsInline
            muted
            autoPlay
          />
          
          {/* Hidden canvas for QR detection */}
          <canvas
            ref={canvasRef}
            className="hidden"
          />
          
          {/* Scanning overlay */}
          {isScanning && (
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute inset-0 border-4 border-green-400 rounded-lg animate-pulse"></div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <div className="w-8 h-8 border-4 border-white rounded-full animate-spin"></div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Status Messages */}
      <div className="p-4 bg-black bg-opacity-50">
        {isInitializing && !error && (
          <div className="text-center text-blue-400">
            <div className="inline-flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
              <span>Initializing camera...</span>
            </div>
          </div>
        )}

        {error && (
          <div className="text-center">
            <div className="text-red-400 mb-4 whitespace-pre-line">{error}</div>
            <div className="space-y-2">
              <button
                onClick={retryScanning}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium mr-2"
              >
                Retry
              </button>
              <button
                onClick={requestCameraPermission}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium mr-2"
              >
                Request Camera Permission
              </button>
              {error.includes('not supported') && (
                <div className="mt-4 p-4 bg-gray-800 rounded-lg">
                  <p className="text-yellow-400 mb-2">Alternative: Manual Entry</p>
                  <p className="text-gray-300 text-sm mb-3">
                    If camera is not supported, you can manually enter the QR code data:
                  </p>
                  <button
                    onClick={() => {
                      const manualCode = prompt('Enter QR code data manually:');
                      if (manualCode && manualCode.trim()) {
                        onScanSuccess(manualCode.trim());
                      }
                    }}
                    className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg font-medium"
                  >
                    Enter Code Manually
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
        
        {isScanning && !error && !isInitializing && (
          <div className="text-center text-green-400">
            <p>Point your camera at a QR code</p>
            <p className="text-sm text-gray-300 mt-1">Make sure the QR code is well-lit and in focus</p>
          </div>
        )}

        {hasPermission === false && !error && !isInitializing && (
          <div className="text-center text-yellow-400">
            <p>Camera permission is required to scan QR codes</p>
            <p className="text-sm text-gray-300 mt-1 mb-4">Please allow camera access in your browser settings</p>
            <button
              onClick={requestCameraPermission}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium"
            >
              Request Camera Permission
            </button>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="p-4 bg-black bg-opacity-50 text-center">
        <p className="text-gray-300 text-sm">
          Position the QR code within the camera viewfinder
        </p>
      </div>
    </div>
  );
};

export default QRScanner;


