import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, Typography, CardMedia, Grid, Box } from '@mui/material';
import dayjs from 'dayjs';
import { API_HOST } from '../../config';

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
}

interface Category {
    categoryId: number;
    name: string;
}

const Petitions: React.FC = () => {
    const [petitions, setPetitions] = useState<Petition[]>([]);
    const [categories, setCategories] = useState<{ [key: number]: string }>({});

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch petitions
                const petitionsResponse = await axios.get(`${API_HOST}/petitions`);
                setPetitions(petitionsResponse.data.petitions);

                // Fetch categories
                const categoriesResponse = await axios.get(`${API_HOST}/petitions/categories`);
                const categoriesMap: { [key: number]: string } = {};
                categoriesResponse.data.forEach((category: Category) => {
                    categoriesMap[category.categoryId] = category.name;
                });
                setCategories(categoriesMap);
            } catch (error) {
                console.error('Failed to fetch data', error);
            }
        };

        fetchData();
    }, []);

    return (
        <Grid container spacing={2}>
            {petitions.map((petition) => (
                <Grid item key={petition.petitionId} xs={12} sm={6} md={4}>
                    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <CardMedia
                            component="img"
                            height="140"
                            image={`${API_HOST}/petitions/${petition.petitionId}/image`}
                            alt="Hero image"
                        />
                        <CardContent sx={{ flexGrow: 1 }}>
                            <Typography gutterBottom variant="h5" component="div" noWrap>
                                {petition.title}
                            </Typography>
                            <Box sx={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                <Typography variant="body2" color="text.secondary">
                                    Category: {categories[petition.categoryId] || 'Loading...'}
                                </Typography>
                                <Typography variant="body2" color="text.secondary" noWrap>
                                    Owner: {petition.ownerFirstName} {petition.ownerLastName}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Creation Date: {dayjs(petition.creationDate).format('DD/MM/YYYY')}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Supporting Cost: ${petition.supportingCost}
                                </Typography>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            ))}
        </Grid>
    );
};

export default Petitions;
