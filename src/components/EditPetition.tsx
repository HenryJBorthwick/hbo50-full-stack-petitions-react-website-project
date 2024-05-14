import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { TextField, Button, Typography, MenuItem, Select, FormControl, InputLabel, Box, Paper } from '@mui/material';
import axios from 'axios';
import { API_HOST } from '../../config';
import { useUserStore } from '../store';

const EditPetition: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useUserStore();
    const [petition, setPetition] = useState<any>(null);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [categoryId, setCategoryId] = useState<number | string>('');
    const [categories, setCategories] = useState<any[]>([]);
    const [supportTiers, setSupportTiers] = useState<any[]>([]);
    const [error, setError] = useState<string>('');

    useEffect(() => {
        if (id) {
            const fetchPetition = async () => {
                try {
                    const response = await axios.get(`${API_HOST}/petitions/${id}`);
                    setPetition(response.data);
                    setTitle(response.data.title);
                    setDescription(response.data.description);
                    setCategoryId(response.data.categoryId);
                    setSupportTiers(response.data.supportTiers || []);
                } catch (err) {
                    console.error('Error fetching petition details:', err);
                    setError('Failed to load petition details');
                }
            };

            fetchPetition();
            axios.get(`${API_HOST}/petitions/categories`)
                .then(response => {
                    setCategories(response.data);
                })
                .catch(() => {
                    setError('Error fetching categories');
                });
        } else {
            setError('Petition ID is not specified in the URL');
        }
    }, [id]);

    const handleUpdate = async () => {
        if (!user) {
            setError('You must be logged in to edit a petition.');
            return;
        }
        if (!id || user.id !== petition.ownerId) {
            setError('You are not authorized to edit this petition.');
            return;
        }

        const updateData = {
            title,
            description,
            categoryId,
            supportTiers
        };

        try {
            await axios.patch(`${API_HOST}/petitions/${id}`, updateData, {
                headers: {
                    'X-Authorization': user.token
                }
            });
            navigate('/petitions');
        } catch (err) {
            console.error('Error updating petition:', err);
            setError('Failed to update petition');
        }
    };

    const handleTierChange = (index: number, field: string, value: string | number) => {
        const updatedTiers = supportTiers.map((tier, idx) => idx === index ? { ...tier, [field]: value } : tier);
        setSupportTiers(updatedTiers);
    };

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

    return (
        <Box sx={{ width: '100%', maxWidth: 600, mx: 'auto', p: 2 }}>
            {error && <Typography color="error">{error}</Typography>}
            <TextField
                label="Title"
                fullWidth
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                sx={{ mb: 2 }}
            />
            <TextField
                label="Description"
                fullWidth
                multiline
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                sx={{ mb: 2 }}
            />
            <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Category</InputLabel>
                <Select
                    value={categoryId}
                    label="Category"
                    onChange={(e) => setCategoryId(e.target.value)}
                >
                    {categories.map((category) => (
                        <MenuItem key={category.categoryId} value={category.categoryId}>
                            {category.name}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>
            {supportTiers.map((tier, index) => (
                <Paper key={index} sx={{ p: 2, mb: 2 }}>
                    <Typography variant="h6">Support Tier {index + 1}</Typography>
                    <TextField
                        label="Title"
                        fullWidth
                        value={tier.title}
                        onChange={(e) => handleTierChange(index, 'title', e.target.value)}
                        sx={{ mb: 1 }}
                    />
                    <TextField
                        label="Description"
                        fullWidth
                        multiline
                        value={tier.description}
                        onChange={(e) => handleTierChange(index, 'description', e.target.value)}
                        sx={{ mb: 1 }}
                    />
                    <TextField
                        label="Cost"
                        type="number"
                        fullWidth
                        value={tier.cost}
                        onChange={(e) => handleTierChange(index, 'cost', Number(e.target.value))}
                        sx={{ mb: 1 }}
                    />
                    <Button variant="contained" color="secondary" onClick={() => handleRemoveTier(index)} disabled={supportTiers.length === 1}>
                        Remove Tier
                    </Button>
                </Paper>
            ))}
            <Button variant="contained" onClick={handleAddTier} disabled={supportTiers.length >= 3} sx={{ mt: 2 }}>
                Add Support Tier
            </Button>
            <Button onClick={handleUpdate} variant="contained" color="primary" sx={{ mt: 2 }}>
                Update Petition
            </Button>
        </Box>
    );
};

export default EditPetition;
