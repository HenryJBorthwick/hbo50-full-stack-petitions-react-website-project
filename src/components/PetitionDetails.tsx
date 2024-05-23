import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Container,
    Box,
    Typography,
    Avatar,
    Card,
    CardContent,
    CardMedia,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    Divider,
    Button,
    Grid,
    TextField,
    Snackbar,
    Alert,
    CssBaseline,
    createTheme,
    ThemeProvider,
    Paper
} from '@mui/material';
import { API_HOST } from '../../config';
import NavBar from './NavBar';
import { useUserStore } from '../store';
import { generateDefaultAvatar, convertCanvasToBlob } from '../utils/avatarUtils';

interface SupportTier {
    supportTierId: number;
    title: string;
    description: string;
    cost: number;
}

interface Supporter {
    supportId: number;
    supportTierId: number;
    message?: string;
    supporterId: number;
    supporterFirstName: string;
    supporterLastName: string;
    timestamp: string;
    supporterProfileImage?: string;
    supportTierTitle?: string;
}

interface Petition {
    petitionId: number;
    title: string;
    creationDate: string;
    description: string;
    ownerId: number;
    ownerFirstName: string;
    ownerLastName: string;
    ownerProfileImage?: string;
    numberOfSupporters: number;
    moneyRaised: number;
    supportTiers: SupportTier[];
    categoryId: number;
    categoryName?: string;
    supportingCost?: number;
}

interface Category {
    categoryId: number;
    name: string;
}

const theme = createTheme();

