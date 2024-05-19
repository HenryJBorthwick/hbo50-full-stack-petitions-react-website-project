import React, { useState, useEffect } from 'react';
import {
    Avatar, Button, CssBaseline, TextField,
    Link, Grid, Box, Typography, Container,
    createTheme, ThemeProvider, Alert, CircularProgress, Paper
} from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import axios from 'axios';
import { API_HOST } from '../../config';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '../store';
import NavBar from './NavBar';

const theme = createTheme();

export default function SignIn() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();
    const setUser = useUserStore((state) => state.setUser);
    const user = useUserStore((state) => state.user);

    useEffect(() => {
        // Redirect if user is already logged in
        if (user) {
            navigate('/petitions');
        }
    }, [user, navigate]);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const email = data.get('email');
        const password = data.get('password');

        if (!email || !password) {
            setError('Please enter both email and password.');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await axios.post(`${API_HOST}/users/login`, {
                email,
                password
            });
            setUser({ id: response.data.userId, token: response.data.token });
            navigate('/petitions');
        } catch (error: any) {
            if (axios.isAxiosError(error) && error.response) {
                switch (error.response.status) {
                    case 400:
                        setError('Invalid login request. Please check your input.');
                        break;
                    case 401:
                        setError('Incorrect email or password.');
                        break;
                    default:
                        setError('An unexpected error occurred. Please try again.');
                }
            } else {
                setError('Unable to connect to the server. Please try again later.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <ThemeProvider theme={theme}>
            <NavBar />
            <Container component="main" maxWidth="md" sx={{ mt: 8, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
                <CssBaseline />
                <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                        }}
                    >
                        <Avatar sx={{ m: 1, backgroundColor: 'secondary.main' }}>
                            <LockOutlinedIcon />
                        </Avatar>
                        <Typography component="h1" variant="h5">
                            Login
                        </Typography>
                        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
                            <TextField
                                margin="normal"
                                required
                                fullWidth
                                id="email"
                                label="Email Address"
                                name="email"
                                autoComplete="email"
                                autoFocus
                            />
                            <TextField
                                margin="normal"
                                required
                                fullWidth
                                name="password"
                                label="Password"
                                type="password"
                                id="password"
                                autoComplete="current-password"
                            />
                            {error && <Alert severity="error">{error}</Alert>}
                            <Button
                                type="submit"
                                fullWidth
                                variant="contained"
                                sx={{
                                    mt: 3,
                                    mb: 2,
                                    '&:hover': {
                                        backgroundColor: 'primary.dark',
                                    },
                                }}
                                disabled={loading}
                            >
                                {loading ? <CircularProgress size={24} /> : 'Sign In'}
                            </Button>
                            <Grid container justifyContent="flex-end">
                                <Grid item>
                                    <Link onClick={() => navigate('/register')} variant="body2" sx={{ cursor: 'pointer' }}>
                                        {"Don't have an account? Register"}
                                    </Link>
                                </Grid>
                            </Grid>
                        </Box>
                    </Box>
                </Paper>
            </Container>
        </ThemeProvider>
    );
}
