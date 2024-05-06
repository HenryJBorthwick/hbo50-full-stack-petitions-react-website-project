import './App.css'
import {BrowserRouter as Router, Route, Routes} from 'react-router-dom';
import Register from './components/Register';

function App() {
    return (
        <div className="App">
            <Router>
                <div>
                    <Routes>
                        <Route path="/register" element={<Register/>}/>
                    </Routes>
                </div>
            </Router>
        </div>
    );
}

export default App