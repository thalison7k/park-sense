import { ParkingSpot, ParkingStats, SensorType, SpotStatus } from '@/types/parking';

const sensorTypes: SensorType[] = ['ultrasonic', 'infrared', 'reed_switch', 'digital'];

const generateOccupancyHistory = () => {
  const history = [];
  const now = new Date();
  for (let i = 0; i < 24; i++) {
    history.push({
      timestamp: new Date(now.getTime() - i * 60 * 60 * 1000),
      status: Math.random() > 0.4 ? 'occupied' : 'free' as SpotStatus,
      duration: Math.floor(Math.random() * 120) + 10,
    });
  }
  return history;
};

export const generateParkingSpots = (count: number): ParkingSpot[] => {
  const spots: ParkingSpot[] = [];
  
  for (let i = 1; i <= count; i++) {
    const rand = Math.random();
    let status: SpotStatus;
    if (rand > 0.7) status = 'free';
    else if (rand > 0.1) status = 'occupied';
    else status = 'inactive';
    
    spots.push({
      id: `spot-${i.toString().padStart(3, '0')}`,
      name: `A${Math.ceil(i / 10)}-${((i - 1) % 10) + 1}`,
      status,
      sensorType: sensorTypes[Math.floor(Math.random() * sensorTypes.length)],
      lastUpdate: new Date(Date.now() - Math.random() * 300000),
      isOnline: status !== 'inactive',
      occupancyHistory: generateOccupancyHistory(),
    });
  }
  
  return spots;
};

export const calculateStats = (spots: ParkingSpot[]): ParkingStats => {
  const totalSpots = spots.length;
  const freeSpots = spots.filter(s => s.status === 'free').length;
  const occupiedSpots = spots.filter(s => s.status === 'occupied').length;
  const inactiveSpots = spots.filter(s => s.status === 'inactive').length;
  
  const averageOccupancy = totalSpots > 0 
    ? Math.round((occupiedSpots / (totalSpots - inactiveSpots)) * 100) 
    : 0;
  
  return {
    totalSpots,
    freeSpots,
    occupiedSpots,
    inactiveSpots,
    averageOccupancy,
    peakHours: ['08:00-10:00', '17:00-19:00'],
  };
};

export const generateHourlyData = () => {
  const data = [];
  for (let i = 0; i < 24; i++) {
    const hour = i.toString().padStart(2, '0') + ':00';
    data.push({
      hour,
      occupied: Math.floor(Math.random() * 30) + 10,
      free: Math.floor(Math.random() * 15) + 5,
    });
  }
  return data;
};

export const mockParkingSpots = generateParkingSpots(40);
export const mockStats = calculateStats(mockParkingSpots);
export const mockHourlyData = generateHourlyData();
