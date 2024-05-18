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
import axios, { AxiosError } from 'axios';
import { useUserStore } from '../store';
import NavBar from './NavBar.tsx';

const defaultTheme = createTheme();

const generateDefaultAvatar = (initial: string): HTMLCanvasElement => {
    const canvas = document.createElement('canvas');
    canvas.width = 100;
    canvas.height = 100;
    const context = canvas.getContext('2d');

    if (context) {
        context.fillStyle = '#ccc';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.fillStyle = '#000';
        context.font = '50px Arial';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(initial, canvas.width / 2, canvas.height / 2);
    }

    return canvas;
};

const convertCanvasToBlob = (canvas: HTMLCanvasElement, type: string): Promise<Blob> => {
    return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
            if (blob) {
                resolve(blob);
            } else {
                reject(new Error('Canvas to Blob conversion failed.'));
            }
        }, type);
    });
};

export default function SignUp() {
    const [selectedImage, setSelectedImage] = React.useState<File | null>(null);
    const setUser = useUserStore(state => state.setUser);
    const [error, setError] = React.useState<string | null>(null);
    const navigate = useNavigate();

    const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            setSelectedImage(event.target.files[0]);
        }
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);

        const user = {
            email: data.get('email') as string,
            firstName: data.get('firstName') as string,
            lastName: data.get('lastName') as string,
            password: data.get('password') as string
        };

        try {
            // Register the user
            await axios.post(`${API_HOST}/users/register`, user);

            // Login the user
            const loginResponse = await axios.post(`${API_HOST}/users/login`, {
                email: user.email,
                password: user.password
            });

            // Store the user ID and token in the store
            setUser({ id: loginResponse.data.userId, token: loginResponse.data.token });

            let imageData: ArrayBuffer;
            let contentType: string;

            if (selectedImage) {
                // Convert File to ArrayBuffer
                imageData = await selectedImage.arrayBuffer();
                contentType = selectedImage.type;
            } else {
                // Generate and upload default avatar
                const initial = user.firstName.charAt(0).toUpperCase();
                const canvas = generateDefaultAvatar(initial);
                const blob = await convertCanvasToBlob(canvas, 'image/png');
                imageData = await blob.arrayBuffer();
                contentType = 'image/png';
            }

            // Upload the user image
            await axios.put(`${API_HOST}/users/${loginResponse.data.userId}/image`, imageData, {
                headers: {
                    'X-Authorization': loginResponse.data.token,
                    'Content-Type': contentType
                }
            });

            // Redirect to petitions page on successful registration
            navigate('/petitions');
        } catch (error: unknown) {
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
            <NavBar />
            <Container component="main" maxWidth="xs" sx={{ marginTop: 8 }}>
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
                                    src={selectedImage ? URL.createObjectURL(selectedImage) : '/images/default-avatar.png'}
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
