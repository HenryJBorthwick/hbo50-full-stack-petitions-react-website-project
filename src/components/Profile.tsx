import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, Box, CircularProgress, Alert, TextField, Button, Typography, Paper, IconButton, InputAdornment, CssBaseline, createTheme, ThemeProvider } from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
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
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif'];

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
    const [imageRemoved, setImageRemoved] = useState<boolean>(false);
    const [isDefaultImage, setIsDefaultImage] = useState<boolean>(true);
    const [showCurrentPassword, setShowCurrentPassword] = useState<boolean>(false);
    const [showNewPassword, setShowNewPassword] = useState<boolean>(false);
    const [uploadedImagePreview, setUploadedImagePreview] = useState<string | null>(null); // State to store the uploaded image preview

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
            const initial = response.data.firstName.charAt(0).toUpperCase();
            const defaultCanvas = generateDefaultAvatar(initial);
            const defaultBlob = await convertCanvasToBlob(defaultCanvas, 'image/png');
            setIsDefaultImage(await blobsAreEqual(imageResponse.data, defaultBlob));
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to fetch profile information');
        } finally {
            setLoading(false);
        }
    };

    const blobsAreEqual = async (blob1: Blob, blob2: Blob): Promise<boolean> => {
        const arrayBuffer1 = await blob1.arrayBuffer();
        const arrayBuffer2 = await blob2.arrayBuffer();
        return arrayBuffer1.byteLength === arrayBuffer2.byteLength &&
            new Uint8Array(arrayBuffer1).every((value, index) => value === new Uint8Array(arrayBuffer2)[index]);
    };

    useEffect(() => {
        fetchProfile();
    }, [user]);

    const validateFields = () => {
        if (profileImage) {
            if (profileImage.size > MAX_IMAGE_SIZE) {
                return `Image size should not exceed ${MAX_IMAGE_SIZE / (1024 * 1024)} MB.`;
            }

            if (!ALLOWED_IMAGE_TYPES.includes(profileImage.type)) {
                return `Invalid image type. Allowed types are: ${ALLOWED_IMAGE_TYPES.join(', ')}.`;
            }
        }

        return null;
    };

    const handleUpdateProfile = async () => {
        if (!user) return;
        setLoading(true);
        setError(null);
        setSuccess(null);

        const validationError = validateFields();
        if (validationError) {
            setError(validationError);
            setLoading(false);
            return;
        }

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

            if (profileImage || imageRemoved) {
                let imageData: ArrayBuffer;
                let contentType: string;

                if (imageRemoved) {
                    const initial = firstName.charAt(0).toUpperCase();
                    const canvas = generateDefaultAvatar(initial);
                    const blob = await convertCanvasToBlob(canvas, 'image/png');
                    imageData = await blob.arrayBuffer();
                    contentType = 'image/png';
                } else {
                    imageData = await profileImage!.arrayBuffer();
                    contentType = profileImage!.type;
                }

                await axios.put(`${API_HOST}/users/${user.id}/image`, imageData, {
                    headers: {
                        'X-Authorization': user.token,
                        'Content-Type': contentType
                    }
                });
            }

            setSuccess('Profile updated successfully.');
            setEditMode(false);
            setUploadedImagePreview(null); // Reset the uploaded image preview after successful save
            fetchProfile(); // Refetch the profile after a successful update
        } catch (error: unknown) {
            if (axios.isAxiosError(error) && error.response) {
                const statusText = error.response.statusText;
                switch (error.response.status) {
                    case 400:
                        if (statusText.includes("data/firstName must NOT have fewer than 1 characters")) {
                            setError("First Name is required.");
                        } else if (statusText.includes("data/firstName must NOT have more than 64 characters")) {
                            setError("First Name must not exceed 64 characters.");
                        } else if (statusText.includes("data/lastName must NOT have more than 64 characters")) {
                            setError("Last Name must not exceed 64 characters.");
                        } else if (statusText.includes("data/lastName must NOT have fewer than 1 characters")) {
                            setError("Last Name is required.");
                        } else if (statusText.includes("data/email must NOT have more than 256 characters")) {
                            setError("Email must not exceed 256 characters.");
                        } else if (statusText.includes("email")) {
                            setError("Invalid email format. Please enter a valid email address that contains an '@' and a top-level domain.");
                        } else if (statusText.includes("data/password must NOT have more than 64 characters")) {
                            setError("Password must not exceed 64 characters.");
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
                    case 413:
                        setError('The uploaded image is too large. Please upload an image smaller than 5MB.');
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

    const handleImageChange = (file: File | null) => {
        setProfileImage(file);
        setImageRemoved(false);
        if (file) {
            setIsDefaultImage(false);
            setUploadedImagePreview(URL.createObjectURL(file)); // Set the uploaded image preview
        }
    };

    const handleImageRemove = async () => {
        const initial = firstName.charAt(0).toUpperCase();
        const canvas = generateDefaultAvatar(initial);
        const blob = await convertCanvasToBlob(canvas, 'image/png');
        setInitialImage(URL.createObjectURL(blob));
        setProfileImage(null);
        setImageRemoved(true);
        setIsDefaultImage(true);
        setUploadedImagePreview(null); // Clear the uploaded image preview when image is removed
    };

    const handleEditMode = () => {
        setEditMode(true);
        setSuccess(null); // Reset the success message when entering edit mode
    };

    const handleCancelEdit = async () => {
        setEditMode(false);
        setSuccess(null);
        setUploadedImagePreview(null); // Clear the uploaded image preview when cancelling edit
        await fetchProfile(); // Reset the profile changes when canceling
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
                            initialImage={uploadedImagePreview || initialImage}
                            onImageChange={handleImageChange}
                            onImageRemove={handleImageRemove}
                            editMode={editMode}
                            isDefaultImage={isDefaultImage}
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
                                    type={showCurrentPassword ? 'text' : 'password'}
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    InputProps={{
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <IconButton
                                                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                                    onMouseDown={(e) => e.preventDefault()}
                                                >
                                                    {showCurrentPassword ? <Visibility /> : <VisibilityOff />}
                                                </IconButton>
                                            </InputAdornment>
                                        )
                                    }}
                                />
                                <TextField
                                    fullWidth
                                    margin="normal"
                                    label="New Password"
                                    type={showNewPassword ? 'text' : 'password'}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    InputProps={{
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <IconButton
                                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                                    onMouseDown={(e) => e.preventDefault()}
                                                >
                                                    {showNewPassword ? <Visibility /> : <VisibilityOff />}
                                                </IconButton>
                                            </InputAdornment>
                                        )
                                    }}
                                />
                            </>
                        )}
                        <Box mt={2}>
                            <Button variant="contained" color="primary" onClick={editMode ? handleUpdateProfile : handleEditMode} fullWidth>
                                {editMode ? 'Save Changes' : 'Edit Profile'}
                            </Button>
                            {editMode && (
                                <Button variant="outlined" color="secondary" onClick={handleCancelEdit} fullWidth sx={{ mt: 1 }}>
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
