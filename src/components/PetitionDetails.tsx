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
    Button
} from '@mui/material';
import { API_HOST } from '../../config';

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
}

const PetitionDetails: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [petition, setPetition] = useState<Petition | null>(null);
    const [supporters, setSupporters] = useState<Supporter[]>([]);
    const [similarPetitions, setSimilarPetitions] = useState<Petition[]>([]);

    useEffect(() => {
        const fetchPetitionDetails = async () => {
            try {
                const response = await axios.get(`${API_HOST}/petitions/${id}`);
                const petitionData: Petition = response.data;

                // Fetch owner's profile image
                try {
                    const ownerImageResponse = await axios.get(`${API_HOST}/users/${petitionData.ownerId}/image`, { responseType: 'blob' });
                    petitionData.ownerProfileImage = URL.createObjectURL(ownerImageResponse.data);
                } catch (error) {
                    petitionData.ownerProfileImage = '/images/default-avatar.png';
                }

                setPetition(petitionData);

                // Fetch supporters
                const supportersResponse = await axios.get(`${API_HOST}/petitions/${id}/supporters`);
                const supportersData: Supporter[] = supportersResponse.data;

                // Fetch and map supporters' profile images and support tier titles
                const enrichedSupporters = await Promise.all(
                    supportersData.map(async supporter => {
                        // Fetch supporter's profile image
                        try {
                            const supporterImageResponse = await axios.get(`${API_HOST}/users/${supporter.supporterId}/image`, { responseType: 'blob' });
                            supporter.supporterProfileImage = URL.createObjectURL(supporterImageResponse.data);
                        } catch (error) {
                            supporter.supporterProfileImage = '/images/default-avatar.png';
                        }

                        // Map support tier title
                        const tier = petitionData.supportTiers.find(tier => tier.supportTierId === supporter.supportTierId);
                        supporter.supportTierTitle = tier ? tier.title : 'Unknown Tier';

                        return supporter;
                    })
                );

                setSupporters(enrichedSupporters);

                // Fetch similar petitions
                const similarResponse = await axios.get(`${API_HOST}/petitions`, {
                    params: {
                        categoryIds: response.data.categoryId,
                        ownerId: response.data.ownerId,
                        count: 5
                    }
                });
                setSimilarPetitions(similarResponse.data.petitions);
            } catch (error) {
                console.error('Error fetching petition details:', error);
            }
        };

        fetchPetitionDetails();
    }, [id]);

    if (!petition) {
        return <Typography>Loading...</Typography>;
    }

    return (
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
                <Box display="flex" flexDirection="column" gap={2}>
                    {similarPetitions.map(similarPetition => (
                        <Card key={similarPetition.petitionId}>
                            <CardContent>
                                <Typography variant="h6">{similarPetition.title}</Typography>
                                <Button
                                    variant="outlined"
                                    color="primary"
                                    href={`/petitions/${similarPetition.petitionId}`}
                                >
                                    View Petition
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </Box>
            </Box>
        </Container>
    );
};

export default PetitionDetails;
