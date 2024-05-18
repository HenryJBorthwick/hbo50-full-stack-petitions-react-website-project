import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
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
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Snackbar,
    Alert
} from '@mui/material';
import { API_HOST } from '../../config';
import NavBar from './NavBar';
import { useUserStore } from '../store';

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

const PetitionDetails: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [petition, setPetition] = useState<Petition | null>(null);
    const [supporters, setSupporters] = useState<Supporter[]>([]);
    const [similarPetitions, setSimilarPetitions] = useState<Petition[]>([]);
    const [openSupportDialog, setOpenSupportDialog] = useState(false);
    const [selectedTier, setSelectedTier] = useState<SupportTier | null>(null);
    const [supportMessage, setSupportMessage] = useState('');
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
                petitionData.ownerProfileImage = '/images/default-avatar.png';
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
                        supporter.supporterProfileImage = '/images/default-avatar.png';
                    }

                    const tier = petitionData.supportTiers.find(tier => tier.supportTierId === supporter.supportTierId);
                    supporter.supportTierTitle = tier ? tier.title : 'Unknown Tier';

                    return supporter;
                })
            );

            setSupporters(enrichedSupporters);

            // Fetch all categories
            const categoriesResponse = await axios.get(`${API_HOST}/petitions/categories`);
            const categoriesData: Category[] = categoriesResponse.data;

            // Fetch petitions with the same categoryId
            const categoryResponse = await axios.get(`${API_HOST}/petitions`, {
                params: { categoryIds: petitionData.categoryId }
            });
            const similarByCategory = categoryResponse.data.petitions;

            // Fetch petitions with the same ownerId
            const ownerResponse = await axios.get(`${API_HOST}/petitions`, {
                params: { ownerId: petitionData.ownerId }
            });
            const similarByOwner = ownerResponse.data.petitions;

            // Combine and filter out the current petition
            let combinedSimilarPetitions = [
                ...similarByCategory,
                ...similarByOwner
            ].filter(
                (similarPetition, index, self) =>
                    similarPetition.petitionId !== petitionData.petitionId &&
                    index === self.findIndex(p => p.petitionId === similarPetition.petitionId)
            );

            // Map category names for similar petitions
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
            setSnackbarMessage('You need to log in to support a petition.');
            setSnackbarSeverity('error');
            setOpenSupportDialog(false);
            return;
        }
        if (user.id === petition?.ownerId) {
            setSnackbarMessage('You cannot support your own petition.');
            setSnackbarSeverity('error');
            setOpenSupportDialog(false);
            return;
        }
        setSelectedTier(tier);
        setOpenSupportDialog(true);
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
            setOpenSupportDialog(false);

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
        <>
            <NavBar />
            <Container maxWidth="md">
                <Box sx={{ my: 4 }}>
                    <Typography variant="h4" component="h1" gutterBottom>
                        {petition.title}
                    </Typography>
                    <CardMedia
                        component="img"
                        height="300"
                        image={`${API_HOST}/petitions/${petition.petitionId}/image`}
                        alt="Petition hero image"
                    />
                    <Box display="flex" alignItems="center" my={2}>
                        <Avatar
                            src={petition.ownerProfileImage || '/images/default-avatar.png'}
                            alt={`${petition.ownerFirstName} ${petition.ownerLastName}`}
                        />
                        <Typography variant="body1" ml={2}>
                            {petition.ownerFirstName} {petition.ownerLastName}
                        </Typography>
                    </Box>
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                        Created on {new Date(petition.creationDate).toLocaleDateString()}
                    </Typography>
                    <Typography variant="body1" paragraph>
                        {petition.description}
                    </Typography>
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                        Number of Supporters: {petition.numberOfSupporters}
                    </Typography>
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                        Total Money Raised: ${petition.moneyRaised}
                    </Typography>

                    <Typography variant="h6" gutterBottom>
                        Support Tiers
                    </Typography>
                    {petition.supportTiers.map(tier => (
                        <Box key={tier.supportTierId} mb={2}>
                            <Typography variant="body1">{tier.title}</Typography>
                            <Typography variant="body2" color="textSecondary">
                                {tier.description} - ${tier.cost}
                            </Typography>
                            <Button
                                variant="outlined"
                                color="primary"
                                onClick={() => handleSupportClick(tier)}
                                disabled={!user || user.id === petition.ownerId || hasUserSupportedTier(tier.supportTierId)}
                            >
                                Support
                            </Button>
                        </Box>
                    ))}

                    <Typography variant="h6" gutterBottom>
                        Supporters
                    </Typography>
                    <List>
                        {supporters.map(supporter => (
                            <React.Fragment key={supporter.supportId}>
                                <ListItem alignItems="flex-start">
                                    <ListItemAvatar>
                                        <Avatar
                                            src={supporter.supporterProfileImage || '/images/default-avatar.png'}
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

                    <Typography variant="h6" gutterBottom>
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
                                            />
                                            <Typography variant="body2" ml={2}>
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
            </Container>

            <Dialog open={openSupportDialog} onClose={() => setOpenSupportDialog(false)}>
                <DialogTitle>Support {selectedTier?.title}</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        You can optionally leave a message with your support.
                    </DialogContentText>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Support Message"
                        type="text"
                        fullWidth
                        value={supportMessage}
                        onChange={(e) => setSupportMessage(e.target.value)}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenSupportDialog(false)} color="primary">
                        Cancel
                    </Button>
                    <Button onClick={handleSupportSubmit} color="primary">
                        Support
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar
                open={!!snackbarMessage}
                autoHideDuration={6000}
                onClose={() => setSnackbarMessage('')}
            >
                <Alert onClose={() => setSnackbarMessage('')} severity={snackbarSeverity}>
                    {snackbarMessage}
                </Alert>
            </Snackbar>
        </>
    );
};

export default PetitionDetails;
