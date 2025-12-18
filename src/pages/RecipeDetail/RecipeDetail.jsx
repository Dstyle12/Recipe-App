import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router";
import { recipeAPI } from "../../services/api";
import './RecipeDetail.css'
const RecipeDetail = () =>{
    const {id} = useParams()
    const location = useLocation()
    const navigate = useNavigate()
    const [recipe, setRecipe] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    console.log('🔍 RECIPE DETAIL: Component mounted with id:', id)
    console.log('🔍 RECIPE DETAIL: Current location:', location.pathname)
    console.log('🔍 RECIPE DETAIL: useParams =', { id })
    const loadRecipe = useCallback(async () =>{
        try{
            setLoading(true)
            setError(null)
            console.log(`🔄 LOADING: Starting to load recipe with id: ${id}`)
            console.log('🔍 CHECK: recipeAPI.getById exists?', typeof recipeAPI.getById)
            const data = await recipeAPI.getById(id)
            setRecipe(data)
        }
        catch(error){
            console.error('❌ Error loading recipe:', error)
             console.error('❌ Error details:', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status,
                url: error.config?.url
            })
            setError('Recipe not found')
        }
        finally{
            setLoading(false)
        }
    },[id]) 
    useEffect(() => {
        console.log('🔧 useEffect triggered, id =', id)
        if(id) loadRecipe()
        else {
            console.error('❌ ERROR: No id provided!')
            setError('Recipe ID is missing')
            setLoading(false)
    }
    }, [loadRecipe, id])
    const handlePinToggle = async () =>{
        try{
            const updatedRecipe = await recipeAPI.togglePin(recipe.id, !recipe.isPinned)
            setRecipe(updatedRecipe)
        }
        catch(error){
            console.error('❌ Error toggling pin:', error)
            alert('Failed to pin/unpin recipe. Please try again.')
        }
    }
    const handleDelete = async () =>{
        if(window.confirm('Are you sure you want to delete this recipe?')){
            try{
                await recipeAPI.delete(id)
                navigate('/')
            }
            catch(error){
                console.error('❌ Error deleting recipe:', error)
                alert('Failed to delete recipe. Please try again.')
            }
        }
    }
    const parseWeight = (amountStr) =>{
    if(!amountStr) return '0'
    let numericStr = ''
    let hasDecimal = false
    for(let char of amountStr){
        if(char>= '0' && char<='9') numericStr+=char
        else if(char==='.' && !hasDecimal){
            numericStr+=char
            hasDecimal = true
        }
        else if(numericStr.length>0) break
    }
    if (!numericStr || numericStr === '.') return '0'
    if(numericStr.length>1 && numericStr[0]==='0' && numericStr[1] !=='.') numericStr = numericStr.replace(/^0+/, '')
    return numericStr
  }
  const parseQuantity = (notes) =>{
    if(!notes) return '1'
    if(notes.includes('Quantity:')){
        const parts = notes.split('Quantity:')
        if(parts.length>1){
            const afterPrefix = parts[1].trim()
            let number = ''
            for(let char of afterPrefix){
                if(char>='0' && char<='9') number+=char
                else if(number.length>0) break
            }
            return number || '1'
        }
    }
    let number = ''
    for(let char of notes){
        if(char>='0' && char<='9') number+=char
        else if(number.length>0) break
    }
    return number || '1'
  }
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
  console.log('🎨 RENDER: State =', { loading, error, recipe: recipe ? recipe.title : 'null' })
    if(loading){
        return (
            <div className="recipe-detail-page">
                 <header className="recipe-detail-header">
                    <button className="back-button" onClick={() => navigate('/')}>← Back</button>
                    <h1 className="recipe-detail-title">Loading...</h1>
                 </header>
            </div>
        )
    }
    if(error || !recipe){
        return (
            <div className="recipe-detail-page">
                <header className="recipe-detail-header">
                    <button className="back-button" onClick={() => navigate('/')}>← Back</button>
                    <h1 className="recipe-detail-title">Recipe not found</h1>
                </header>
                <main className="recipe-detail-main">
                    <p className="error-message">{error || 'The recipe you are looking for does not exist.'}</p>
                </main>
            </div>
        )
    }
     console.log('✅ RENDER: Showing recipe:', recipe.title)
     const getImageUrl =() =>{
        if(recipe.imageUrl){
            if(recipe.imageUrl.startsWith('/uploads')) return `http://localhost:3001${recipe.imageUrl}`
            return recipe.imageUrl
        }
        return null
    }
     const calculateTotalWeight = () =>{
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
    const imageUrl = getImageUrl()
  const totalWeight = calculateTotalWeight()
  return (
    <div className="recipe-detail-page">
        <header className="recipe-detail-header">
            <button className="back-button" onClick={()=>navigate('/')}>← Back</button>
            <div className="header-actions">
                <button className={`pin-button-detail ${recipe.isPinned ? 'pinned' : ''}`} onClick={handlePinToggle} title={recipe.isPinned ? "Unpin recipe" : "Pin recipe"}>
                    {recipe.isPinned ? '📌 Pinned' : '📍 Pin'}
                </button>
                 <button className="delete-button" onClick={handleDelete} title="Delete recipe">🗑️ Delete</button>
            </div>
        </header>
        <main className="recipe-detail-main">
            <div className="image-section">
                {
                    imageUrl ? (
                        <img src={imageUrl} alt={recipe.title} className="recipe-detail-image"
                        onError={(e)=>{
                            e.target.style.display = 'none'
                            e.target.parentNode.innerHTML = `
                                    <div class="recipe-image-placeholder-large">
                                        <svg viewBox="0 0 24 24">
                                            <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                                        </svg>
                                        <span>No Image</span>
                                    </div>
                                `
                        }}
                        ></img>
                    )
                    :
                    (
                         <div className="recipe-image-placeholder-large">
                            <svg viewBox="0 0 24 24">
                                <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                            </svg>
                            <span>No Image</span>
                        </div>
                    )
                }
            </div>
            <div className="recipe-info">
                <div className="recipe-meta">
                    <span className="recipe-date">{formatDate(recipe.createdAt)}</span>
                    {recipe.isPinned && <span className="pinned-badge">📌 Pinned</span>}
                </div>
                <h1 className="recipe-detail-title">{recipe.title}</h1>
                {recipe.description && (
                        <div className="recipe-description-section">
                            <h3>Description</h3>
                            <p className="recipe-detail-description">{recipe.description}</p>
                        </div>
                )}
                <div className="ingredients-section-detail">
                    <h3>Ingredients</h3>
                    {recipe.ingredients && recipe.ingredients.length >0 ? (
                        <div className="ingredients-list-detail">
                            <div className="ingredients-header">
                                <span className="header-name">Ingredient</span>
                                <span className="header-weight">Weight</span>
                                <span className="header-quantity">Quantity</span>
                            </div>
                            {recipe.ingredients.map((ingredient,index)=>{
                                const amountStr = ingredient.amount || ''
                                const weight = parseWeight(amountStr)
                                const notes = ingredient.notes || ''
                                const quantity = parseQuantity(notes)
                                return (
                                    <div key={index} className="ingredient-item-detail">
                                        <span className="ingredient-name-detail">
                                            {ingredient.name || `Ingredient ${index + 1}`}
                                        </span>
                                        <span className="ingredient-weight-detail">{weight}g</span>
                                        <span className="ingredient-quantity-detail">{quantity}</span>
                                    </div>
                                )
                            })}
                        </div>
                    ) : (
                        <p className="no-ingredients">No ingredients added</p>
                    )}
                    <div className="total-weight-section">
                        <div className="total-weight-label">Total Weight:</div>
                        <div className="total-weight-value">{totalWeight}g</div>
                    </div>
                </div>
            </div>
        </main>
    </div>
  )
}
export default RecipeDetail