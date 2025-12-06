import './Header.css'
import { Link } from 'react-router-dom'
const Header = ({onSortChange})=>{
    const handleSortChange = (event) =>{
        onSortChange(event)
    }
    return (
        <header className='header'>
            <div className='header-left'>
                <Link className='add-recipe-btn' to="/create-recipe">+ Add Recipe</Link>
            </div>
            <div className='header-center'>
                <h1 className='app-title'>MY RECIPE APP</h1>
            </div>
            <div className='header-right'>
                <select className='sort-select' onChange={handleSortChange} defaultValue=''>
                     <option value='' disabled>Sort by...</option>
                     <option value="newest">Newest First</option>
                     <option value="oldest">Oldest First</option>
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