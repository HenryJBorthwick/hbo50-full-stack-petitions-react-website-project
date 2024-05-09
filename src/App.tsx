import './App.css'
import {BrowserRouter as Router, Route, Routes} from 'react-router-dom';
import Register from './components/Register';
import MainPage from './components/MainPage';
import Petitions from './components/Petitions.tsx';

function App() {
    return (
        <div className="App">
            <Router>
                <div>
                    <Routes>
                        <Route path="/register" element={<Register/>}/>
                        <Route path={"/main"} element={<MainPage/>}/>
                        <Route path={"/petitions"} element={<Petitions/>}/>
                    </Routes>
                </div>
            </Router>
        </div>
    );
}

export default App