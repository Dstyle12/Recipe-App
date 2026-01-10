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
       console.log('🔍 API.getById called with id:', id)
    console.log('🔍 API.getById constructing URL:', `/recipes/${id}`)
    try {
        const response = await api.get(`/recipes/${id}`)
        console.log('✅ API.getById response:', response.status, response.data)
        return response.data
    } catch (error) {
        console.error('❌ API.getById error:', error.response || error.message)
        throw error
    }
    },
    create: async (recipeData) => {
    const config = recipeData instanceof FormData ? {} : { headers:{
        'Content-Type': 'multipart/form-data'
      }}
    const response = await api.post('/recipes', recipeData,config)
    return response.data
  },
  togglePin: async(id,isPinned) =>{
    console.log(`📌 ${isPinned ? 'Pinning' : 'Unpinning'} recipe ${id}`)
    const response = await api.put(`/recipes/${id}/pin`, {isPinned})
    return response.data
  },
  update: async (id, updates) => {
    const config = updates instanceof FormData ? {headers: { 'Content-Type': 'multipart/form-data' }} : {}
    const response = await api.put(`/recipes/${id}`, updates, config)
    return response.data
  },
  delete: async (id) => {
    const response = await api.delete(`/recipes/${id}`)
    return response.data
  }
}