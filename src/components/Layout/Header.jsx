import './Header.css'
const Header = ({onAddRecipe, onSortChange})=>{
    return (
        <header className='header'>
            <div className='header-left'>
                <button className='add-recipe-btn' onClick={onAddRecipe}>+ Add Recipe</button>
            </div>
            <div className='header-center'>
                <h1 className='app-title'>MY RECIPE APP</h1>
            </div>
            <div className='header-right'>
                <select className='sort-select' onClick={onSortChange} defaultValue=''>
                     <option value='' disabled>Sort by...</option>
                     <option value="name-asc">A → Z</option>
                     <option value="name-desc">Z → A</option>
                     <option value="weight-asc">Weight ↑</option>
                     <option value="weight-desc">Weight ↓</option>
                     <option value="ingredients-asc">Ingredients ↑</option>
                     <option value="ingredients-desc">Ingredients ↓</option>
                </select>
            </div>
        </header>
    )
}
export default Header