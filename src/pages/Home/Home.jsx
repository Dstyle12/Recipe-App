import { useEffect, useState} from 'react'
import Header from '../../components/Layout/Header'
import { useRecipes } from '../../hooks/useRecipes'
import { recipeAPI } from '../../services/api'
import { useNavigate } from 'react-router'
import './Home.css'
const Home = () =>{
     const { recipes, loading, error, loadRecipes } = useRecipes()
     const [sortBy, setSortBy] = useState('newest')
     const [scrolled, setScrolled] = useState(false)
     const [pinnedRecipeId, setPinnedRecipeId] = useState(null)
     const navigate = useNavigate()
    useEffect(()=>{
      if(recipes.length>0){
        const pinned = recipes.find(recipe => recipe.isPinned)
        if(pinned) setPinnedRecipeId(pinned.id)
        else setPinnedRecipeId(null)
      }
    }, [recipes])
    useEffect(()=>{
      const handleScroll = () =>{
        const isScrolled = window.scrollY >50
        if(isScrolled !== scrolled) setScrolled(isScrolled)
      }
    window.addEventListener('scroll',handleScroll,{passive:true})
    return () =>{
      window.addEventListener('scroll',handleScroll)
    }
    },[scrolled])
    const handleSortChange = (event) => {
        const sortValue = event.target.value
        console.log(sortValue)
        setSortBy(sortValue)
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
    const handlePinRecipe = async (recipeId, currentIsPinned)=>{
      try{
        const newPinnedState = !currentIsPinned
        console.log(`📌 ${newPinnedState ? 'Pinning' : 'Unpinning'} recipe ${recipeId}`)
        await recipeAPI.togglePin(recipeId,newPinnedState)
        await loadRecipes()
        if(newPinnedState) setPinnedRecipeId(recipeId)
        else setPinnedRecipeId(null)
      }
      catch(error){
        console.error('❌ Error toggling pin:', error);
        alert('Failed to pin/unpin recipe. Please try again.');
      }
    }
    const sortRecipes = (recipesToSort) =>{
      if(!recipesToSort.length) return []
      const pinned = recipesToSort.filter(r=>r.isPinned)
      const unpinned = recipesToSort.filter(r=>!r.isPinned)
      let sortUnpinned = [...unpinned]
      switch(sortBy){
        case 'newest':
           sortUnpinned.sort((a,b)=>{
            const dateA = new Date(getCreatedAt(a))
            const dateB = new Date(getCreatedAt(b))
            return dateB - dateA
          })
          break
        case 'oldest':
            sortUnpinned.sort((a,b)=>{
            const dateA = new Date(getCreatedAt(a))
            const dateB = new Date(getCreatedAt(b))
            return dateA - dateB
          })
          break
        case 'name-asc':
          sortUnpinned.sort((a,b)=>{
            const titleA = (a.title || '').toLowerCase()
            const titleB = (b.title || '').toLowerCase()
            return titleA.localeCompare(titleB)
          })
          break
        case 'name-desc':
           sortUnpinned.sort((a,b)=>{
            const titleA = (a.title || '').toLowerCase()
            const titleB = (b.title || '').toLowerCase()
            return titleB.localeCompare(titleA)
          })
          break
        case 'weight-asc':
          sortUnpinned.sort((a,b)=>{
            const weightA = calculateTotalWeight(a)
            const weightB = calculateTotalWeight(b)
            return weightA - weightB
          })
          break
        case 'weight-desc':
          sortUnpinned.sort((a,b)=>{
            const weightA = calculateTotalWeight(a)
            const weightB = calculateTotalWeight(b)
            return weightB - weightA
          })
          break
        case 'ingredients-asc':
          sortUnpinned.sort((a,b)=>{
            const countA = getIngredientsCount(a)
            const countB = getIngredientsCount(b)
            return countA - countB
          })
          break
        case 'ingredients-desc':
          sortUnpinned.sort((a,b)=>{
            const countA = getIngredientsCount(a)
            const countB = getIngredientsCount(b)
            return countB - countA
          })
          break
        default:
          sortUnpinned.sort((a,b)=>{
            const dateA = new Date(getCreatedAt(a))
            const dateB = new Date(getCreatedAt(b))
            return dateB - dateA
          })
      }
      return [...pinned, ...sortUnpinned]
    }
    const sortedRecipes = sortRecipes(recipes)
      useEffect(() => {
    if (sortedRecipes.length > 0) {
      console.log(`📊 Displaying ${sortedRecipes.length} recipes`);
      console.log(`📍 Pinned recipe ID: ${pinnedRecipeId || 'None'}`);
    }
  }, [sortedRecipes, pinnedRecipeId]);
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
                <div className="home-loading">Loading recipes...</div>
            </div>
        )
    }
    if (error) {
        return (
            <div className='home'>
                <Header onSortChange={handleSortChange} />
                <div className="home-error">Error: {error}</div>
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
              const isPinned = recipe.isPinned || false
              return (
                <div key={recipe.id || `recipe-${Math.random()}`} className='home-recipe-card' onClick={()=>navigate(`/recipe/${recipe.id}`)}>
                  <button 
                    className={`home-pin-button ${isPinned ? 'pinned' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation()
                      handlePinRecipe(recipe.id, isPinned)
                    }}
                    title={isPinned ? "Unpin recipe" : "Pin recipe"}
                  >
                    {isPinned ? '📌' : '📍'}
                  </button>
                  <div className='home-recipe-date'>{formatDate(createdAt)}</div>
                  {imageUrl ? (
                    <img src={imageUrl} alt={safeTitle} className='home-recipe-image' onError={(e)=>{
                      e.target.style.display = 'none';
                        e.target.parentNode.innerHTML = `
                          <div class="home-recipe-image-placeholder">
                            <svg viewBox="0 0 24 24">
                              <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                            </svg>
                          </div>
                        `
                    }}></img>
                  ) : (
                    <div className='home-recipe-image-placeholder'>
                       <svg viewBox="0 0 24 24">
                        <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                      </svg>
                    </div>
                  )}
                  <div className='home-recipe-content'>
                    <h3 className='home-recipe-title'>
                    {isPinned && <span className="pin-indicator">📌</span>}
                    {safeTitle}
                    </h3>
                    <p className='home-recipe-description'>{safeDescription}</p>
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