import './App.css'
import {BrowserRouter as Router, Route, Routes} from 'react-router-dom';
import Register from './components/Register';
import LogIn from './components/Login.tsx';
import MainPage from './components/MainPage';
import Petitions from './components/Petitions.tsx';
import PetitionDetails from './components/PetitionDetails.tsx';

function App() {
    return (
        <div className="App">
            <Router>
                <div>
                    <Routes>
                        <Route path={"/register"} element={<Register/>}/>
                        <Route path={"/login"} element={<LogIn/>}/>
                        <Route path={"/main"} element={<MainPage/>}/>
                        <Route path={"/petitions"} element={<Petitions/>}/>
                        <Route path={"petitions/:id"} element={<PetitionDetails/>}/>
                    </Routes>
                </div>
            </Router>
        </div>
    );
}

export default App