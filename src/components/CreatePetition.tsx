import React, { useState, useEffect } from 'react';
import { TextField, Button, MenuItem, Typography, Box, Paper, Grid } from '@mui/material';
import axios from 'axios';
import { API_HOST } from '../../config';
import { useUserStore } from '../store';
import NavBar from './NavBar';

interface Category {
    categoryId: number;
    name: string;
}

const CreatePetition: React.FC = () => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [categoryId, setCategoryId] = useState<number | string>('');
    const [supportTiers, setSupportTiers] = useState([{ title: '', description: '', cost: 0 }]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [image, setImage] = useState<File | null>(null);
    const [error, setError] = useState<string>('');

    const { user } = useUserStore();

    useEffect(() => {
        axios.get(`${API_HOST}/petitions/categories`)
            .then(response => setCategories(response.data))
            .catch(() => setError('Error fetching categories'));
    }, []);

    const handleAddTier = () => {
        if (supportTiers.length < 3) {
            setSupportTiers([...supportTiers, { title: '', description: '', cost: 0 }]);
        } else {
            setError('Cannot have more than 3 support tiers');
        }
    };

    const handleRemoveTier = (index: number) => {
        const updatedTiers = supportTiers.filter((_, idx) => idx !== index);
        setSupportTiers(updatedTiers);
    };

    const handleTierChange = (index: number, field: string, value: string | number) => {
        const updatedTiers = supportTiers.map((tier, idx) =>
            idx === index ? { ...tier, [field]: value } : tier
        );
        setSupportTiers(updatedTiers);
    };

    const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0] || null;
        setImage(file);
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!user) {
            setError('User must be logged in');
            return;
        }

        if (!image) {
            setError('Please upload an image');
            return;
        }

        if (title && description && categoryId && supportTiers.length >= 1 && supportTiers.length <= 3 && image) {
            try {
                const petitionData = {
                    title,
                    description,
                    categoryId,
                    supportTiers
                };

                const petitionResponse = await axios.post(`${API_HOST}/petitions`, petitionData, {
                    headers: {
                        'X-Authorization': user.token
                    }
                });

                // Read the file as an ArrayBuffer to send raw binary data
                const imageData = await image.arrayBuffer();
                const imageType = image.type; // Get the image type

                await axios.put(`${API_HOST}/petitions/${petitionResponse.data.petitionId}/image`, imageData, {
                    headers: {
                        'Content-Type': imageType,
                        'X-Authorization': user.token
                    }
                });

                // Clear form and error
                setTitle('');
                setDescription('');
                setCategoryId('');
                setSupportTiers([{ title: '', description: '', cost: 0 }]);
                setImage(null);
                setError('');
            } catch (err) {
                setError('Error creating petition');
            }
        } else {
            setError('Please fill in all required fields correctly');
        }
    };

    return (
        <Box>
            <NavBar />  {/* Add the NavBar component */}
            <Box sx={{ padding: 2 }}>
                <Paper elevation={3} sx={{ padding: 3 }}>
                    <Typography variant="h4" gutterBottom>Create Petition</Typography>
                    {error && <Typography color="error">{error}</Typography>}
                    <form onSubmit={handleSubmit}>
                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <TextField
                                    label="Title"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    fullWidth
                                    required
                                    InputLabelProps={{ shrink: true }}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    label="Description"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    fullWidth
                                    required
                                    multiline
                                    InputLabelProps={{ shrink: true }}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    select
                                    label="Category"
                                    value={categoryId}
                                    onChange={(e) => setCategoryId(e.target.value)}
                                    fullWidth
                                    required
                                    InputLabelProps={{ shrink: true }}
                                >
                                    {categories.map((category: Category) => (
                                        <MenuItem key={category.categoryId} value={category.categoryId}>
                                            {category.name}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            </Grid>
                            {supportTiers.map((tier, index) => (
                                <React.Fragment key={index}>
                                    <Grid item xs={12}>
                                        <TextField
                                            label={`Support Tier ${index + 1} Title`}
                                            value={tier.title}
                                            onChange={(e) => handleTierChange(index, 'title', e.target.value)}
                                            fullWidth
                                            required
                                            InputLabelProps={{ shrink: true }}
                                        />
                                    </Grid>
                                    <Grid item xs={12}>
                                        <TextField
                                            label={`Support Tier ${index + 1} Description`}
                                            value={tier.description}
                                            onChange={(e) => handleTierChange(index, 'description', e.target.value)}
                                            fullWidth
                                            required
                                            multiline
                                            InputLabelProps={{ shrink: true }}
                                        />
                                    </Grid>
                                    <Grid item xs={12}>
                                        <TextField
                                            label={`Support Tier ${index + 1} Cost`}
                                            type="number"
                                            value={tier.cost}
                                            onChange={(e) => handleTierChange(index, 'cost', parseFloat(e.target.value))}
                                            fullWidth
                                            required
                                            InputLabelProps={{ shrink: true }}
                                        />
                                    </Grid>
                                    {supportTiers.length > 1 && (
                                        <Grid item xs={12}>
                                            <Button variant="contained" color="secondary" onClick={() => handleRemoveTier(index)}>
                                                Remove Tier
                                            </Button>
                                        </Grid>
                                    )}
                                </React.Fragment>
                            ))}
                            <Grid item xs={12}>
                                <Button
                                    variant="contained"
                                    onClick={handleAddTier}
                                    disabled={supportTiers.length >= 3}
                                >
                                    Add Support Tier
                                </Button>
                            </Grid>
                            <Grid item xs={12}>
                                <Button
                                    variant="contained"
                                    component="label"
                                >
                                    Upload Image
                                    <input
                                        type="file"
                                        hidden
                                        accept="image/png, image/jpeg, image/gif"
                                        onChange={handleImageChange}
                                    />
                                </Button>
                                {image && <Typography>{image.name}</Typography>}
                            </Grid>
                            <Grid item xs={12}>
                                <Button variant="contained" color="primary" type="submit">Create Petition</Button>
                            </Grid>
                        </Grid>
                    </form>
                </Paper>
            </Box>
        </Box>
    );
};

export default CreatePetition;
