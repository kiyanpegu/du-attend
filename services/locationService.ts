import { GEOFENCE_CONFIG } from '@/constants/duAttend';
import * as Location from 'expo-location';
import { Platform } from 'react-native';

export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c); // Distance in meters
}

export interface GeofenceResult {
  isInside: boolean;
  distanceMeters: number;
  currentCoords?: { latitude: number; longitude: number };
  permissionDenied?: boolean;
  simulated?: boolean;
  message: string;
}

export const locationService = {
  async checkClassroomGeofence(simulateInside = false): Promise<GeofenceResult> {
    // If simulation mode is active (for testing/demo outside Dibrugarh)
    if (simulateInside) {
      return {
        isInside: true,
        distanceMeters: 14,
        currentCoords: {
          latitude: GEOFENCE_CONFIG.targetLatitude + 0.0001,
          longitude: GEOFENCE_CONFIG.targetLongitude + 0.0001,
        },
        simulated: true,
        message: `Verified: Inside ${GEOFENCE_CONFIG.campusName} (Simulated ~14m away)`,
      };
    }

    // Web fallback or permission checks
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        return {
          isInside: false,
          distanceMeters: -1,
          permissionDenied: true,
          message: 'Location permission was denied. Location verification is required for OTP attendance.',
        };
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Platform.OS === 'android' ? Location.Accuracy.Balanced : Location.Accuracy.High,
      });

      const { latitude, longitude } = position.coords;
      const distanceMeters = calculateHaversineDistance(
        latitude,
        longitude,
        GEOFENCE_CONFIG.targetLatitude,
        GEOFENCE_CONFIG.targetLongitude
      );

      const isInside = distanceMeters <= GEOFENCE_CONFIG.allowedRadiusMeters;

      if (isInside) {
        return {
          isInside: true,
          distanceMeters,
          currentCoords: { latitude, longitude },
          simulated: false,
          message: `Verified: Inside ${GEOFENCE_CONFIG.classroomName} (${distanceMeters}m from center)`,
        };
      }

      return {
        isInside: false,
        distanceMeters,
        currentCoords: { latitude, longitude },
        simulated: false,
        message: `Outside Classroom: You are ${distanceMeters > 1000 ? `${(distanceMeters / 1000).toFixed(1)}km` : `${distanceMeters}m`} away from ${GEOFENCE_CONFIG.campusName}. Maximum allowed radius is ${GEOFENCE_CONFIG.allowedRadiusMeters}m.`,
      };
    } catch (err: any) {
      return {
        isInside: false,
        distanceMeters: -1,
        message: err?.message || 'Unable to retrieve location. Please ensure device GPS is turned on.',
      };
    }
  },
};

