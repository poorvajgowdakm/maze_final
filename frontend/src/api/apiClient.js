import axios from 'axios';
import { engine } from '../mock/engine';

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1'
});

// Interceptor to inject token if not mocked
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Polyfill for real backend calls
export const api = {
  getRooms: async () => {
    if (USE_MOCK) return await engine.getRooms();
    const res = await client.get('/rooms');
    return res.data.data;
  },
  
  getMeetings: async () => {
    if (USE_MOCK) return await engine.getMeetings();
    const res = await client.get('/meetings');
    return res.data.data;
  },
  
  bookMeeting: async (data) => {
    if (USE_MOCK) return await engine.bookMeeting(data);
    const res = await client.post('/meetings', data);
    return res.data.data;
  },

  checkAvailability: async (data) => {
    if (USE_MOCK) {
       const isFree = await engine.checkAvailability(data.roomId, data.startTime, data.endTime);
       if (isFree) return { available: true };
       throw { response: { status: 409, data: { message: 'ROOM_CONFLICT' } } };
    }
    const res = await client.post('/meetings/check', data);
    return res.data.data;
  },

  cancelMeeting: async (id) => {
    if (USE_MOCK) return await engine.cancelMeeting(id);
    const res = await client.patch(`/meetings/${id}/cancel`, { reason: 'User cancelled' });
    return res.data;
  },

  login: async (credentials) => {
    if (USE_MOCK) {
      // Return dummy token if mock
      return { token: 'mock-token', user: { id: 1, name: 'Mock User', role: 'USER' } };
    }
    const res = await client.post('/auth/login', credentials);
    return res.data.data;
  },

  register: async (userData) => {
    if (USE_MOCK) {
      return { token: 'mock-token', user: { id: 2, name: userData.name, role: userData.role } };
    }
    const res = await client.post('/auth/register', userData);
    return res.data.data;
  }
};
