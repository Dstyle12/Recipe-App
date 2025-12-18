import { Routes, Route, useLocation } from 'react-router-dom';
import Home from './pages/Home/Home';
import CreateRecipe from './pages/CreateRecipe/CreateRecipe';
import RecipeDetail from './pages/RecipeDetail/RecipeDetail';
import './App.css';

function App() {
  const location = useLocation()
  console.log('🔍 APP: Current location:', location.pathname);
  console.log('🔍 APP: Looking for pattern: /recipe/:id');
  console.log('🔍 APP: Does it match?', location.pathname.startsWith('/recipe/'));
  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/create-recipe" element={<CreateRecipe />} />
        <Route path="/recipe/:id" element={<RecipeDetail />} />
      </Routes>
    </div>
  );
}
export default App
