import axios from 'axios'
const API_BASE = 'http://localhost:3001/api'
const api = axios.create({
    baseURL: API_BASE,
    timeout: 30000
})
api.interceptors.request.use(
  (config) => {
    console.log(`🚀 ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`)
    if(config.data instanceof FormData) delete config.headers['Content-Type']
    return config
  },
  (error) => {
    console.error('❌ Request Error:', error.message)
    return Promise.reject(error)
  }
)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        console.error('❌ Response Error:', {
          url: error.config?.url,
          method: error.config?.method,
          status: error.response?.status,
          message: error.message,
        });
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
    const config = recipeData instanceof FormData ? {} : { headers:{
        'Content-Type': 'multipart/form-data'
      }}
    const response = await api.post('/recipes', recipeData,config)
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