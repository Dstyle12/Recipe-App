import { useEffect } from 'react'
import Header from '../../components/Layout/Header'
import { useRecipes } from '../../hooks/useRecipes'
import './Home.css'
const Home = () =>{
    const {recipes,  loadRecipes} = useRecipes()
    const handleSortChange = (event) =>{
        const sortValue = event.target.value
        console.log(sortValue)
    }
    useEffect(()=>{
        loadRecipes()
    },[loadRecipes])
    useEffect(()=>{
        if(recipes.length>0){
             console.log('Loaded recipes:', recipes)
             recipes.forEach(recipe=>{
                console.log(`Recipe: ${recipe.title}`)
                console.log(`Description: ${recipe.description}`)
                console.log(`Image: ${recipe.image}`)
                const totalWeight = recipe.ingredients.reduce((sum,ing)=>{
                    const weightString = ing.amount.replace('g','').trim()
                    const weight = parseFloat(weightString) || 0
                    return sum + weight
                },0) || 0
                console.log(`Total Weight: ${totalWeight}g`);
                console.log(`Ingredients Count: ${recipe.ingredients?.length || 0}`);
                console.log('---')
             })
        }
    }, [recipes])
    return (
        <div className='home'>
            <Header onSortChange={handleSortChange}></Header>
        </div>
    )
}
export default Home