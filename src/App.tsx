import './app.css';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Register from './components/Register';
import LogIn from './components/Login.tsx';
import Petitions from './components/Petitions.tsx';
import PetitionDetails from './components/PetitionDetails.tsx';
import CreatePetition from './components/CreatePetition.tsx';
import EditPetition from './components/EditPetition.tsx';
import MyPetitions from './components/MyPetitions.tsx';
import Profile from './components/Profile.tsx';
import RequireAuth from './components/RequireAuth';

function App() {
    return (
        <div id="root" className="App">
            <Router>
                <Routes>
                    <Route path="/register" element={<Register />} />
                    <Route path="/login" element={<LogIn />} />
                    <Route path="/petitions" element={<Petitions />} />
                    <Route path="/petition/:id" element={<PetitionDetails />} />
                    <Route path="/create" element={<RequireAuth><CreatePetition /></RequireAuth>} />
                    <Route path="/edit/:id" element={<RequireAuth><EditPetition /></RequireAuth>} />
                    <Route path="/my-petitions" element={<RequireAuth><MyPetitions /></RequireAuth>} />
                    <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />
                </Routes>
            </Router>
        </div>
    );
}

export default App;
