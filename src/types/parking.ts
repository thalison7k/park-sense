export type SpotStatus = 'free' | 'occupied' | 'inactive';

export type SensorType = 'ultrasonic' | 'infrared' | 'reed_switch' | 'digital';

export interface ParkingSpot {
  id: string;
  name: string;
  status: SpotStatus;
  sensorType: SensorType;
  lastUpdate: Date;
  isOnline: boolean;
  occupancyHistory: OccupancyRecord[];
}

export interface OccupancyRecord {
  timestamp: Date;
  status: SpotStatus;
  duration?: number; // in minutes
}

export interface ParkingStats {
  totalSpots: number;
  freeSpots: number;
  occupiedSpots: number;
  inactiveSpots: number;
  averageOccupancy: number;
  peakHours: string[];
}

export interface SensorConfig {
  id: string;
  spotId: string;
  type: SensorType;
  isActive: boolean;
  sensitivity: number;
  lastCalibration: Date;
}
