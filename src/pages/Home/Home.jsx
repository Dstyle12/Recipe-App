import { useEffect } from 'react'
import Header from '../../components/Layout/Header'
import { useRecipes } from '../../hooks/useRecipes'
import './Home.css'
const Home = () =>{
     const { recipes, loading, error } = useRecipes()
    
    const handleSortChange = (event) => {
        const sortValue = event.target.value
        console.log(sortValue)
    }
    const calculateTotalWeight = (recipe) =>{
      if(recipe.totalWeight !== undefined && recipe.totalWeight!== null) return recipe.totalWeight
      try{
        let ingredientsArray = []
        if(recipe.ingredients){
          if(typeof recipe.ingredients === 'string') ingredientsArray = JSON.parse(recipe.ingredients)
          else if(Array.isArray(recipe.ingredients)) ingredientsArray = recipe.ingredients
        }
        return ingredientsArray.reduce((sum, ingredient)=>{
          if(!ingredient || !ingredient.amount) return sum
          const amountStr  = String(ingredient.amount)
          const weight = parseFloat(amountStr)
          return sum + (isNaN(weight)? 0 : weight)
        },0)
      }
      catch(error){
         console.error('Error calculating weight:', error);
         return 0;
      }
    }
    const getIngredientsCount = (recipe) =>{
      if(recipe.ingredientsCount !== undefined) return recipe.ingredientsCount
      try{
        if(recipe.ingredients){
          if(typeof recipe.ingredients==='string'){
            const parsed = JSON.parse(recipe.ingredients)
            return parsed.length
          }
          else if(Array.isArray(recipe.ingredients)) return recipe.ingredients.length
        }
      }
      catch(error){
        console.error('Error counting ingredients:', error)
      }
      return 0
    }
    const getCreatedAt = (recipe) =>{
      if(recipe.createdAt) return recipe.createdAt
      return new Date().toISOString()
    }
    const sortedRecipes = [...recipes].sort((a,b)=>{
      try{
          const dateA = new Date(getCreatedAt(a))
          const dateB = new Date(getCreatedAt(b))
          return dateB - dateA
      }
      catch(error){
         console.error('Error sorting by date:', error)
         return 0
      }
    })
    useEffect(() => {
    if (sortedRecipes.length > 0) {
      console.log('📊 Все рецепты с сервера:', sortedRecipes)
      sortedRecipes.forEach((recipe, index) => {
        console.log(`Рецепт ${index + 1}:`, {
          id: recipe.id,
          title: recipe.title,
          description: recipe.description?.substring(0, 50) + '...',
          ingredientsCount: getIngredientsCount(recipe),
          totalWeight: calculateTotalWeight(recipe),
          createdAt: getCreatedAt(recipe),
          imageUrl: recipe.imageUrl
        })
      })
    }
  }, [sortedRecipes])
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      })
    } catch (error) {
      return error
    }
  }
  const getSafeDescription = (recipe) =>{
    const desc = recipe.description || 'no description avalaible'
    const maxLength = 120
    if(desc.length>maxLength) return desc.substring(0,maxLength) + '...'
    return desc
  }
  const getImageUrl = (recipe) =>{
    if(recipe.imageUrl){
      if(recipe.imageUrl.startsWith('/uploads')) return `http://localhost:3001${recipe.imageUrl}`
      return recipe.imageUrl
    }
    return null
  }
    if (loading) {
        return (
            <div className='home'>
                <Header onSortChange={handleSortChange} />
                <div className="loading">Loading recipes...</div>
            </div>
        )
    }
    if (error) {
        return (
            <div className='home'>
                <Header onSortChange={handleSortChange} />
                <div className="error">Error: {error}</div>
            </div>
        )
    }
    return (
        <div className="home">
      <Header onSortChange={handleSortChange} />
      <div className="recipes-container">
        {recipes.length === 0 ? (
          <div className="no-recipes">
            <p>No recipes yet. Create your first recipe!</p>
            <button 
              className="create-first-recipe"
              onClick={() => window.location.href = '/create'}
            >
              + Create Recipe
            </button>
          </div>
        ) : (
          <div className="recipes-grid">
            {sortedRecipes.map((recipe)=>{
              const safeTitle = recipe.title || 'Untitled recipe'
              const safeDescription = getSafeDescription(recipe)
              const ingredientsCount = getIngredientsCount(recipe)
              const totalWeight = calculateTotalWeight(recipe)
              const createdAt = getCreatedAt(recipe)
              const imageUrl = getImageUrl(recipe)
              return (
                <div key={recipe.id || `recipe-${Math.random()}`} className='recipe-card'>
                  <div className='recipe-date'>{formatDate(createdAt)}</div>
                  {imageUrl ? (
                    <img src={imageUrl} alt={safeTitle} className='recipe-image' onError={(e)=>{
                      e.target.style.display = 'none';
                        e.target.parentNode.innerHTML = `
                          <div class="recipe-image-placeholder">
                            <svg viewBox="0 0 24 24">
                              <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                            </svg>
                          </div>
                        `
                    }}></img>
                  ) : (
                    <div className='recipe-image-placeholder'>
                       <svg viewBox="0 0 24 24">
                        <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                      </svg>
                    </div>
                  )}
                  <div className='recipe-content'>
                    <h3 className='recipe-title'>{safeTitle}</h3>
                    <p className='recipe-description'>{safeDescription}</p>
                    <div className='recipe-stats'>
                      <div className='stat-item'>
                        <span className='stat-icon'>🥘</span>
                        <span className='stat-label'>Ingredients:</span>
                        <span className='stat-value'>{ingredientsCount}</span>
                      </div>
                      <div className='stat-item'>
                        <span className='stat-icon'>⚖️</span>
                        <span className='stat-label'>Weight:</span>
                        <span className='stat-value'>{totalWeight}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
    )
}
export default Home