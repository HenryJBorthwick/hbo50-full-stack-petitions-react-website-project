import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, Box, CircularProgress, Alert, TextField, Button, Typography, Paper, CssBaseline, createTheme, ThemeProvider } from '@mui/material';
import { useUserStore } from '../store';
import { API_HOST } from '../../config';
import NavigationBar from './NavBar';
import ImageUpload from './ImageUpload';
import { generateDefaultAvatar, convertCanvasToBlob } from '../utils/avatarUtils';

interface UserProfile {
    firstName: string;
    lastName: string;
    email: string;
    password?: string;
    currentPassword?: string;
}

const theme = createTheme();

const Profile: React.FC = () => {
    const { user } = useUserStore();
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [editMode, setEditMode] = useState<boolean>(false);
    const [firstName, setFirstName] = useState<string>('');
    const [lastName, setLastName] = useState<string>('');
    const [email, setEmail] = useState<string>('');
    const [currentPassword, setCurrentPassword] = useState<string>('');
    const [newPassword, setNewPassword] = useState<string>('');
    const [profileImage, setProfileImage] = useState<File | null>(null);
    const [initialImage, setInitialImage] = useState<string>('');

    const fetchProfile = async () => {
        if (!user) return;
        try {
            const response = await axios.get(`${API_HOST}/users/${user.id}`, {
                headers: { 'X-Authorization': user.token }
            });
            setFirstName(response.data.firstName);
            setLastName(response.data.lastName);
            setEmail(response.data.email);
            const imageResponse = await axios.get(`${API_HOST}/users/${user.id}/image`, { responseType: 'blob' });
            const imageURL = URL.createObjectURL(imageResponse.data);
            setInitialImage(imageURL);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to fetch profile information');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProfile();
    }, [user]);

    const handleUpdateProfile = async () => {
        if (!user) return;
        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const updateUser: UserProfile = {
                firstName,
                lastName,
                email
            };

            if (newPassword) {
                updateUser.password = newPassword;
                updateUser.currentPassword = currentPassword;
            }

            await axios.patch(`${API_HOST}/users/${user.id}`, updateUser, {
                headers: { 'X-Authorization': user.token }
            });

            let imageData: ArrayBuffer;
            let contentType: string;

            if (profileImage) {
                imageData = await profileImage.arrayBuffer();
                contentType = profileImage.type;
            } else {
                const initial = firstName.charAt(0).toUpperCase();
                const canvas = generateDefaultAvatar(initial);
                const blob = await convertCanvasToBlob(canvas, 'image/png');
                imageData = await blob.arrayBuffer();
                contentType = 'image/png';
            }

            await axios.put(`${API_HOST}/users/${user.id}/image`, imageData, {
                headers: {
                    'X-Authorization': user.token,
                    'Content-Type': contentType
                }
            });

            setSuccess('Profile updated successfully.');
            setEditMode(false);
            fetchProfile(); // Refetch the profile after a successful update
        } catch (error: unknown) {
            if (axios.isAxiosError(error) && error.response) {
                const statusText = error.response.statusText;
                switch (error.response.status) {
                    case 400:
                        if (statusText.includes("firstName")) {
                            setError("First Name is required.");
                        } else if (statusText.includes("lastName")) {
                            setError("Last Name is required.");
                        } else if (statusText.includes("must match format \"email\"")) {
                            setError("Invalid email format. Please enter a valid email address that contains an '@' and a top-level domain.");
                        } else if (statusText.includes("must NOT have fewer than 1 characters")) {
                            setError("Email is required.");
                        } else if (statusText.includes("password")) {
                            setError("Password must be at least 6 characters.");
                        } else {
                            setError('Invalid information. Please check your input.');
                        }
                        break;
                    case 401:
                        if (statusText.includes("Incorrect currentPassword")) {
                            setError('Incorrect current password.');
                        }
                        break;
                    case 403:
                        setError('Email already in use. Please use a different email.');
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

    if (!user) {
        return <Alert severity="error">You need to be logged in to view your profile.</Alert>;
    }

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <NavigationBar />
            <Container maxWidth="sm" sx={{ marginTop: 8 }}>
                <Paper elevation={3} sx={{ padding: 4 }}>
                    <Typography variant="h4" component="h1" gutterBottom align="center">
                        {editMode ? 'Edit Profile' : 'My Profile'}
                    </Typography>
                    <Box display="flex" flexDirection="column" alignItems="center">
                        <ImageUpload
                            initialImage={initialImage}
                            onImageChange={setProfileImage}
                            onImageRemove={() => setProfileImage(null)}
                            editMode={editMode}
                        />
                    </Box>
                    <Box component="form" noValidate autoComplete="off" mt={3}>
                        <TextField
                            fullWidth
                            margin="normal"
                            label="First Name"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            disabled={!editMode}
                        />
                        <TextField
                            fullWidth
                            margin="normal"
                            label="Last Name"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            disabled={!editMode}
                        />
                        <TextField
                            fullWidth
                            margin="normal"
                            label="Email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={!editMode}
                        />
                        {editMode && (
                            <>
                                <TextField
                                    fullWidth
                                    margin="normal"
                                    label="Current Password"
                                    type="password"
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                />
                                <TextField
                                    fullWidth
                                    margin="normal"
                                    label="New Password"
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                />
                            </>
                        )}
                        <Box mt={2}>
                            <Button variant="contained" color="primary" onClick={editMode ? handleUpdateProfile : () => setEditMode(true)} fullWidth>
                                {editMode ? 'Save Changes' : 'Edit Profile'}
                            </Button>
                            {editMode && (
                                <Button variant="outlined" color="secondary" onClick={() => setEditMode(false)} fullWidth sx={{ mt: 1 }}>
                                    Cancel
                                </Button>
                            )}
                        </Box>
                        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
                        {success && <Alert severity="success" sx={{ mt: 2 }}>{success}</Alert>}
                    </Box>
                </Paper>
            </Container>
        </ThemeProvider>
    );
};

export default Profile;
