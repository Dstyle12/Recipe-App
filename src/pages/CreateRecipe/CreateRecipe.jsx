import { useState, useRef } from "react";
import {useNavigate} from 'react-router-dom'
import { useRecipes } from "../../hooks/useRecipes";
import './CreateRecipe.css'

const CreateRecipe = () =>{
    const navigate = useNavigate()
    const { createRecipe } = useRecipes()
    const fileInputRef = useRef(null)
    const [formData, setFormData] = useState({
        name : '',
        description: '',
        image: null,
        imageUrl: ''
    })
    const [ingredients, setIngredients] = useState([])
    const [isAddingIngredient, setIsAddingIngredient] = useState(false)
    const [currentIngredient, setCurrentIngredient] = useState({
        name: '',
        weight: '',
        quantity: ''
    })
    const handleImageUpload = (event) =>{
        const file = event.target.files[0]
        if(file){
            if(file.size > 5 * 1024 * 1024){
                alert('File is too big. Maximum size is 5MB')
                return
            }
            const imageUrl = URL.createObjectURL(file)
            setFormData(prev=>({
                ...prev,
                image:file,
                imageUrl
            }))
        }
    }
    const handleImageClick = ()=>{
        fileInputRef.current.click()
    }
    const startAddingIngredient = () =>{
        setIsAddingIngredient(true)
    }
    const cancelAddingIngredient = () =>{
        setIsAddingIngredient(false)
        setCurrentIngredient({name:'',weight:'',quantity:''})
    }
    const addIngredient = () =>{
        if(currentIngredient.name && currentIngredient.weight && currentIngredient.quantity){
            const newIngredient = {
                name: currentIngredient.name,
                weight: currentIngredient.weight,
                quantity: currentIngredient.quantity
            }
            setIngredients(prev=>[...prev,newIngredient])
            setCurrentIngredient({name:'',weight:'',quantity:''})
            setIsAddingIngredient(false)
        }
    }
    const removeIngredient = (index) =>{
        setIngredients(prev => prev.filter((_,i)=>i!==index))
    }
    const totalWeight = ingredients.reduce((total,ingredient)=>{
        return total + (parseFloat(ingredient.weight)||0)
    },0)
    const handleIngredientChange = (field, value) =>{
        setCurrentIngredient(prev=>({...prev, [field]:value}))
    }
    const handleAddRecipe = async () => {
    if (!formData.name.trim()) {
      alert('Please enter recipe name')
      return
    }
    if (ingredients.length === 0) {
      alert('Please add at least one ingredient')
      return
    }
    try {
    const ingredientsData =
      ingredients.map(ing => ({
        ingredientId: Date.now() + Math.random(), 
        amount: `${ing.weight}g`,
        notes: `Quantity: ${ing.quantity}`
      }))
    
    console.log('📦 Ingredients to send:', ingredientsData)
     const formDataToSend = new FormData()
    formDataToSend.append('title',formData.name)
    formDataToSend.append('description',formData.description)
    formDataToSend.append('ingredients',JSON.stringify(ingredientsData))
    if(formData.image){
        console.log('📸 Adding image to FormData')
        formDataToSend.append('image',formData.image)
    } 
    console.log('📤 Sending recipe data...')
    await createRecipe(formDataToSend);
    alert('Recipe created successfully!');
    navigate('/');
  } catch (error) {
    console.error('❌ Error creating recipe:', error);
    alert('Failed to create recipe. Please try again.');
  }
  }
  const isAddButtonActive = formData.name.trim() && ingredients.length > 0
    return (
        <div className="create-recipe-page">
            <header className="create-recipe-header">
                <button className="back-button" onClick={()=> navigate('/')}>← Back</button>
                <h1 className="create-recipe-title">Create Recipe</h1>
            </header>
            <main className="create-recipe-main">
                <div className="recipe-form">
                    <div className="image-upload-section">
                        <div className="image-upload-area" onClick={handleImageClick}>
                            {formData.imageUrl ? (
                                <img src={formData.imageUrl} alt="Recipe review" className="image-preview"></img>
                            ) : (
                                <div className="image-placeholder">
                                    <span>+ Upload image</span>
                                    <span className="image-hint">(Optional)</span>
                                </div>
                            )}
                        </div>
                        <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="image-input"></input>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Recipe Name*</label>
                        <input type="text" value={formData.name} onChange={(e)=> setFormData(prev=>({...prev,name: e.target.value}))} className="form-input" placeholder="Enter recipe name"></input>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Description</label>
                        <textarea value={formData.description} onChange={(e)=>setFormData(prev=>({...prev,description:e.target.value}))} className="form-textarea" placeholder="Enter recipe description(optional)" rows="4"></textarea>
                    </div>
                    <div className="ingredients-section">
                        <label className="form-label">Ingredients</label>
                        {ingredients.map((ingredient,index)=>(
                            <div key={index} className="ingredient-item">
                                <span className="ingredient-name">{ingredient.name}</span>
                                <span className="ingredient-details">
                                    {ingredient.weight}g × {ingredient.quantity}
                                </span>
                                <button type="button" className="remove-ingredient-btn" onClick={()=> removeIngredient(index)}>−</button>
                            </div>
                        ))}
                        {!isAddingIngredient ? (
                            <button type="button" className="add-ingredient-button" onClick={startAddingIngredient}>+ Add Ingredient</button>
                        )
                        :
                        (
                            <div className="ingredient-form">
                                <div className="ingredient-inputs">
                                    <input type="text" value={currentIngredient.name} onChange={(e) => handleIngredientChange('name',e.target.value)}  placeholder="Ingredient name *" className="ingredient-input"></input>
                                    <input type="number" value={currentIngredient.weight} onChange={(e) => handleIngredientChange('weight',e.target.value)} placeholder="Weight (g) *" className="ingredient-input"></input>
                                    <input type="number"  value={currentIngredient.quantity} onChange={(e) => handleIngredientChange('quantity',e.target.value)} placeholder="Quantity *" className="ingredient-input"></input>
                                </div>
                                <div className="ingredient-actions">
                                    <button type="button" className="confirm-ingredient-btn"  onClick={addIngredient} disabled={!currentIngredient.name || !currentIngredient.weight || !currentIngredient.quantity}>Add</button>
                                    <button type="button" className="cancel-ingredient-btn"  onClick={cancelAddingIngredient}>Cancel</button>
                                </div>
                            </div>
                        )
                        }
                    </div>
                    <div className="total-weight">
                        Total Weight: <strong>{totalWeight}g</strong>
                    </div>
                    <button type="button" className={`add-recipe-button ${isAddButtonActive ?  'active' : 'inactive'}`} disabled={!isAddButtonActive} onClick={handleAddRecipe}>Add Recipe</button>
                </div>
            </main>
        </div>
    )
}
export default CreateRecipe