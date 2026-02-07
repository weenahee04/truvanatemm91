// API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_URL || 
  (import.meta.env.PROD 
    ? 'https://truvamatenewversion-master.vercel.app/api' 
    : 'http://localhost:5000/api');

export const getAuthHeaders = async () => {
  const { auth } = await import('./firebase');
  const token = await auth.currentUser?.getIdToken();
  
  if (!token) {
    throw new Error('Not authenticated');
  }
  
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
};

export const getPublicHeaders = () => ({
  'Content-Type': 'application/json',
});

// Helper function for API calls
export const apiCall = async (
  endpoint: string, 
  options: RequestInit = {}, 
  requireAuth = true
) => {
  const headers = requireAuth 
    ? await getAuthHeaders() 
    : getPublicHeaders();

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      ...headers,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || error.message || 'Request failed');
  }

  return response.json();
};
