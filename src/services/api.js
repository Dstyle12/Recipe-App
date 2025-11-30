import axios from 'axios'
const API_BASE = 'http://localhost:3001/api'
const api = axios.create({
    baseURL: API_BASE,
    timeout: 10000,
    headers:{
        'Content-Type': 'application/json'
    }
})
api.interceptors.response.use(
    (response) => response,
    (error) => {
    console.error('🔴 API Error Details:');
    console.error('URL:', error.config?.url);
    console.error('Method:', error.config?.method);
    console.error('Full Error:', error);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('🚨 Backend is not running!');
      console.error('💡 Run: cd server && node server.js');
    }
        return Promise.reject(error)
    }
)
export const recipeAPI = {
    getAll: async () =>{
        const response = await api.get('/recipes')
        return response.data
    },
    getById: async (id) => {
        const response  =  await api.get(`/recipes/${id}`)
        return response.data
    },
    create: async (recipeData) => {
    const response = await api.post('/recipes', recipeData)
    return response.data
  },
  update: async (id, updates) => {
    const response = await api.put(`/recipes/${id}`, updates)
    return response.data
  },
  delete: async (id) => {
    const response = await api.delete(`/recipes/${id}`)
    return response.data
  }
}