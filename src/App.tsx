import './App.css'
import {BrowserRouter as Router, Route, Routes} from 'react-router-dom';
import Register from './components/Register';
import LogIn from './components/Login.tsx';
import MainPage from './components/MainPage';
import Petitions from './components/Petitions.tsx';
import PetitionDetails from './components/PetitionDetails.tsx';
import CreatePetition from './components/CreatePetition.tsx';
import EditPetition from './components/EditPetition.tsx';
import MyPetitions from './components/MyPetitions.tsx';
import Profile from './components/Profile.tsx';

function App() {
    return (
        <div className="App">
            <Router>
                {/*put navbar here*/}
                <div>
                    <Routes>
                        <Route path={"/register"} element={<Register/>}/>
                        <Route path={"/login"} element={<LogIn/>}/>
                        <Route path={"/main"} element={<MainPage/>}/>
                        <Route path={"/petitions"} element={<Petitions/>}/>
                        <Route path={"petition/:id"} element={<PetitionDetails/>}/>
                        <Route path={"/create"} element={<CreatePetition/>}/>
                        <Route path={"/edit/:id"} element={<EditPetition/>}/>
                        <Route path={"/my-petitions"} element={<MyPetitions/>}/>
                        <Route path={"/profile"} element={<Profile/>}/>
                    </Routes>
                </div>
            </Router>
        </div>
    );
}

export default App