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
    Divider
} from '@mui/material';
import { API_HOST } from '../../config';
import NavBar from './NavBar';
import { useUserStore } from '../store';
import dayjs from 'dayjs';

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

const MyPetitions: React.FC = () => {
    const [petitions, setPetitions] = useState<Petition[]>([]);
    const [loading, setLoading] = useState(true);
    const { user } = useUserStore();
    const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

    useEffect(() => {
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

                setPetitions(combinedPetitions);
            } catch (error) {
                console.error('Failed to fetch petitions:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchPetitions();
    }, [user]);

    const handleConfirmDelete = (petitionId: number) => {
        setConfirmDeleteId(petitionId);
    };

    const handleCancelDelete = () => {
        setConfirmDeleteId(null);
    };

    const handleDeletePetition = async (petitionId: number) => {
        try {
            await axios.delete(`${API_HOST}/petitions/${petitionId}`, {
                headers: { 'X-Authorization': user?.token }
            });
            setPetitions(petitions.filter(p => p.petitionId !== petitionId));
            handleCancelDelete();
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
        <>
            <NavBar />
            <Container maxWidth="lg" sx={{ marginTop: 8 }}>
                <Typography variant="h4" gutterBottom align="center">
                    My Petitions
                </Typography>
                <Divider sx={{ marginBottom: 4 }} />
                <Box sx={{ marginTop: 3 }}>
                    <Grid container spacing={4}>
                        {petitions.length > 0 ? (
                            petitions.map((petition) => (
                                <Grid item key={petition.petitionId} xs={12} sm={6} md={4}>
                                    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
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
                                            <Typography gutterBottom variant="h5" component="div" noWrap>
                                                {petition.title}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                Creation Date: {dayjs(petition.creationDate).format('DD/MM/YYYY')}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                Supporting Cost: ${petition.supportingCost}
                                            </Typography>
                                        </CardContent>
                                        <Button variant="outlined" color="primary" href={`/petition/${petition.petitionId}`}>
                                            View Details
                                        </Button>
                                        {user && user.id === petition.ownerId && (
                                            <>
                                                <Button variant="contained" color="secondary" href={`/edit/${petition.petitionId}`}>
                                                    Edit
                                                </Button>
                                                {confirmDeleteId === petition.petitionId ? (
                                                    <Button
                                                        variant="contained"
                                                        color="warning"
                                                        onClick={() => handleDeletePetition(petition.petitionId)}
                                                        onBlur={handleCancelDelete}
                                                        sx={{ ml: 1 }}
                                                    >
                                                        Confirm Delete
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        variant="contained"
                                                        color="error"
                                                        onClick={() => handleConfirmDelete(petition.petitionId)}
                                                        sx={{ ml: 1 }}
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
                </Box>
            </Container>
        </>
    );
};

export default MyPetitions;
