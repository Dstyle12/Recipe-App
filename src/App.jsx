import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home/Home';
import CreateRecipe from './pages/CreateRecipe/CreateRecipe';
import './App.css';

function App() {
  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/create-recipe" element={<CreateRecipe />} />
      </Routes>
    </div>
  );
}
export default App
