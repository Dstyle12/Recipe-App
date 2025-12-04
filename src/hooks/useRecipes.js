import { useState, useEffect, useCallback } from 'react';
import { recipeAPI } from '../services/api';
export const useRecipes = () => {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const loadRecipes = useCallback(async () => {
    console.log('🔄 Loading recipes...');
    setLoading(true);
    setError(null);
    try {
      const data = await recipeAPI.getAll();
      console.log('✅ Recipes loaded:', data.length);
      setRecipes(data);
    } catch (err) {
      console.warn('❌ Failed to load recipes:', err.message);
      setError('Failed to load recipes');
    } finally {
      setLoading(false);
    }
  }, []);
    const createRecipe = async (recipeData) => {
    console.log('🔄 Creating recipe...');
    try {
      const newRecipe = await recipeAPI.create(recipeData);
      setRecipes(prev => [...prev, newRecipe]);
      console.log('✅ Recipe created:', newRecipe.title)
      return newRecipe;
    } catch (err) {
      console.error('❌ Failed to create recipe on server:', err.message);
      throw err
    }
  };
  useEffect(() => {
    loadRecipes();
  }, [loadRecipes]); 

  return {
    recipes,
    loading,
    error,
    loadRecipes,
    createRecipe,
  };
};