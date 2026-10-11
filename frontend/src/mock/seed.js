export const users = [
  { id: 1, name: 'Asha Sharma', email: 'asha@corp.com', role: 'USER', department: 'Engineering' },
  { id: 2, name: 'Ravi Kumar', email: 'ravi@corp.com', role: 'USER', department: 'Design' },
  { id: 3, name: 'Meera Patel', email: 'meera@corp.com', role: 'USER', department: 'Product' },
  { id: 4, name: 'Karan Singh', email: 'karan@corp.com', role: 'USER', department: 'Marketing' },
  { id: 5, name: 'Admin User', email: 'admin@corp.com', role: 'OWNER', department: 'Operations' },
  // ... 20 more users can be added here for scale
];

export const equipmentList = [
  { id: 1, name: 'Projector', icon: 'Projector' },
  { id: 2, name: 'Whiteboard', icon: 'PenTool' },
  { id: 3, name: 'Video Conferencing', icon: 'Video' },
  { id: 4, name: 'Microphone', icon: 'Mic' },
  { id: 5, name: 'TV Screen', icon: 'Monitor' },
  { id: 6, name: 'Speakerphone', icon: 'Speaker' },
  { id: 7, name: 'Wheelchair Access', icon: 'Accessibility' }
];

export const rooms = [
  { id: 1, name: 'Orion', floor: 1, capacity: 20, isActive: true, baseScore: 90, equipment: [1, 2], ratings: [], pricingType: 'HOURLY', pricePerHour: 250 },
  { id: 2, name: 'Nebula', floor: 1, capacity: 35, isActive: true, baseScore: 85, equipment: [2, 5, 6], ratings: [], pricingType: 'HOURLY', pricePerHour: 400 },
  { id: 3, name: 'Atlas', floor: 2, capacity: 50, isActive: true, baseScore: 95, equipment: [1, 2, 3, 4], ratings: [], pricingType: 'HOURLY', pricePerHour: 500 },
  { id: 4, name: 'Zen Den', floor: 2, capacity: 25, isActive: true, baseScore: 88, equipment: [2], ratings: [], pricingType: 'HOURLY', pricePerHour: 200 },
  { id: 5, name: 'Boardroom Prime', floor: 3, capacity: 100, isActive: true, baseScore: 98, equipment: [1, 2, 3, 4, 5, 6], ratings: [], pricingType: 'DAILY', pricePerDay: 4000 },
  { id: 6, name: 'Innovation Lab', floor: 3, capacity: 250, isActive: true, baseScore: 92, equipment: [1, 2, 3, 4, 5, 6, 7], ratings: [], pricingType: 'BOTH', pricePerHour: 800, pricePerDay: 5000 },
  { id: 7, name: 'Apollo', floor: 1, capacity: 80, isActive: true, baseScore: 80, equipment: [1, 2, 6], ratings: [], pricingType: 'HOURLY', pricePerHour: 900 },
  { id: 8, name: 'Voyager', floor: 1, capacity: 30, isActive: true, baseScore: 75, equipment: [5], ratings: [], pricingType: 'HOURLY', pricePerHour: 350 },
  { id: 9, name: 'Gemini', floor: 2, capacity: 40, isActive: false, baseScore: 0, equipment: [], ratings: [], pricingType: 'HOURLY', pricePerHour: 400 }, // Under maintenance
  { id: 10, name: 'Titan', floor: 4, capacity: 450, isActive: true, baseScore: 89, equipment: [1, 2, 3, 7], ratings: [], pricingType: 'HOURLY', pricePerHour: 600 },
];

export const initialMeetings = [
  // We'll populate some meetings that happen today/tomorrow for demo purposes
];
