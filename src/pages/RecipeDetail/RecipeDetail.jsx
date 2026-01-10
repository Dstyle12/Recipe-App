import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useParams, useNavigate} from "react-router";
import { recipeAPI } from "../../services/api";
import './RecipeDetail.css'
const extractNumberFromString = (str) =>{
        if(!str || typeof str !== 'string') return ''
        let result = ''
        let hasFoundDigit = false
        let decimalCount = 0
        for(let i = 0;i<str.length;i++){
            const char = str[i]
            if(char>='0'&&char<='9'){
                result+=char
                hasFoundDigit = true
            }
            else if(char==='.' && hasFoundDigit && decimalCount===0){
                result+=char
                decimalCount =1
            }
            else if(hasFoundDigit && (char<'0'||char>'9')&&char!=='.'){
                break
            }
        }
        return result
    }
    const extractWeightFromAmount = (amountStr) =>{
        if(!amountStr) return '0'
        return extractNumberFromString(amountStr) || '0'
    }
    const extractTextAfterQuantity = (notes) =>{
        if(!notes) return ''
        const quantityPrefix = 'Quantity: '
        if(notes.includes(quantityPrefix)){
            const startIndex = notes.indexOf(quantityPrefix) + quantityPrefix.length
            return notes.slice(startIndex).trim()
        }
        return notes.trim()
    }
