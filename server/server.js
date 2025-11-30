import express from 'express';
import cors from 'cors';

const app = express();

// Более строгая настройка CORS
app.use(cors({
  origin: 'http://localhost:5173', // Явно указываем фронтенд
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

let recipes = [];

// Health check с подробной информацией
app.get('/api/health', (req, res) => {
  console.log('✅ Health check received from:', req.headers.origin);
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    database: { 
      recipes: recipes.length,
      totalWeight: recipes.reduce((sum, r) => sum + (r.totalWeight || 0), 0)
    }
  });
});

// Получить все рецепты
app.get('/api/recipes', (req, res) => {
  console.log('📥 GET /api/recipes - Sending', recipes.length, 'recipes');
  res.json(recipes);
});

// Создать рецепт
app.post('/api/recipes', (req, res) => {
  console.log('📨 POST /api/recipes - Received data:', req.body);
  
  const { title, description, ingredients } = req.body;
  
  if (!title) {
    return res.status(400).json({ error: 'Recipe title is required' });
  }

  const newRecipe = {
    id: Date.now(),
    title: title.trim(),
    description: description || '',
    ingredients: ingredients || [],
    createdAt: new Date(),
    updatedAt: new Date(),
    // Добавляем вычисляемые поля
    totalWeight: ingredients?.reduce((sum, ing) => {
      const weight = parseInt(ing.amount) || 0;
      return sum + weight;
    }, 0) || 0,
    ingredientsCount: ingredients?.length || 0
  };

  recipes.push(newRecipe);
  console.log('✅ Recipe created:', newRecipe.title);
  console.log('📊 Total recipes now:', recipes.length);
  
  res.status(201).json(newRecipe);
});

// Добавим обработчик для корневого пути чтобы не было "Cannot GET /"
app.get('/', (req, res) => {
  res.json({ 
    message: 'Recipe API is running!',
    endpoints: {
      health: '/api/health',
      recipes: '/api/recipes'
    }
  });
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log('🍳 Recipe App Backend запущен!');
  console.log(`📍 Сервер: http://localhost:${PORT}`);
  console.log(`🎯 Ожидаю запросы от фронтенда: http://localhost:5173`);
  console.log('📋 Доступные эндпоинты:');
  console.log(`   GET  /              - Информация об API`);
  console.log(`   GET  /api/health    - Проверка здоровья`);
  console.log(`   GET  /api/recipes   - Все рецепты`);
  console.log(`   POST /api/recipes   - Создать рецепт`);
});