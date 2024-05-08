import { Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const MainPage = () => {
    const navigate = useNavigate();

    const handleButtonClick = () => {
        navigate('/petitions');
    };

    return (
        <div>
            <h1>Welcome to the Main Page</h1>
            <p>This is the main page of the application.</p>
            <Button variant="contained" color="primary" onClick={handleButtonClick}>
                Go to Petitions
            </Button>
        </div>
    );
};

export default MainPage;