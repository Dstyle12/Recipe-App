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
    useEffect(() => {
        if(recipes.length > 0){
             console.log('Loaded recipes:', recipes)
        }
    }, [recipes])
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
            {recipes.map((recipe) => (
              <div key={recipe.id} className="recipe-card">
                <div className="recipe-card-header">
                  <h3>{recipe.title}</h3>
                </div>
                <div className="recipe-card-body">
                  <p className="recipe-description">
                    {recipe.description || 'No description provided'}
                  </p>
                  <div className="recipe-ingredients">
                    <h4>Ingredients:</h4>
                    <ul>
                      {recipe.ingredients?.map((ing, index) => (
                        <li key={index}>
                          {ing.notes} - {ing.amount}
                        </li>
                      )) || <li>No ingredients</li>}
                    </ul>
                  </div>
                  <div className="recipe-stats">
                    <span className="stat">
                      <strong>Total Weight:</strong> {recipe.totalWeight || 
                        recipe.ingredients?.reduce((sum, ing) => {
                          const weightMatch = ing.amount?.match(/(\d+)g/);
                          return sum + (weightMatch ? parseInt(weightMatch[1]) : 0);
                        }, 0) || 0}g
                    </span>
                    <span className="stat">
                      <strong>Ingredients:</strong> {recipe.ingredients?.length || 0}
                    </span>
                  </div>
                </div>
                <div className="recipe-card-footer">
                  <span className="created-date">
                    Created: {new Date(recipe.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
    )
}
export default Home