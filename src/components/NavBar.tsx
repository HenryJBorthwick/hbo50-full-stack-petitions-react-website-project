import React, { useState } from 'react';
import { AppBar, Toolbar, IconButton, Typography, Menu, MenuItem, Button } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { useNavigate } from 'react-router-dom';
import { API_HOST } from '../../config';
import axios from 'axios';
import { useUserStore } from '../store';

const NavigationBar: React.FC = () => {
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const navigate = useNavigate();
    const { user, setUser } = useUserStore((state) => ({
        user: state.user,
        setUser: state.setUser,
    }));

    const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleLogout = async () => {
        try {
            await axios.post(`${API_HOST}/users/logout`, {}, {
                headers: {
                    'X-Authorization': user?.token,
                },
            });
            setUser(null);
            navigate('/login');
        } catch (error) {
            console.error('Logout failed', error);
        }
        setAnchorEl(null);
    };

    return (
        <AppBar position="static">
            <Toolbar>
                <IconButton edge="start" color="inherit" aria-label="menu" onClick={handleMenu}>
                    <MenuIcon />
                </IconButton>
                <Typography variant="h6" style={{ flexGrow: 1 }}>
                    Petition Site
                </Typography>
                <Menu
                    id="menu-appbar"
                    anchorEl={anchorEl}
                    anchorOrigin={{
                        vertical: 'top',
                        horizontal: 'right',
                    }}
                    keepMounted
                    transformOrigin={{
                        vertical: 'top',
                        horizontal: 'right',
                    }}
                    open={Boolean(anchorEl)}
                    onClose={handleClose}
                >
                    <MenuItem onClick={() => { navigate('/'); handleClose(); }}>Home</MenuItem>
                    <MenuItem onClick={() => { navigate('/search'); handleClose(); }}>Search</MenuItem>
                    {user && (
                        <>
                            <MenuItem onClick={() => { navigate('/my-petitions'); handleClose(); }}>My Petitions</MenuItem>
                            <MenuItem onClick={() => { navigate('/profile'); handleClose(); }}>Profile</MenuItem>
                        </>
                    )}
                </Menu>
                {user ? (
                    <Button color="inherit" onClick={handleLogout}>Logout</Button>
                ) : (
                    <Button color="inherit" onClick={() => navigate('/login')}>Login</Button>
                )}
            </Toolbar>
        </AppBar>
    );
};

export default NavigationBar;
