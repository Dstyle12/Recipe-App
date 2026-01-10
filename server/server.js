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
console.log('🔍 Data file path:', DATA_FILE);

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
    recipesCount: recipes.length,
    pinnedRecipes: recipes.filter(r => r.isPinned).length
  });
});

// Получить все рецепты
app.get('/api/recipes', (req, res) => {
  console.log('📥 GET /api/recipes - Returning', recipes.length, 'recipes');
  
  // Создаем копию массива для сортировки
  const recipesToSend = [...recipes];
  
  // Сортируем: закрепленные сверху, затем по дате создания (новые сверху)
  recipesToSend.sort((a, b) => {
    // Сначала сравниваем по статусу закрепления
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    
    // Если оба закреплены или не закреплены, сортируем по дате (новые сверху)
    const dateA = new Date(a.createdAt);
    const dateB = new Date(b.createdAt);
    return dateB - dateA;
  });
  
  res.json(recipesToSend);
});

// Создать рецепт
app.post('/api/recipes', upload.single('image'), (req, res) => {
  console.log('📨 POST /api/recipes - Received data:', req.body);
  console.log('📷 File:', req.file);
  
  try {
    let { title, description, ingredients } = req.body;
    
    // Парсим ingredients если они пришли как JSON строка
    let parsedIngredients = [];
    try {
      parsedIngredients = ingredients ? JSON.parse(ingredients) : [];
    } catch (e) {
      console.warn('Failed to parse ingredients:', e.message);
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
      updatedAt: new Date().toISOString(),
      isPinned: false, // НОВОЕ ПОЛЕ: по умолчанию не закреплен
      // Вычисляемые поля
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

// Закрепить/открепить рецепт
app.put('/api/recipes/:id/pin', (req, res) => {
  const recipeId = req.params.id;
  const { isPinned } = req.body;
  
  console.log(`📌 PUT /api/recipes/${recipeId}/pin - isPinned: ${isPinned}`);
  
  // Находим рецепт
  const recipeIndex = recipes.findIndex(r => r.id === recipeId);
  
  if (recipeIndex === -1) {
    return res.status(404).json({ error: 'Recipe not found' });
  }
  
  // Если закрепляем, сначала снимаем закрепление со всех других рецептов
  if (isPinned) {
    console.log('🔓 Unpinning all other recipes');
    recipes.forEach(recipe => {
      if (recipe.id !== recipeId && recipe.isPinned) {
        recipe.isPinned = false;
        recipe.updatedAt = new Date().toISOString();
      }
    });
  }
  
  // Обновляем текущий рецепт
  recipes[recipeIndex].isPinned = isPinned;
  recipes[recipeIndex].updatedAt = new Date().toISOString();
  
  // Сохраняем в файл
  saveRecipes(recipes);
  
  console.log(`✅ Recipe ${recipeId} ${isPinned ? 'pinned' : 'unpinned'}`);
  
  // Возвращаем обновленный рецепт
  res.json(recipes[recipeIndex]);
});

// Обновить рецепт (с поддержкой FormData для изображений)
app.put('/api/recipes/:id', upload.single('image'), (req, res) => {
  const recipeId = req.params.id;
  
  console.log(`✏️ PUT /api/recipes/${recipeId} - Body:`, req.body);
  console.log(`📷 File for update:`, req.file);
  
  const recipeIndex = recipes.findIndex(r => String(r.id) === String(recipeId));
  
  if (recipeIndex === -1) {
    return res.status(404).json({ error: 'Recipe not found' });
  }
  
  try {
    const { title, description, ingredients } = req.body;
    
    // Парсим ингредиенты
    let parsedIngredients = [];
    try {
      parsedIngredients = ingredients ? JSON.parse(ingredients) : [];
    } catch (e) {
      console.warn('Failed to parse ingredients:', e.message);
      // Если не удалось распарсить, используем старые ингредиенты
      parsedIngredients = recipes[recipeIndex].ingredients || [];
    }
    
    // Вычисляем общий вес
    const calculateTotalWeight = (ingredients) => {
      return ingredients.reduce((sum, ingredient) => {
        if (!ingredient || !ingredient.amount) return sum;
        const amountStr = String(ingredient.amount);
        const weight = parseFloat(amountStr);
        return sum + (isNaN(weight) ? 0 : weight);
      }, 0);
    };
    
    // Обновляем рецепт
    const updatedRecipe = {
      ...recipes[recipeIndex],
      title: title || recipes[recipeIndex].title,
      description: description || recipes[recipeIndex].description,
      ingredients: parsedIngredients,
      totalWeight: calculateTotalWeight(parsedIngredients),
      ingredientsCount: parsedIngredients.length,
      updatedAt: new Date().toISOString()
    };
    
    // Если есть новый файл, обновляем imageUrl
    if (req.file) {
      // Удаляем старое изображение, если оно есть
      if (recipes[recipeIndex].imageUrl && recipes[recipeIndex].imageUrl.startsWith('/uploads/')) {
        const oldImagePath = path.join(__dirname, recipes[recipeIndex].imageUrl);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
          console.log('🗑️ Deleted old image:', oldImagePath);
        }
      }
      updatedRecipe.imageUrl = `/uploads/${req.file.filename}`;
    }
    
    // Сохраняем обновленный рецепт
    recipes[recipeIndex] = updatedRecipe;
    saveRecipes(recipes);
    
    console.log(`✅ Recipe ${recipeId} updated:`, updatedRecipe.title);
    res.json(updatedRecipe);
    
  } catch (error) {
    console.error('❌ Error updating recipe:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Удалить рецепт
app.delete('/api/recipes/:id', (req, res) => {
  const recipeId = req.params.id;
  
  console.log(`🗑️ DELETE /api/recipes/${recipeId}`);
  
  const recipeIndex = recipes.findIndex(r => r.id === recipeId);
  
  if (recipeIndex === -1) {
    return res.status(404).json({ error: 'Recipe not found' });
  }
  
  // Если у рецепта есть изображение, удаляем файл
  const recipe = recipes[recipeIndex];
  if (recipe.imageUrl && recipe.imageUrl.startsWith('/uploads/')) {
    const imagePath = path.join(__dirname, recipe.imageUrl);
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
      console.log('🗑️ Deleted image:', imagePath);
    }
  }
  
  // Удаляем рецепт из массива
  recipes.splice(recipeIndex, 1);
  saveRecipes(recipes);
  
  console.log(`✅ Recipe ${recipeId} deleted`);
  res.json({ message: 'Recipe deleted successfully' });
});

// Получить один рецепт по ID
app.get('/api/recipes/:id', (req, res) => {
  const recipeId = req.params.id;
  console.log(`📥 GET /api/recipes/${recipeId}`);
  
  // Логи для отладки
  console.log('🔍 Looking for ID:', recipeId);
  console.log('🔍 All available IDs:', recipes.map(r => r.id));
  
  // Ищем рецепт (с преобразованием типов)
  const recipe = recipes.find(r => String(r.id) === String(recipeId));
  
  if (!recipe) {
    console.log(`❌ Recipe ${recipeId} not found`);
    return res.status(404).json({ 
      error: 'Recipe not found',
      requestedId: recipeId,
      availableIds: recipes.map(r => r.id),
      recipesCount: recipes.length
    });
  }
  
  console.log(`✅ Found recipe: ${recipe.title}`);
  res.json(recipe);
});

// Корневой путь
app.get('/', (req, res) => {
  res.json({ 
    message: 'Recipe API is running!',
    endpoints: {
      health: '/api/health',
      recipes: {
        getAll: 'GET /api/recipes',
        create: 'POST /api/recipes',
        update: 'PUT /api/recipes/:id',
        delete: 'DELETE /api/recipes/:id',
        pin: 'PUT /api/recipes/:id/pin'
      }
    }
  });
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`
🍳 Recipe App Backend запущен!
📍 Сервер: http://localhost:${PORT}

📡 Доступные эндпоинты:
   GET    /api/health          - Проверка здоровья
   GET    /api/recipes         - Все рецепты
   POST   /api/recipes         - Создать рецепт
   PUT    /api/recipes/:id     - Обновить рецепт
   PUT    /api/recipes/:id/pin - Закрепить/открепить рецепт
   DELETE /api/recipes/:id     - Удалить рецепт

💾 Данные сохраняются в файл: recipes-data.json
📁 Изображения сохраняются в: server/uploads
📌 Поддержка закрепления рецептов: ✅ Включена
  `);
  
  // Статистика при запуске
  const pinnedCount = recipes.filter(r => r.isPinned).length;
  if (pinnedCount > 0) {
    const pinnedRecipe = recipes.find(r => r.isPinned);
    console.log(`📌 Закреплен рецепт: "${pinnedRecipe.title}" (ID: ${pinnedRecipe.id})`);
  } else {
    console.log('📌 Закрепленных рецептов нет');
  }
});