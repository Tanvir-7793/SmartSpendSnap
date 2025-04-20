import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Button } from './button';
import { Camera, X, Check, Image, AlertCircle, Loader2, Upload } from 'lucide-react';

interface CameraProps {
  onCapture: (imageData: string) => void;
  onCancel: () => void;
}

export function CameraCapture({ onCapture, onCancel }: CameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const [scanningTips, setScanningTips] = useState(true);

  const checkCameraAvailability = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      return videoDevices.length > 0;
    } catch (err) {
      console.error('Error checking camera availability:', err);
      return false;
    }
  };

  const startCamera = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Try different camera configurations
      let mediaStream;
      const constraints = [
        // Try with optimal settings first
        {
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        },
        // Try with basic settings
        { video: true },
        // Try with front camera
        {
          video: {
            facingMode: 'user'
          }
        },
        // Try with rear camera
        {
          video: {
            facingMode: 'environment'
          }
        }
      ];

      for (const constraint of constraints) {
        try {
          mediaStream = await navigator.mediaDevices.getUserMedia(constraint);
          break; // If successful, break the loop
        } catch (err) {
          console.log('Trying next camera configuration...');
          continue;
        }
      }

      if (!mediaStream) {
        throw new Error('Could not access any camera configuration');
      }
      
      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        
        // Wait for video to be ready with a shorter timeout
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('Camera initialization timeout'));
          }, 5000); // Reduced timeout to 5 seconds

          if (videoRef.current) {
            videoRef.current.onloadedmetadata = () => {
              clearTimeout(timeout);
              resolve(true);
            };
            
            videoRef.current.onerror = () => {
              clearTimeout(timeout);
              reject(new Error('Video element error'));
            };
          }
        });
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      if (err.name === 'AbortError' || err.message.includes('timeout')) {
        setError('Camera is taking too long to start. Please try using the upload option or check your camera permissions.');
      } else {
        setError('Unable to access camera. Please make sure you have granted permission and your device has a working camera.');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  }, [stream]);

  const takePhoto = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        
        const imageData = canvasRef.current.toDataURL('image/jpeg');
        setCapturedImage(imageData);
        stopCamera();
      }
    }
  }, [stopCamera]);

  const retakePhoto = useCallback(() => {
    setCapturedImage(null);
    setRetryCount(0);
    startCamera();
  }, [startCamera]);

  const confirmPhoto = useCallback(() => {
    if (capturedImage) {
      onCapture(capturedImage);
    }
  }, [capturedImage, onCapture]);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setCapturedImage(reader.result);
          stopCamera();
        }
      };
      
      reader.readAsDataURL(file);
    }
  }, [stopCamera]);

  useEffect(() => {
    let mounted = true;
    let retryTimeout: NodeJS.Timeout;
    
    const initializeCamera = async () => {
      try {
        await startCamera();
      } catch (err) {
        if (mounted) {
          console.error('Failed to initialize camera:', err);
          // Retry once after a short delay
          retryTimeout = setTimeout(() => {
            if (mounted) {
              startCamera().catch(console.error);
            }
          }, 1000);
        }
      }
    };

    initializeCamera();

    return () => {
      mounted = false;
      clearTimeout(retryTimeout);
      stopCamera();
    };
  }, [startCamera, stopCamera]);

  if (error) {
    return (
      <div className="flex flex-col items-center p-4 bg-white rounded-lg shadow">
        <div className="flex items-center text-red-500 mb-4">
          <AlertCircle className="w-5 h-5 mr-2" />
          <p>{error}</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={onCancel} variant="outline">Cancel</Button>
          <label htmlFor="receipt-upload" className="cursor-pointer">
            <Button>
              <Image className="mr-2 h-4 w-4" />
              Upload Photo
            </Button>
            <input
              id="receipt-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />
          </label>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center">
        <div className="relative w-full max-w-md mx-auto">
          <div className="relative aspect-[3/4] w-full">
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <div className="text-white text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                <p>Initializing camera...</p>
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-2">
            <Button
              onClick={takePhoto}
              disabled={isLoading || !stream}
              className="w-full"
            >
              <Camera className="mr-2 h-4 w-4" />
              Take Photo
            </Button>

            <div className="relative">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={isLoading}
              />
              <Button
                variant="outline"
                className="w-full"
                disabled={isLoading}
              >
                <Upload className="mr-2 h-4 w-4" />
                Upload Photo
              </Button>
            </div>

            <Button
              variant="ghost"
              onClick={onCancel}
              className="w-full text-white hover:text-white/80"
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center">
      <div className="relative w-full max-w-md mx-auto">
        <div className="relative aspect-[3/4] w-full">
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <div className="text-white text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                <p>Initializing camera...</p>
              </div>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover rounded-lg"
              />
              <div className="absolute inset-0 border-4 border-dashed border-white/50 rounded-lg pointer-events-none">
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white text-center">
                  <p className="text-sm mb-2">Position receipt within frame</p>
                  <p className="text-xs opacity-75">Make sure the receipt is well-lit and fully visible</p>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="mt-4 flex flex-col gap-2">
          <Button
            onClick={takePhoto}
            disabled={isLoading || !stream}
            className="w-full"
          >
            <Camera className="mr-2 h-4 w-4" />
            Take Photo
          </Button>

          <div className="relative">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={isLoading}
            />
            <Button
              variant="outline"
              className="w-full"
              disabled={isLoading}
            >
              <Upload className="mr-2 h-4 w-4" />
              Upload Photo
            </Button>
          </div>

          <Button
            variant="ghost"
            onClick={onCancel}
            className="w-full text-white hover:text-white/80"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
