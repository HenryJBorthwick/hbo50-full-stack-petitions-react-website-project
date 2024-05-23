import React, { useState, useEffect } from 'react';
import {
    AppBar,
    Toolbar,
    IconButton,
    Typography,
    Button,
    Container,
    Box,
    Avatar,
    MenuItem,
    Menu,
    Tooltip
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { useNavigate } from 'react-router-dom';
import { API_HOST } from '../../config';
import axios from 'axios';
import { useUserStore } from '../store';

const NavigationBar: React.FC = () => {
    const [anchorElNav, setAnchorElNav] = useState<null | HTMLElement>(null);
    const [profileImage, setProfileImage] = useState<string>('/images/default-avatar.png');
    const navigate = useNavigate();
    const { user, setUser } = useUserStore((state) => ({
        user: state.user,
        setUser: state.setUser,
    }));

    useEffect(() => {
        const fetchProfileImage = async (retries = 3, delay = 1000) => {
            if (user) {
                try {
                    const response = await axios.get(`${API_HOST}/users/${user.id}/image`, { responseType: 'blob' });
                    if (response.status === 200) {
                        const imageUrl = URL.createObjectURL(response.data);
                        setProfileImage(imageUrl);
                    } else {
                        setProfileImage('/images/default-avatar.png');
                    }
                } catch (error: unknown) {
                    if (axios.isAxiosError(error)) {
                        if (error.response && error.response.status === 404 && retries > 0) {
                            // Retry after a delay if 404 is encountered
                            setTimeout(() => fetchProfileImage(retries - 1, delay), delay);
                        } else {
                            console.error('Failed to fetch profile image:', error);
                            setProfileImage('/images/default-avatar.png');
                        }
                    } else {
                        console.error('An unexpected error occurred:', error);
                        setProfileImage('/images/default-avatar.png');
                    }
                }
            }
        };

        fetchProfileImage();
    }, [user]);

    const handleOpenNavMenu = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorElNav(event.currentTarget);
    };

    const handleCloseNavMenu = () => {
        setAnchorElNav(null);
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
    };

    const pages = [
        { name: 'Petitions', path: '/petitions' },
        { name: 'My Petitions', path: '/my-petitions' },
        { name: 'Create Petition', path: '/create' },
        { name: 'My Profile', path: '/profile' }
    ];

    return (
        <AppBar position="static" color="primary">
            <Container maxWidth="xl">
                <Toolbar disableGutters>
                    <Typography
                        variant="h6"
                        noWrap
                        onClick={() => navigate('/petitions')}
                        sx={{
                            mr: 2,
                            display: { xs: 'none', md: 'flex' },
                            fontFamily: 'monospace',
                            fontWeight: 700,
                            letterSpacing: '.3rem',
                            color: 'inherit',
                            textDecoration: 'none',
                            cursor: 'pointer',
                        }}
                    >
                        POPULI
                    </Typography>

                    <Box sx={{ flexGrow: 1, display: { xs: 'flex', md: 'none' } }}>
                        <IconButton
                            size="large"
                            aria-label="account of current user"
                            aria-controls="menu-appbar"
                            aria-haspopup="true"
                            onClick={handleOpenNavMenu}
                            color="inherit"
                        >
                            <MenuIcon />
                        </IconButton>
                        <Menu
                            id="menu-appbar"
                            anchorEl={anchorElNav}
                            anchorOrigin={{
                                vertical: 'bottom',
                                horizontal: 'left',
                            }}
                            keepMounted
                            transformOrigin={{
                                vertical: 'top',
                                horizontal: 'left',
                            }}
                            open={Boolean(anchorElNav)}
                            onClose={handleCloseNavMenu}
                            sx={{
                                display: { xs: 'block', md: 'none' },
                            }}
                        >
                            {pages.map((page) => (
                                <MenuItem key={page.name} onClick={() => { navigate(page.path); handleCloseNavMenu(); }}>
                                    <Typography textAlign="center">{page.name}</Typography>
                                </MenuItem>
                            ))}
                        </Menu>
                    </Box>
                    <Typography
                        variant="h5"
                        noWrap
                        onClick={() => navigate('/petitions')}
                        sx={{
                            mr: 2,
                            display: { xs: 'flex', md: 'none' },
                            flexGrow: 1,
                            fontFamily: 'monospace',
                            fontWeight: 700,
                            letterSpacing: '.3rem',
                            color: 'inherit',
                            textDecoration: 'none',
                            cursor: 'pointer',
                        }}
                    >
                        POPULI
                    </Typography>
                    <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' } }}>
                        {pages.map((page) => (
                            <Button
                                key={page.name}
                                onClick={() => { navigate(page.path); handleCloseNavMenu(); }}
                                sx={{ my: 2, color: 'white', display: 'block' }}
                            >
                                {page.name}
                            </Button>
                        ))}
                    </Box>

                    <Box sx={{ flexGrow: 0, display: 'flex', alignItems: 'center' }}>
                        {user ? (
                            <>
                                <Tooltip title="User Profile">
                                    <IconButton sx={{ p: 0 }} onClick={() => navigate('/profile')}>
                                        <Avatar alt="User Avatar" src={profileImage} />
                                    </IconButton>
                                </Tooltip>
                                <Button color="inherit" onClick={handleLogout}>Logout</Button>
                            </>
                        ) : (
                            <>
                                <Button color="inherit" onClick={() => navigate('/register')}>Register</Button>
                                <Button color="inherit" onClick={() => navigate('/login')}>Login</Button>
                            </>
                        )}
                    </Box>
                </Toolbar>
            </Container>
        </AppBar>
    );
};

export default NavigationBar;
