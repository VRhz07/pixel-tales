import { useState, useEffect } from 'react';

/**
 * Custom hook to handle Capacitor permissions
 * Requests permissions for camera, microphone, and storage
 */
export const useCapacitorPermissions = () => {
  const [permissionsGranted, setPermissionsGranted] = useState<{
    camera: boolean;
    microphone: boolean;
    storage: boolean;
  }>({
    camera: false,
    microphone: false,
    storage: false
  });

  const requestCameraPermission = async () => {
    if (typeof window !== 'undefined' && (window as any).Capacitor) {
      try {
        const { Camera } = (window as any).Capacitor.Plugins;
        const result = await Camera.requestPermissions({ permissions: ['camera', 'photos'] });
        
        setPermissionsGranted(prev => ({
          ...prev,
          camera: result.camera === 'granted' || result.photos === 'granted'
        }));
        
        return result.camera === 'granted' || result.photos === 'granted';
      } catch (error) {
        console.error('Error requesting camera permission:', error);
        return false;
      }
    }
    return true; // If not in Capacitor, assume web permissions
  };

  const requestMicrophonePermission = async () => {
    if (typeof window !== 'undefined' && (window as any).Capacitor) {
      try {
        // For microphone, we need to use the browser's native API
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop());
        
        setPermissionsGranted(prev => ({
          ...prev,
          microphone: true
        }));
        
        return true;
      } catch (error) {
        console.error('Error requesting microphone permission:', error);
        return false;
      }
    }
    return true;
  };

  const requestStoragePermission = async () => {
    if (typeof window !== 'undefined' && (window as any).Capacitor) {
      try {
        const { Filesystem } = (window as any).Capacitor.Plugins;
        const result = await Filesystem.requestPermissions();
        
        setPermissionsGranted(prev => ({
          ...prev,
          storage: result.publicStorage === 'granted'
        }));
        
        return result.publicStorage === 'granted';
      } catch (error) {
        console.error('Error requesting storage permission:', error);
        return false;
      }
    }
    return true;
  };

  const checkPermissions = async () => {
    if (typeof window !== 'undefined' && (window as any).Capacitor) {
      try {
        const { Camera, Filesystem } = (window as any).Capacitor.Plugins;
        
        const cameraStatus = await Camera.checkPermissions();
        const storageStatus = await Filesystem.checkPermissions();
        
        setPermissionsGranted({
          camera: cameraStatus.camera === 'granted' || cameraStatus.photos === 'granted',
          microphone: false, // Will be checked when needed
          storage: storageStatus.publicStorage === 'granted'
        });
      } catch (error) {
        console.error('Error checking permissions:', error);
      }
    }
  };

  useEffect(() => {
    checkPermissions();
  }, []);

  return {
    permissionsGranted,
    requestCameraPermission,
    requestMicrophonePermission,
    requestStoragePermission,
    checkPermissions
  };
};
