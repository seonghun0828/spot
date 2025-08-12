import {
  geohashForLocation,
  geohashQueryBounds,
  distanceBetween,
} from 'geofire-common';

/**
 * 위도, 경도로부터 geohash 생성
 */
export const generateGeohash = (
  latitude: number,
  longitude: number
): string => {
  return geohashForLocation([latitude, longitude]);
};

/**
 * 중심점과 반경(미터)으로부터 geohash 쿼리 범위 생성
 */
export const getGeohashQueryBounds = (
  center: [number, number],
  radiusInMeters: number
) => {
  return geohashQueryBounds(center, radiusInMeters);
};

/**
 * 두 지점 간의 정확한 거리 계산 (미터)
 */
export const calculatePreciseDistance = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number => {
  return distanceBetween([lat1, lng1], [lat2, lng2]) * 1000; // km to meters
};

/**
 * 포스트가 반경 내에 있는지 확인
 */
export const isWithinRadius = (
  userLat: number,
  userLng: number,
  postLat: number,
  postLng: number,
  radiusInMeters: number
): boolean => {
  const distance = calculatePreciseDistance(userLat, userLng, postLat, postLng);
  return distance <= radiusInMeters;
};