const PetitionDetails: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [petition, setPetition] = useState<Petition | null>(null);
    const [supporters, setSupporters] = useState<Supporter[]>([]);
    const [similarPetitions, setSimilarPetitions] = useState<Petition[]>([]);
    const [supportMessage, setSupportMessage] = useState('');
    const [selectedTier, setSelectedTier] = useState<SupportTier | null>(null);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');
    const { user } = useUserStore();

    useEffect(() => {
        fetchPetitionDetails();
    }, [id]);

    const fetchPetitionDetails = async () => {
        try {
            const response = await axios.get(`${API_HOST}/petitions/${id}`);
            const petitionData: Petition = response.data;

            try {
                const ownerImageResponse = await axios.get(`${API_HOST}/users/${petitionData.ownerId}/image`, { responseType: 'blob' });
                petitionData.ownerProfileImage = URL.createObjectURL(ownerImageResponse.data);
            } catch (error) {
                const initial = petitionData.ownerFirstName.charAt(0).toUpperCase();
                const canvas = generateDefaultAvatar(initial);
                const blob = await convertCanvasToBlob(canvas, 'image/png');
                petitionData.ownerProfileImage = URL.createObjectURL(blob);
            }

            setPetition(petitionData);
            fetchSupporters(petitionData);
        } catch (error) {
            console.error('Error fetching petition details:', error);
        }
    };

    const fetchSupporters = async (petitionData: Petition) => {
        try {
            const supportersResponse = await axios.get(`${API_HOST}/petitions/${id}/supporters`);
            const supportersData: Supporter[] = supportersResponse.data;

            const enrichedSupporters = await Promise.all(
                supportersData.map(async supporter => {
                    try {
                        const supporterImageResponse = await axios.get(`${API_HOST}/users/${supporter.supporterId}/image`, { responseType: 'blob' });
                        supporter.supporterProfileImage = URL.createObjectURL(supporterImageResponse.data);
                    } catch (error) {
                        const initial = supporter.supporterFirstName.charAt(0).toUpperCase();
                        const canvas = generateDefaultAvatar(initial);
                        const blob = await convertCanvasToBlob(canvas, 'image/png');
                        supporter.supporterProfileImage = URL.createObjectURL(blob);
                    }

                    const tier = petitionData.supportTiers.find(tier => tier.supportTierId === supporter.supportTierId);
                    supporter.supportTierTitle = tier ? tier.title : 'Unknown Tier';

                    return supporter;
                })
            );

            setSupporters(enrichedSupporters);

            const categoriesResponse = await axios.get(`${API_HOST}/petitions/categories`);
            const categoriesData: Category[] = categoriesResponse.data;

            const categoryResponse = await axios.get(`${API_HOST}/petitions`, {
                params: { categoryIds: petitionData.categoryId }
            });
            const similarByCategory = categoryResponse.data.petitions;

            const ownerResponse = await axios.get(`${API_HOST}/petitions`, {
                params: { ownerId: petitionData.ownerId }
            });
            const similarByOwner = ownerResponse.data.petitions;

            let combinedSimilarPetitions = [
                ...similarByCategory,
                ...similarByOwner
            ].filter(
                (similarPetition, index, self) =>
                    similarPetition.petitionId !== petitionData.petitionId &&
                    index === self.findIndex(p => p.petitionId === similarPetition.petitionId)
            );

            combinedSimilarPetitions = combinedSimilarPetitions.map(similarPetition => {
                const category = categoriesData.find(cat => cat.categoryId === similarPetition.categoryId);
                similarPetition.categoryName = category ? category.name : 'Unknown Category';
                return similarPetition;
            });

            setSimilarPetitions(combinedSimilarPetitions);
        } catch (error) {
            console.error('Error fetching supporters:', error);
        }
    };

    const handleSupportClick = (tier: SupportTier) => {
        if (!user) {
            navigate('/register', { state: { fromProtectedRoute: true, attemptedPath: window.location.pathname } });
            return;
        }
        if (user.id === petition?.ownerId) {
            setSnackbarMessage('You cannot support your own petition.');
            setSnackbarSeverity('error');
            return;
        }
        setSelectedTier(tier);
    };

    const handleSupportSubmit = async () => {
        if (!selectedTier) return;

        try {
            const supportData: { supportTierId: number; message?: string } = {
                supportTierId: selectedTier.supportTierId
            };
            if (supportMessage.trim()) {
                supportData.message = supportMessage;
            }
            await axios.post(`${API_HOST}/petitions/${id}/supporters`, supportData, {
                headers: { 'X-Authorization': user?.token }
            });

            setSnackbarMessage('Successfully supported the petition.');
            setSnackbarSeverity('success');
            setSupportMessage('');
            setSelectedTier(null);

            fetchSupporters(petition!); // Re-fetch supporters
        } catch (error) {
            console.error('Error supporting petition:', error);
            setSnackbarMessage('Failed to support the petition.');
            setSnackbarSeverity('error');
        }
    };

    const hasUserSupportedTier = (tierId: number) => {
        return supporters.some(supporter => supporter.supportTierId === tierId && supporter.supporterId === user?.id);
    };

    if (!petition) {
        return <Typography>Loading...</Typography>;
    }

    return (
        <ThemeProvider theme={theme}>
            <NavBar />
            <CssBaseline />
            <Container maxWidth="md" sx={{ mt: 8 }}>
                <Paper elevation={3} sx={{ p: 4 }}>
                    <Box textAlign="center" sx={{ my: 4 }}>
                        <Typography variant="h4" component="h1" gutterBottom>
                            {petition.title}
                        </Typography>
                        <CardMedia
                            component="img"
                            height="300"
                            image={`${API_HOST}/petitions/${petition.petitionId}/image`}
                            alt="Petition hero image"
                        />
                        <Box display="flex" justifyContent="center" alignItems="center" my={2}>
                            <Avatar
                                src={petition.ownerProfileImage}
                                alt={`${petition.ownerFirstName} ${petition.ownerLastName}`}
                                sx={{ mr: 2 }}
                            />
                            <Typography variant="h6">
                                {petition.ownerFirstName} {petition.ownerLastName}
                            </Typography>
                        </Box>
                        <Typography variant="body2" color="textSecondary" gutterBottom>
                            Created on {new Date(petition.creationDate).toLocaleDateString()}
                        </Typography>
                        <Typography variant="body1" paragraph>
                            {petition.description}
                        </Typography>
                        <Grid container spacing={3} justifyContent="center" sx={{ mt: 2 }}>
                            <Grid item>
                                <Card>
                                    <CardContent>
                                        <Typography variant="h6" component="div">
                                            Supporters
                                        </Typography>
                                        <Typography variant="body2" color="textSecondary">
                                            Number of Supporters
                                        </Typography>
                                        <Typography variant="h6" color="primary">
                                            {petition.numberOfSupporters}
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                            <Grid item>
                                <Card>
                                    <CardContent>
                                        <Typography variant="h6" component="div">
                                            Money Raised
                                        </Typography>
                                        <Typography variant="body2" color="textSecondary">
                                            Total Money Raised
                                        </Typography>
                                        <Typography variant="h6" color="primary">
                                            ${petition.moneyRaised}
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                        </Grid>

                        <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
                            Support Tiers
                        </Typography>
                        <Grid container spacing={2} direction="column" alignItems="center">
                            {petition.supportTiers.map(tier => (
                                <Grid item xs={12} key={tier.supportTierId} sx={{ width: '100%' }}>
                                    <Card sx={{ height: '100%' }}>
                                        <CardContent>
                                            <Typography variant="body1">{tier.title}</Typography>
                                            <Typography variant="body2" color="textSecondary">
                                                {tier.description} - ${tier.cost}
                                            </Typography>
                                            {selectedTier && selectedTier.supportTierId === tier.supportTierId ? (
                                                <Box>
                                                    <TextField
                                                        fullWidth
                                                        variant="outlined"
                                                        placeholder="Enter your support message"
                                                        value={supportMessage}
                                                        onChange={(e) => setSupportMessage(e.target.value)}
                                                        sx={{ mt: 1 }}
                                                    />
                                                    <Button
                                                        variant="contained"
                                                        color="primary"
                                                        onClick={handleSupportSubmit}
                                                        sx={{ mt: 1 }}
                                                    >
                                                        Confirm Support
                                                    </Button>
                                                </Box>
                                            ) : (
                                                <Button
                                                    variant="outlined"
                                                    color="primary"
                                                    onClick={() => handleSupportClick(tier)}
                                                    disabled={user?.id === petition.ownerId || hasUserSupportedTier(tier.supportTierId)}
                                                    sx={{ mt: 1 }}
                                                >
                                                    {hasUserSupportedTier(tier.supportTierId) ? 'Supported' : 'Support'}
                                                </Button>
                                            )}
                                        </CardContent>
                                    </Card>
                                </Grid>
                            ))}
                        </Grid>

                        <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
                            Supporters
                        </Typography>
                        <List>
                            {supporters.map(supporter => (
                                <React.Fragment key={supporter.supportId}>
                                    <ListItem alignItems="flex-start">
                                        <ListItemAvatar>
                                            <Avatar
                                                src={supporter.supporterProfileImage}
                                                alt={`${supporter.supporterFirstName} ${supporter.supporterLastName}`}
                                            />
                                        </ListItemAvatar>
                                        <ListItemText
                                            primary={`${supporter.supporterFirstName} ${supporter.supporterLastName} - ${supporter.supportTierTitle}`}
                                            secondary={
                                                <>
                                                    <Typography
                                                        component="span"
                                                        variant="body2"
                                                        color="textPrimary"
                                                    >
                                                        {supporter.message}
                                                    </Typography>
                                                    <Typography
                                                        component="span"
                                                        variant="body2"
                                                        color="textSecondary"
                                                    >
                                                        {` - ${new Date(supporter.timestamp).toLocaleString()}`}
                                                    </Typography>
                                                </>
                                            }
                                        />
                                    </ListItem>
                                    <Divider variant="inset" component="li" />
                                </React.Fragment>
                            ))}
                        </List>

                        <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
                            Similar Petitions
                        </Typography>
                        <Grid container spacing={2}>
                            {similarPetitions.map(similarPetition => (
                                <Grid item xs={12} sm={6} md={4} key={similarPetition.petitionId}>
                                    <Card>
                                        <CardMedia
                                            component="img"
                                            height="140"
                                            image={`${API_HOST}/petitions/${similarPetition.petitionId}/image`}
                                            alt="Similar petition hero image"
                                        />
                                        <CardContent>
                                            <Typography variant="h6" component="div">
                                                {similarPetition.title}
                                            </Typography>
                                            <Typography variant="body2" color="textSecondary">
                                                Created on {new Date(similarPetition.creationDate).toLocaleDateString()}
                                            </Typography>
                                            <Box display="flex" alignItems="center" mt={2}>
                                                <Avatar
                                                    src={`${API_HOST}/users/${similarPetition.ownerId}/image`}
                                                    alt={`${similarPetition.ownerFirstName} ${similarPetition.ownerLastName}`}
                                                    sx={{ mr: 2 }}
                                                />
                                                <Typography variant="body2">
                                                    {similarPetition.ownerFirstName} {similarPetition.ownerLastName}
                                                </Typography>
                                            </Box>
                                            <Typography variant="body2" color="textSecondary" gutterBottom>
                                                Category: {similarPetition.categoryName}
                                            </Typography>
                                            <Typography variant="body2" color="textSecondary" gutterBottom>
                                                Supporting Cost: ${similarPetition.supportingCost}
                                            </Typography>
                                            <Button
                                                variant="outlined"
                                                color="primary"
                                                href={`/petition/${similarPetition.petitionId}`}
                                            >
                                                View Petition
                                            </Button>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            ))}
                        </Grid>
                    </Box>
                </Paper>
            </Container>

            <Snackbar
                open={!!snackbarMessage}
                autoHideDuration={6000}
                onClose={() => setSnackbarMessage('')}
            >
                <Alert onClose={() => setSnackbarMessage('')} severity={snackbarSeverity}>
                    {snackbarMessage}
                </Alert>
            </Snackbar>
        </ThemeProvider>
    );
};

export default PetitionDetails;
