export function getApiUrl(): string {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, '');
  }
  if (typeof window !== 'undefined') {
    if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      return 'https://twinthink.onrender.com';
    }
  }
  return process.env.NODE_ENV === 'production'
    ? 'https://twinthink.onrender.com'
    : 'http://127.0.0.1:8001';
}