const RecipeDetail = () =>{
    const {id} = useParams()
    const navigate = useNavigate()
    const [isEditing, setIsEditing] = useState(false)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [isSaving, setIsSaving] = useState(false)
    const [originalRecipe, setOriginalRecipe] = useState(null)
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        image: null,
        imagePreview: null,
        imageUrl: null,
        isPinned: false
    })
    const [ingredients, setIngredients] =  useState([])
    const fileInputRef = useRef(null)
    const extractQuantityFromNotes = useCallback((notes) =>{
        if(!notes) return '1'
        const quantityText = extractTextAfterQuantity(notes)
        const quantity = extractNumberFromString(quantityText) || '1'
        return quantity
    },[])
    const loadRecipe = useCallback(async () =>{
        try{
            setLoading(true)
            setError(null)
            const data = await recipeAPI.getById(id)
            if(!data) throw new Error('No data received from server')
            setOriginalRecipe(data)
            setFormData({
                title: data.title || '',
                description: data.description || '',
                image: null,
                imagePreview: data.imageUrl ? `http://localhost:3001${data.imageUrl}` : null,
                imageUrl: data.imageUrl,
                isPinned: data.isPinned || false
            })
            let ingredientsArray = []
            if(data.ingredients && data.ingredients.length > 0){
                ingredientsArray = data.ingredients.map(ing=>{
                    const amountStr = ing.amount || ''
                    const weight = extractWeightFromAmount(amountStr)
                    const notes = ing.notes || ''
                    const quantity = extractQuantityFromNotes(notes) || '1'
                    return {
                        name: ing.name || `Ingredient`,
                        weight: weight,
                        quantity: quantity
                    }
                })
            }
            setIngredients(Array.isArray(ingredientsArray) ? ingredientsArray : [])
        }
        catch(error){
             console.error('❌ Error loading recipe:', error)
             setError('Failed to load recipe. Please try again.')
        }
        finally{
            setLoading(false)
        }
    },[id, extractQuantityFromNotes]) 
    useEffect(() => {
        console.log('🔧 useEffect triggered, id =', id)
        if(id) loadRecipe()
        else {
            setError('Recipe ID is missing')
            setLoading(false)
    }
    }, [loadRecipe, id])
    const handleEditToggle = useCallback(()=>{
        if(isEditing){
            if(originalRecipe){
                setFormData({
                    title: originalRecipe.title || '',
                    description: originalRecipe.description || '',
                    image: null,
                    imagePreview: originalRecipe.imageUrl ? `http://localhost:3001${originalRecipe.imageUrl}` : null,
                    imageUrl: originalRecipe.imageUrl,
                    isPinned: originalRecipe.isPinned || false
                })
                 let ingredientsArray = []
                 if(originalRecipe.ingredients && originalRecipe.ingredients.length > 0){
                        ingredientsArray = originalRecipe.ingredients.map(ing=>{
                            const amountStr = ing.amount || ''
                            const weight = extractWeightFromAmount(amountStr)
                            const notes = ing.notes || ''
                            const quantity = extractQuantityFromNotes(notes) || '1'
                            return {
                                name: ing.name || `Ingredient`,
                                weight: weight,
                                quantity: quantity
                            }
                        })
                    }
                    setIngredients(Array.isArray(ingredientsArray) ? ingredientsArray : [])
            }
        }
        setIsEditing(!isEditing)
    },[isEditing, originalRecipe, extractQuantityFromNotes])
    const handleInputChange = useCallback((e)=>{
        if(!isEditing) return
        const {name, value} = e.target
        setFormData(prev=>({...prev,[name]:value}))
    },[isEditing])
    const handleImageUpload = useCallback((e)=>{
        if(!isEditing) return
        const file = e.target.files[0]
        if(file){
            if(file.size > 5*1024*1024){
                alert('File is too big. Maximum size is 5MB')
                return
            }
        }
        const imagePreview = URL.createObjectURL(file)
        setFormData(prev=>({
             ...prev,
            image: file,
            imagePreview,
            imageUrl: null
        }))
    },[isEditing])
    const handleImageClick = useCallback(()=>{
        if(!isEditing) return
        fileInputRef.current.click()
    },[isEditing])
    const removeImage = useCallback(()=>{
        if(!isEditing) return
        setFormData(prev=>({
            ...prev,
            image: null,
            imagePreview: null,
            imageUrl: null
        }))
    },[isEditing])
    const handleIngredientUpdate = useCallback((index,field,value)=>{
        if(!isEditing) return
        setIngredients(prev=>{
            const safePrev = Array.isArray(prev) ? prev : []
            const newIngredients = [...safePrev]
            if(newIngredients[index]) {
            newIngredients[index] = { 
                ...newIngredients[index], 
                [field]: value 
            }
        }
        return newIngredients
        })
    },[isEditing])
    const handleIngredientRemove = useCallback((index)=>{
        if(!isEditing) return
        setIngredients(prev=>{
            const safePrev = Array.isArray(prev) ? prev : []
            return safePrev.filter((_,i)=>i!==index)}
        )
    },[isEditing])
   const addIngredient = useCallback(() => {
    if (!isEditing) return
    setIngredients(prev => {
      const safePrev = Array.isArray(prev) ? prev : []
      return [
        ...safePrev,
        { name: '', weight: '', quantity: '1' }
      ]
    })
  }, [isEditing])
    const handlePinToggle = useCallback(() =>{
        if(!isEditing) return
        setFormData(prev=>({...prev,isPinned:!prev.isPinned}))
    },[isEditing])
    const totalWeight = useMemo(() => {
    try {
      const safeIngredients = Array.isArray(ingredients) ? ingredients : []
      return safeIngredients.reduce((total, ingredient) => {
        const weightStr = ingredient?.weight || '0'
        const weight = parseFloat(weightStr) || 0
        return total + weight
      }, 0)
    } catch (err) {
      console.error('❌ Error calculating total weight:', err)
      return 0
    }
  }, [ingredients])
    const validateForm = useCallback(()=>{
        const safeIngredients = Array.isArray(ingredients) ? ingredients : []
        if(!formData.title.trim()){
            alert('Please enter recipe title')
            return false
        }
        if(safeIngredients.length === 0){
            alert('Please add at least one ingredient')
            return false
        }
        for(const ingredient of safeIngredients){
            if(!ingredient.name.trim() || !ingredient.weight || !ingredient.quantity){
                alert('Please fill all ingredient fields')
                return false
            }
        }
        return true
    },[formData.title, ingredients])
   const handleSave = useCallback(async() =>{
    const safeIngredients = Array.isArray(ingredients) ? ingredients : []
    if(!validateForm()) return
    try{
        setIsSaving(true)
        const ingredientsData = safeIngredients.map(ing=>({
            name: ing.name,
            amount: `${ing.weight}g`,
            notes: `Quantity: ${ing.quantity}`
        }))
        const formDataToSend = new FormData()
        formDataToSend.append('title',formData.title)
        formDataToSend.append('description',formData.description)
        formDataToSend.append('ingredients',JSON.stringify(ingredientsData))
        if(formData.image) formDataToSend.append('image',formData.image)
        const response = await recipeAPI.update(id,formDataToSend)
        if(formData.isPinned !== originalRecipe.isPinned) await recipeAPI.togglePin(id, formData.isPinned)
        if(originalRecipe) setOriginalRecipe({
            ...originalRecipe,
            ...response,
            isPinned: formData.isPinned
        })
        if(response.imageUrl){
            setFormData(prev=>({
                ...prev,
                imagePreview: `http://localhost:3001${response.imageUrl}`,
                imageUrl: response.imageUrl,
                image: null
            }))
        }
        alert('Recipe saved successfully!')
        setIsEditing(false)
        navigate('/')
    }
    catch(error){
        console.error('❌ ERROR saving recipe:', error)
        alert('Failed to save recipe. Please try again.')
    }
    finally{
        setIsSaving(false)
    } 
   },[validateForm,ingredients,formData,id,originalRecipe,navigate]) 
    const handleDelete = useCallback(async () =>{
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
    },[id,navigate])
    const isSaveValid = useMemo(() => {
    const safeIngredients = Array.isArray(ingredients) ? ingredients : []
    return formData.title.trim() && 
           safeIngredients.length > 0 && 
           safeIngredients.every(ing => 
             ing?.name?.trim() && 
             ing?.weight && 
             ing?.quantity
           )
  }, [formData.title, ingredients])
    const formatDate = useCallback((dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      })
    } catch (error) {
      return 'Unknown date' + error 
    }
  },[]) 
    if(loading){
        return (
            <div className="recipe-detail-page">
                <header className="recipe-detail-header">
                    <button className="back-button" onClick={() => navigate('/')}>← Back</button>
                    <div className="recipe-detail-header-center"></div>
                    <div className="recipe-detail-header-right"></div>
                </header>
                <div className="recipe-detail-loading-container">
                    <h1>Loading...</h1>
                </div>
            </div>
        )
    }
    if(error || !originalRecipe){
        return (
            <div className="recipe-detail-page">
                <header className="recipe-detail-header">
                    <button className="recipe-detail-back-button" onClick={() => navigate('/')}>← Back</button>
                    <div className="recipe-detail-header-center"></div>
                    <div className="recipe-detail-header-right"></div>
                </header>
                <main className="recipe-detail-main">
                    <p className="recipe-detail-error-message">{error || 'Recipe not found'}</p>
                </main>
            </div>
        )
    }
    const safeIngredients = Array.isArray(ingredients) ? ingredients : []
    console.log('Ингредиенты для отображения:', safeIngredients)
    console.log('Количество ингредиентов:', safeIngredients.length)
  return (
    <div className="recipe-detail-page">
        <header className="recipe-detail-header">
            <button className="recipe-detail-back-button" onClick={()=>navigate('/')}>← Back</button>
            <div className="recipe-detail-header-center">
               {isEditing ? (
                <button className="cancel-button" onClick={handleEditToggle}>✕ Cancel</button>
               ): (
                <button className="edit-button" onClick={handleEditToggle} title="Edit recipe">✏️ Edit</button>
               )}
            </div>
            <div className="recipe-detail-header-right">
                {isEditing ? (
                    <button className={`save-button ${!isSaveValid ? 'disabled' : ''}`} onClick={handleSave} disabled={!isSaveValid || isSaving}>{isSaving ? 'Saving...' : '💾 Save'}</button>
                ): (
                    <button className="delete-button" onClick={handleDelete}>🗑️ Delete</button>
                )}
            </div>
        </header>
        <main className="recipe-detail-main">
            <div className={`recipe-detail-image-section ${isEditing ? 'editable' : ''}`}>
                {
                    isEditing ? ( 
                        <>
                            <div className="recipe-detail-image-upload-area" onClick={handleImageClick}>
                                {formData.imagePreview ? (
                                    <div className="recipe-detail-image-preview-container">
                                        <img src={formData.imagePreview} className="recipe-detail-image-preview"></img>
                                        <button type="button" className="remove-btn-image" onClick={(e)=>{
                                            e.stopPropagation()
                                            removeImage()
                                        }}>×</button>
                                    </div>
                                ) : (
                                    <div className="recipe-detail-image-placeholder">
                                        <span>+ Change image</span>
                                        <span className="recipe-detail-image-hint">(Click to upload)</span>
                                    </div>
                                )}
                            </div>
                            <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="recipe-detail-image-input"></input>
                        </>
                    ) : (
                        <div className="recipe-detail-image-view">
                            {formData.imagePreview ? (
                                <img src={formData.imagePreview} className="recipe-detail-recipe-image"></img>
                            ) : (
                                 <div className="recipe-image-placeholder-large">
                                    <svg viewBox="0 0 24 24">
                                      <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                                    </svg>
                                    <span>No Image</span>
                                </div>
                            )}
                        </div>
                    )
                }
            </div>
            <div className="recipe-info">
                <div className="recipe-meta">
                    <span className="recipe-detail-recipe-date">{formatDate(originalRecipe.createdAt)}</span>
                    {isEditing ? (
                        <button className={`pinned-toggle ${formData.isPinned ? 'pinned' : ''}`} onClick={handlePinToggle}>{formData.isPinned ? '📌 Pinned' : '📍 Pin Recipe'}</button>
                    ) : originalRecipe.isPinned ? (
                        <span className="pinned-badge">📌 Pinned</span>
                    ) : null}
                </div>
                {isEditing ? (
                    <div className="form-group">
                        <label className="form-label">Recipe Name*</label>
                        <input type="text" name="title" value={formData.title} onChange={handleInputChange} className="recipe-detail-form-input" placeholder="Enter recipe name" required></input>
                    </div>
                ) : (
                    <h1 className="recipe-detail-title">{formData.title}</h1>
                )}
                {isEditing ? (
                    <div className="recipe-detail-form-group">
                        <label className="recipe-detail-form-label">Description</label>
                        <textarea name="description" value={formData.description} onChange={handleInputChange} className="recipe-detail-form-textarea" placeholder="Enter recipe description (optional)"  rows="4"></textarea>
                    </div>
                ) : formData.description ? (
                    <div className="recipe-description-section">
                        <h3 className="recipe-detail-description-title">Description</h3>
                        <p className="recipe-detail-description">{formData.description}</p>
                    </div>
                ) : null}
                <div className="ingredients-section">
                    <h3 className="recipe-detail-ingredients-title">Ingredients</h3>
                    {isEditing ? (
                        <>
                            <div className="ingredients-edit-controls">
                                <button className="ingredient-add-button" type="button" onClick={addIngredient}>+ Add Ingredient</button>
                            </div>
                            <div className="ingredients-grid-header">
                                <span className="grid-header">Ingredient Name</span>
                                <span className="grid-header">Weight (g)</span>
                                <span className="grid-header">Quantity</span>
                                <span className="grid-header">Action</span>
                            </div>
                            {safeIngredients.map((ingredient, index) => (
                                <div key={index} className="ingredient-edit-row">
                                    <input 
                                        type="text" 
                                        value={ingredient.name} 
                                        onChange={(e) => handleIngredientUpdate(index, 'name', e.target.value)} 
                                        placeholder="Ingredient name" 
                                        className="recipe-detail-ingredient-input" 
                                    />
                                    <input 
                                        type="number" 
                                        value={ingredient.weight} 
                                        onChange={(e) => handleIngredientUpdate(index, 'weight', e.target.value)} 
                                        placeholder="Weight" 
                                        className="recipe-detail-ingredient-input" 
                                        min="0" 
                                        step="1" 
                                    />
                                    <input 
                                        type="number" 
                                        value={ingredient.quantity} 
                                        onChange={(e) => handleIngredientUpdate(index, 'quantity', e.target.value)} 
                                        placeholder="Quantity" 
                                        className="recipe-detail-ingredient-input" 
                                        min="1" 
                                        step="1" 
                                    />
                                    <button 
                                        type='button' 
                                        className="recipe-detail-remove-ingredient-btn" 
                                        onClick={() => handleIngredientRemove(index)}
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                            {safeIngredients.length===0 && (
                                <div className="no-ingredients-hint">
                                    <p>No ingredients added. Add at least one ingredient to save.</p>
                                </div>
                            )}
                        </>
                    ) : (
                        <>
                            {safeIngredients.length > 0 ?(
                                <div className="ingredients-list">
                                    <div className="ingredients-header">
                                        <span className="recipe-detail-header-name">Ingredient</span>
                                        <span className="recipe-detail-header-weight">Weight</span>
                                        <span className="recipe-detail-header-quantity">Quantity</span>
                                    </div>
                                {safeIngredients.map((ingredient, index) => (
                                    <div key={index} className="recipe-detail-ingredient-item">
                                        <span className="recipe-detail-ingredient-name">
                                            {ingredient.name || `Ingredient ${index + 1}`}
                                        </span>
                                        <span className="recipe-detail-ingredient-weight">{ingredient.weight}g</span>
                                        <span className="recipe-detail-ingredient-quantity">{ingredient.quantity}</span>
                                    </div>
                                ))}
                                </div>
                            ) : (
                                <p className="no-ingredients">No ingredients added</p>
                            )}
                        </>
                    )}
                    </div>
                    <div className="total-weight-section">
                        <div className="total-weight-label">Total Weight:</div>
                        <div className="total-weight-value">{totalWeight}g</div>
                    </div>
                </div>
        </main>
    </div>
  )
}
export default RecipeDetail