import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Card,
    CardContent,
    Typography,
    CardMedia,
    Grid,
    Box,
    Avatar,
    Container,
    Button,
    CircularProgress,
    Paper,
    CssBaseline,
    createTheme,
    ThemeProvider,
    Stack
} from '@mui/material';
import { API_HOST } from '../../config';
import NavBar from './NavBar';
import { useUserStore } from '../store';
import dayjs from 'dayjs';
import { generateDefaultAvatar, convertCanvasToBlob } from '../utils/avatarUtils';

interface Petition {
    petitionId: number;
    title: string;
    creationDate: string;
    categoryId: number;
    ownerId: number;
    ownerFirstName: string;
    ownerLastName: string;
    numberOfSupporters: number;
    supportingCost: number;
    description?: string;
    ownerProfileImage?: string;
}

interface Supporter {
    supporterId: number;
}

const theme = createTheme();

const MyPetitions: React.FC = () => {
    const [petitions, setPetitions] = useState<Petition[]>([]);
    const [loading, setLoading] = useState(true);
    const { user } = useUserStore();
    const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

    const fetchOwnerProfileImage = async (petition: Petition) => {
        try {
            const imageResponse = await axios.get(`${API_HOST}/users/${petition.ownerId}/image`, { responseType: 'blob' });
            petition.ownerProfileImage = URL.createObjectURL(imageResponse.data);
        } catch (error) {
            const initial = petition.ownerFirstName.charAt(0).toUpperCase();
            const canvas = generateDefaultAvatar(initial);
            const blob = await convertCanvasToBlob(canvas, 'image/png');
            petition.ownerProfileImage = URL.createObjectURL(blob);
        }
        return petition;
    };

    const fetchPetitions = async () => {
        if (!user) return;

        try {
            const petitionsResponse = await axios.get(`${API_HOST}/petitions`);
            const allPetitions = petitionsResponse.data.petitions;

            const ownedPetitions = allPetitions.filter((petition: Petition) => petition.ownerId === user.id);

            const supporterPromises = allPetitions.map(async (petition: Petition) => {
                const supportersResponse = await axios.get(`${API_HOST}/petitions/${petition.petitionId}/supporters`);
                const supporters = supportersResponse.data;
                return supporters.some((supporter: Supporter) => supporter.supporterId === user.id) ? petition : null;
            });
            const supportedPetitions = (await Promise.all(supporterPromises)).filter(Boolean) as Petition[];

            const combinedPetitions = [...ownedPetitions, ...supportedPetitions];

            const petitionsWithProfileImages = await Promise.all(combinedPetitions.map(fetchOwnerProfileImage));

            setPetitions(petitionsWithProfileImages);
        } catch (error) {
            console.error('Failed to fetch petitions:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPetitions();
    }, [user]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (confirmDeleteId !== null) {
                const target = event.target as HTMLElement;
                if (!target.closest('.confirm-delete')) {
                    setConfirmDeleteId(null);
                }
            }
        };

        document.addEventListener('click', handleClickOutside);
        return () => {
            document.removeEventListener('click', handleClickOutside);
        };
    }, [confirmDeleteId]);

    const handleConfirmDelete = (petitionId: number) => {
        setConfirmDeleteId(petitionId);
    };

    const handleDeletePetition = async (petitionId: number) => {
        try {
            await axios.delete(`${API_HOST}/petitions/${petitionId}`, {
                headers: { 'X-Authorization': user?.token }
            });
            setConfirmDeleteId(null);
            fetchPetitions();
        } catch (error) {
            console.error('Failed to delete petition:', error);
        }
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <ThemeProvider theme={theme}>
            <NavBar />
            <CssBaseline />
            <Container component="main" maxWidth="lg" sx={{ mt: 8, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
                <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
                    <Stack spacing={3}>
                        <Grid container spacing={3} sx={{ justifyContent: 'center', maxWidth: 1200, mx: 'auto' }}>
                            {petitions.length > 0 ? (
                                petitions.map((petition) => (
                                    <Grid item key={petition.petitionId} xs={12} sm={6} md={4}>
                                        <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', borderRadius: 2, boxShadow: 3 }}>
                                            <CardMedia
                                                component="img"
                                                height="140"
                                                image={`${API_HOST}/petitions/${petition.petitionId}/image`}
                                                alt="Petition image"
                                            />
                                            <CardContent sx={{ flexGrow: 1 }}>
                                                <Box display="flex" alignItems="center" mb={2}>
                                                    <Avatar
                                                        src={petition.ownerProfileImage}
                                                        alt={`${petition.ownerFirstName} ${petition.ownerLastName}`}
                                                        sx={{ mr: 2 }}
                                                    />
                                                    <Typography variant="body1" noWrap>
                                                        {petition.ownerFirstName} {petition.ownerLastName}
                                                    </Typography>
                                                </Box>
                                                <Typography gutterBottom variant="h6" component="div" noWrap>
                                                    {petition.title}
                                                </Typography>
                                                <Box sx={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                    <Typography variant="body2" color="text.secondary">
                                                        Creation Date: {dayjs(petition.creationDate).format('DD/MM/YYYY')}
                                                    </Typography>
                                                    <Typography variant="body2" color="text.secondary">
                                                        Supporting Cost: ${petition.supportingCost}
                                                    </Typography>
                                                </Box>
                                            </CardContent>
                                            <Button variant="outlined" color="primary" href={`/petition/${petition.petitionId}`} sx={{ m: 1 }}>
                                                View Details
                                            </Button>
                                            {user && user.id === petition.ownerId && (
                                                <>
                                                    <Button variant="contained" color="secondary" href={`/edit/${petition.petitionId}`} sx={{ m: 1 }}>
                                                        Edit
                                                    </Button>
                                                    {confirmDeleteId === petition.petitionId ? (
                                                        <Button
                                                            className="confirm-delete"
                                                            variant="contained"
                                                            color="warning"
                                                            onClick={() => handleDeletePetition(petition.petitionId)}
                                                            sx={{ m: 1 }}
                                                        >
                                                            Confirm Delete
                                                        </Button>
                                                    ) : (
                                                        <Button
                                                            variant="contained"
                                                            color="error"
                                                            onClick={() => handleConfirmDelete(petition.petitionId)}
                                                            sx={{ m: 1 }}
                                                        >
                                                            Delete
                                                        </Button>
                                                    )}
                                                </>
                                            )}
                                        </Card>
                                    </Grid>
                                ))
                            ) : (
                                <Grid item xs={12}>
                                    <Typography variant="h6" color="text.secondary" textAlign="center">
                                        No petitions found.
                                    </Typography>
                                </Grid>
                            )}
                        </Grid>
                    </Stack>
                </Paper>
            </Container>
        </ThemeProvider>
    );
};

export default MyPetitions;
