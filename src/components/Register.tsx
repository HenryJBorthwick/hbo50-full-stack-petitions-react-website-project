import * as React from 'react';
import { API_HOST } from '../../config';
import { useNavigate } from 'react-router-dom';
import {
    Avatar,
    Button,
    CssBaseline,
    TextField,
    Link,
    Grid,
    Box,
    Container,
    IconButton,
    Typography,
    createTheme,
    ThemeProvider,
    Alert
} from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import axios, { AxiosError } from "axios";
import { useUserStore } from "../store";
import NavBar from './NavBar.tsx';

const defaultTheme = createTheme();

export default function SignUp() {
    const [selectedImage, setSelectedImage] = React.useState<string | null>(null);
    const setUser = useUserStore(state => state.setUser);
    const [error, setError] = React.useState<string | null>(null);
    const navigate = useNavigate();

    // Handle the image change for profile picture
    const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            const reader = new FileReader();
            reader.onload = e => setSelectedImage(e.target?.result as string);
            reader.readAsDataURL(event.target.files[0]);
        }
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);

        const user = {
            email: data.get('email'),
            firstName: data.get('firstName'),
            lastName: data.get('lastName'),
            password: data.get('password')
        };

        try {
            // Register the user
            const registerResponse = await axios.post(`${API_HOST}/users/register`, user);
            console.log(registerResponse.data);

            // Login the user
            const loginResponse = await axios.post(`${API_HOST}/users/login`, {
                email: user.email,
                password: user.password
            });
            console.log(loginResponse.data);

            // Store the user ID and Token in the store
            setUser({ id: loginResponse.data.userId, token: loginResponse.data.token });

            if (selectedImage) {
                // Determine the content type based on the file extension
                let contentType = '';
                if (selectedImage.endsWith('.png')) {
                    contentType = 'image/png';
                } else if (selectedImage.endsWith('.jpg') || selectedImage.endsWith('.jpeg')) {
                    contentType = 'image/jpeg';
                } else if (selectedImage.endsWith('.gif')) {
                    contentType = 'image/gif';
                }

                // Upload the user image
                const imageBlob = await fetch(selectedImage).then(res => res.blob());
                const imageResponse = await axios.put(`${API_HOST}/users/${loginResponse.data.userId}/image`, imageBlob, {
                    headers: {
                        'X-Authorization': `${loginResponse.data.token}`,
                        'Content-Type': contentType
                    }
                });
                console.log(imageResponse);
            }

            // Redirect to petitions page on successful registration
            navigate('/petitions');

        } catch (error: unknown) {
            console.error('Error:', error);
            if (error instanceof AxiosError) {
                switch (error.response?.status) {
                    case 400:
                        setError('Invalid information. Please check your input.');
                        break;
                    case 403:
                        setError('Email already in use. Please use a different email.');
                        break;
                    case 500:
                        setError('Internal server error. Please try again later.');
                        break;
                    default:
                        setError('An unexpected error occurred. Please try again.');
                }
            } else {
                setError('An unexpected error occurred. Please try again.');
            }
        }
    };

    return (
        <ThemeProvider theme={defaultTheme}>
            <NavBar /> {/* Add the NavBar at the top */}
            <Container component="main" maxWidth="xs" sx={{ marginTop: 8 }}> {/* Add marginTop to prevent overlap */}
                <CssBaseline />
                <Box
                    sx={{
                        marginTop: 8,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                    }}
                >
                    <Avatar sx={{ m: 1, bgcolor: 'secondary.main' }}>
                        <LockOutlinedIcon />
                    </Avatar>
                    <Typography component="h1" variant="h5">
                        Register
                    </Typography>

                    <Box component="form" noValidate onSubmit={handleSubmit} sx={{ mt: 3 }}>
                        <input
                            accept="image/*"
                            style={{ display: 'none' }}
                            id="contained-button-file"
                            type="file"
                            onChange={handleImageChange}
                        />
                        <label htmlFor="contained-button-file">
                            <IconButton component="span">
                                <Avatar
                                    src={selectedImage || '/images/default-avatar.png'}
                                    style={{
                                        margin: "10px",
                                        width: "60px",
                                        height: "60px",
                                    }}
                                />
                            </IconButton>
                        </label>

                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    autoComplete="given-name"
                                    name="firstName"
                                    required
                                    fullWidth
                                    id="firstName"
                                    label="First Name"
                                    autoFocus
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    required
                                    fullWidth
                                    id="lastName"
                                    label="Last Name"
                                    name="lastName"
                                    autoComplete="family-name"
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    required
                                    fullWidth
                                    id="email"
                                    label="Email Address"
                                    name="email"
                                    autoComplete="email"
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    required
                                    fullWidth
                                    name="password"
                                    label="Password"
                                    type="password"
                                    id="password"
                                    autoComplete="new-password"
                                />
                            </Grid>
                        </Grid>

                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            sx={{ mt: 3, mb: 2 }}
                        >
                            Sign Up
                        </Button>

                        {error && <Alert severity="error">{error}</Alert>}

                        <Grid container justifyContent="flex-end">
                            <Grid item>
                                <Link onClick={() => navigate('/login')} variant="body2">
                                    Already have an account? Sign in
                                </Link>
                            </Grid>
                        </Grid>
                    </Box>
                </Box>
            </Container>
        </ThemeProvider>
    );
}
