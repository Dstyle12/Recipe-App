import Header from '../../components/Layout/Header'
import './Home.css'
const Home = () =>{
    const handleSortChange = (event) =>{
        const sortValue = event.target.value
        console.log(sortValue)
    }
    return (
        <div className='home'>
            <Header onSortChange={handleSortChange}></Header>
        </div>
    )
}
export default Home