import axios from 'axios';

export async function analyze(payload: any) {
  const res = await axios.post('/api/analyze', payload);
  return res.data;
}
