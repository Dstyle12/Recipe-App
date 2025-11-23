import { useState } from 'react'
import Header from './components/Layout/Header'
import './App.css'

function App() {
  const [currentView, setCurrentView] = useState('recipes')
  const handleAddRecipe = () =>{
    console.log('add recipe clicked')
    setCurrentView('add-recipe')
     console.log(currentView)
  }
  const handleSortChange = (event) =>{
    const sortValue = event.target.value
    console.log('Sort by:', sortValue)
    console.log(currentView)
  }
  return (
    <div className='app'>
      <Header onAddRecipe={handleAddRecipe} onSortChange={handleSortChange}></Header>
    </div>
  )
}

export default App
