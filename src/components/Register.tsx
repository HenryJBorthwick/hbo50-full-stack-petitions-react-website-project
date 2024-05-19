import React, { useState } from 'react';
import {
    Avatar,
    Button,
    CssBaseline,
    TextField,
    Link,
    Grid,
    Box,
    Container,
    Typography,
    createTheme,
    ThemeProvider,
    Alert,
    InputAdornment,
    IconButton,
    Tooltip,
    Paper
} from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import axios, { AxiosError } from 'axios';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '../store';
import NavBar from './NavBar';
import { API_HOST } from '../../config';
import ImageUpload from './ImageUpload';
import { generateDefaultAvatar, convertCanvasToBlob } from '../utils/avatarUtils';

const theme = createTheme();

// Generate the default avatar image as a base64 string
const defaultAvatarCanvas = generateDefaultAvatar('P');
const defaultAvatarImage = defaultAvatarCanvas.toDataURL();

export default function Register() {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});
    const setUser = useUserStore((state) => state.setUser);
    const navigate = useNavigate();

    const handleClickShowPassword = () => {
        setShowPassword(!showPassword);
    };

    const handleMouseDownPassword = (event: React.MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError(null);
        setFieldErrors({});
        const user = { email, firstName, lastName, password };

        try {
            // Register the user
            await axios.post(`${API_HOST}/users/register`, user);

            // Login the user
            const loginResponse = await axios.post(`${API_HOST}/users/login`, {
                email: user.email,
                password: user.password,
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
                if (error.response?.status === 400) {
                    const responseErrors = error.response.data.errors || error.response.data;
                    if (responseErrors) {
                        const errors: { [key: string]: string } = {};
                        responseErrors.forEach((err: { field: string; message: string }) => {
                            errors[err.field] = err.message;
                        });
                        setFieldErrors(errors);
                    } else {
                        setError('Invalid information. Please check your input.');
                    }
                } else if (error.response?.status === 403) {
                    setError('Email already in use. Please use a different email.');
                } else {
                    setError('An unexpected error occurred. Please try again.');
                }
            } else {
                setError('An unexpected error occurred. Please try again.');
            }
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
                            Register
                        </Typography>
                        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
                            <Box sx={{ mb: 3 }}>
                                <ImageUpload
                                    initialImage={defaultAvatarImage}
                                    onImageChange={setSelectedImage}
                                    onImageRemove={() => setSelectedImage(null)}
                                    editMode={true}
                                />
                            </Box>
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        name="firstName"
                                        required
                                        fullWidth
                                        id="firstName"
                                        label="First Name"
                                        autoFocus
                                        value={firstName}
                                        onChange={(e) => setFirstName(e.target.value)}
                                        error={!!fieldErrors.firstName}
                                        helperText={fieldErrors.firstName}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        required
                                        fullWidth
                                        id="lastName"
                                        label="Last Name"
                                        name="lastName"
                                        value={lastName}
                                        onChange={(e) => setLastName(e.target.value)}
                                        error={!!fieldErrors.lastName}
                                        helperText={fieldErrors.lastName}
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField
                                        required
                                        fullWidth
                                        id="email"
                                        label="Email Address"
                                        name="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        error={!!fieldErrors.email}
                                        helperText={fieldErrors.email}
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField
                                        required
                                        fullWidth
                                        name="password"
                                        label="Password"
                                        type={showPassword ? 'text' : 'password'}
                                        id="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        InputProps={{
                                            endAdornment: (
                                                <InputAdornment position="end">
                                                    <Tooltip title={showPassword ? "Hide Password" : "Show Password"}>
                                                        <IconButton
                                                            aria-label="toggle password visibility"
                                                            onClick={handleClickShowPassword}
                                                            onMouseDown={handleMouseDownPassword}
                                                            edge="end"
                                                        >
                                                            {showPassword ? <VisibilityOff /> : <Visibility />}
                                                        </IconButton>
                                                    </Tooltip>
                                                </InputAdornment>
                                            ),
                                        }}
                                        error={!!fieldErrors.password}
                                        helperText={fieldErrors.password}
                                    />
                                </Grid>
                            </Grid>
                            <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2, '&:hover': { backgroundColor: 'primary.dark', } }}>
                                Register
                            </Button>
                            {error && <Alert severity="error">{error}</Alert>}
                            <Grid container justifyContent="flex-end">
                                <Grid item>
                                    <Link onClick={() => navigate('/login')} variant="body2" sx={{ cursor: 'pointer' }}>
                                        Already have an account? Login
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
