import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// CORS настройки
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Путь к файлу данных
const DATA_FILE = path.join(__dirname, 'recipes-data.json');

// Функция загрузки данных из файла
const loadRecipes = () => {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('❌ Error loading recipes from file:', error);
  }
  return []; // Если файла нет или ошибка, возвращаем пустой массив
};

// Функция сохранения данных в файл
const saveRecipes = (recipes) => {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(recipes, null, 2), 'utf8');
    console.log('💾 Recipes saved to file:', recipes.length);
  } catch (error) {
    console.error('❌ Error saving recipes to file:', error);
  }
};

// Загружаем рецепты при запуске сервера
let recipes = loadRecipes();
console.log('📂 Loaded recipes from file:', recipes.length);

// Логирование запросов
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
  next();
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    recipesCount: recipes.length
  });
});

// Получить все рецепты
app.get('/api/recipes', (req, res) => {
  console.log('📥 GET /api/recipes - Returning', recipes.length, 'recipes');
  res.json(recipes);
});

// Создать рецепт
app.post('/api/recipes', (req, res) => {
  console.log('📨 POST /api/recipes - Received:', req.body);
  
  const { title, description, ingredients } = req.body;
  
  if (!title || !title.trim()) {
    return res.status(400).json({ error: 'Recipe title is required' });
  }

  const newRecipe = {
    id: Date.now().toString(),
    title: title.trim(),
    description: description || '',
    ingredients: ingredients || [],
    createdAt: new Date().toISOString(),
    // Вычисляемые поля
    totalWeight: (ingredients || []).reduce((sum, ing) => {
      const weightMatch = ing.amount?.match(/(\d+)g/);
      return sum + (weightMatch ? parseInt(weightMatch[1]) : 0);
    }, 0),
    ingredientsCount: (ingredients || []).length
  };

  recipes.push(newRecipe);
  // ✅ СОХРАНЯЕМ В ФАЙЛ ПРИ КАЖДОМ ИЗМЕНЕНИИ
  saveRecipes(recipes);
  
  console.log('✅ Recipe created:', newRecipe.title);
  
  res.status(201).json(newRecipe);
});

// Корневой путь
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
  console.log(`
🍳 Recipe App Backend запущен!
📍 Сервер: http://localhost:${PORT}

📡 Доступные эндпоинты:
   GET  /api/health    - Проверка здоровья
   GET  /api/recipes   - Получить все рецепты
   POST /api/recipes   - Создать новый рецепт

💾 Данные сохраняются в файл: recipes-data.json
  `);
});