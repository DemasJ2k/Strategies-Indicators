import axios from 'axios';
import { useAuthStore } from '../store/useAuthStore';

// Add interceptor to include auth header in all requests
axios.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export async function analyze(payload: any) {
  const res = await axios.post('/api/analyze', payload);
  return res.data;
}
