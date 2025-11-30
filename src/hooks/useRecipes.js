import { useState, useEffect } from 'react';
import { recipeAPI } from '../services/api';
export const useRecipes = () => {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadRecipes = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await recipeAPI.getAll();
      setRecipes(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Error loading recipes');
      console.error('Error loading recipes:', err);
    } finally {
      setLoading(false);
    }
  };

  const createRecipe = async (recipeData) => {
    try {
      const newRecipe = await recipeAPI.create(recipeData);
      setRecipes(prev => [...prev, newRecipe]);
      return newRecipe;
    } catch (err) {
      setError(err.response?.data?.error || 'Error creating recipe');
      console.error('Error creating recipe:', err);
      throw err;
    }
  };

  useEffect(() => {
    loadRecipes();
  }, []);

  return {
    recipes,
    loading,
    error,
    loadRecipes,
    createRecipe,
  };
};