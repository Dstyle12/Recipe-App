import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';

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

// Настройка multer для загрузки файлов
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, 'uploads');
    // Создаем папку uploads, если ее нет
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Уникальное имя файла: timestamp + оригинальное имя
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const safeFileName = file.originalname.replace(/[^a-zA-Z0-9.]/g, '-');
    cb(null, uniqueSuffix + '-' + safeFileName);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Только изображения (jpeg, jpg, png, gif, webp)'));
    }
  }
});

// Раздача статических файлов из папки uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

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
  return [];
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

// Создать рецепт с изображением
app.post('/api/recipes', upload.single('image'), (req, res) => {
   console.log('📨 POST /api/recipes - Received body:', req.body);
  console.log('📷 File:', req.file);
  console.log('📦 Raw ingredients string:', req.body.ingredients);
  
  try {
    let { title, description, ingredients } = req.body;
    
    // Парсим ingredients если они пришли как JSON строка
    let parsedIngredients = [];
    try {
      parsedIngredients = ingredients ? JSON.parse(ingredients) : [];
      console.log('✅ Parsed ingredients:', parsedIngredients);
    } catch (e) {
      console.warn('Failed to parse ingredients:', e.message);
      console.log('Raw ingredients:', ingredients);
    }

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Recipe title is required' });
    }

    // Вычисляем общий вес (без regex)
    const calculateTotalWeight = (ingredients) => {
      return ingredients.reduce((sum, ingredient) => {
        if (!ingredient || !ingredient.amount) return sum;
        
        // Вариант 1: parseFloat (останавливается на первом не-числе)
        const amountStr = String(ingredient.amount);
        const weight = parseFloat(amountStr);
        
        return sum + (isNaN(weight) ? 0 : weight);
      }, 0);
    };

    const newRecipe = {
      id: Date.now().toString(),
      title: title.trim(),
      description: description || '',
      ingredients: parsedIngredients,
      // Если есть файл, сохраняем путь к нему
      imageUrl: req.file ? `/uploads/${req.file.filename}` : null,
      createdAt: new Date().toISOString(),
      totalWeight: calculateTotalWeight(parsedIngredients),
      ingredientsCount: parsedIngredients.length
    };

    recipes.push(newRecipe);
    saveRecipes(recipes);
    
    console.log('✅ Recipe created:', newRecipe.title);
    
    res.status(201).json(newRecipe);
  } catch (error) {
    console.error('❌ Error creating recipe:', error);
    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'File size too large. Max 5MB.' });
      }
    }
    res.status(500).json({ error: 'Internal server error' });
  }
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
📁 Изображения сохраняются в: server/uploads
  `);
});