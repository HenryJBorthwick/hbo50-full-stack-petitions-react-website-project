import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { TextField, Button, Typography, MenuItem, Select, FormControl, InputLabel, Box, Paper } from '@mui/material';
import axios from 'axios';
import { API_HOST } from '../../config';
import { useUserStore } from '../store';

interface Category {
    categoryId: number;
    name: string;
}

interface SupportTier {
    supportTierId?: number;
    title: string;
    description: string;
    cost: number;
}

interface TierErrors {
    title: string;
    description: string;
}

const EditPetition: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useUserStore();
    const [petition, setPetition] = useState<any>(null);
    const [title, setTitle] = useState<string>('');
    const [description, setDescription] = useState<string>('');
    const [categoryId, setCategoryId] = useState<number | string>('');
    const [categories, setCategories] = useState<Category[]>([]);
    const [supportTiers, setSupportTiers] = useState<SupportTier[]>([]);
    const [errors, setErrors] = useState<{ [index: number]: TierErrors }>({});
    const [formError, setFormError] = useState<string>('');

    useEffect(() => {
        if (id) {
            axios.get(`${API_HOST}/petitions/${id}`)
                .then(response => {
                    setPetition(response.data);
                    setTitle(response.data.title);
                    setDescription(response.data.description);
                    setCategoryId(response.data.categoryId);
                    setSupportTiers(response.data.supportTiers || []);
                })
                .catch(err => {
                    console.error('Error fetching petition details:', err);
                    setFormError('Failed to load petition details');
                });

            axios.get(`${API_HOST}/petitions/categories`)
                .then(response => {
                    setCategories(response.data);
                })
                .catch(() => {
                    setFormError('Error fetching categories');
                });
        }
    }, [id]);

    const validateTier = (tier: SupportTier, index: number) => {
        const newErrors: TierErrors = { title: '', description: '' };
        if (!tier.title.trim()) newErrors.title = 'Title cannot be empty.';
        if (!tier.description.trim()) newErrors.description = 'Description cannot be empty.';
        setErrors(prev => ({ ...prev, [index]: newErrors }));
        return newErrors.title === '' && newErrors.description === '';
    };

    const handleUpdatePetition = async () => {
        if (!user?.token || !user?.id || user.id !== petition.ownerId) {
            setFormError('You are not authorized to edit this petition or you are not logged in.');
            return;
        }

        const updateData = { title, description, categoryId };

        try {
            await axios.patch(`${API_HOST}/petitions/${id}`, updateData, {
                headers: { 'X-Authorization': user.token }
            });
            navigate('/petitions');
        } catch (err) {
            console.error('Error updating petition:', err);
            setFormError('Failed to update petition');
        }
    };

    const handleUpdateSupportTier = async (tier: SupportTier, index: number) => {
        if (!user?.token) {
            setFormError('You must be logged in to edit support tiers.');
            return;
        }
        if (!validateTier(tier, index)) {
            setFormError('Please correct the errors before saving.');
            return;
        }
        try {
            if (!tier.supportTierId) {
                await axios.put(`${API_HOST}/petitions/${id}/supportTiers`, tier, {
                    headers: {
                        'X-Authorization': user.token
                    }
                });
            } else {
                await axios.patch(`${API_HOST}/petitions/${id}/supportTiers/${tier.supportTierId}`, tier, {
                    headers: {
                        'X-Authorization': user.token
                    }
                });
            }
            const updatedTiers = [...supportTiers];
            updatedTiers[index] = { ...tier };
            setSupportTiers(updatedTiers);
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[index];
                return newErrors;
            });
        } catch (err) {
            console.error('Error updating support tier:', err);
            setFormError('Failed to update support tier');
        }
    };

    const handleTierChange = (index: number, field: keyof SupportTier, value: string | number) => {
        const updatedTiers = supportTiers.map((tier, idx) => idx === index ? { ...tier, [field]: value } : tier);
        setSupportTiers(updatedTiers);
        validateTier(updatedTiers[index], index);
    };

    const handleAddTier = () => {
        if (supportTiers.length >= 3) {
            setFormError('Cannot have more than 3 support tiers');
            return;
        }
        setSupportTiers([...supportTiers, { title: '', description: '', cost: 0 }]);
    };

    const handleRemoveTier = async (tier: SupportTier, index: number) => {
        if (!tier.supportTierId || !user?.token) {
            console.error("Missing tier ID or user token"); // Debug output for troubleshooting
            setFormError('Invalid operation or not logged in.');
            return;
        }

        try {
            const response = await axios.delete(`${API_HOST}/petitions/${id}/supportTiers/${tier.supportTierId}`, {
                headers: { 'X-Authorization': user.token }
            });
            console.log("Delete response:", response); // Debug output to see response from server

            const updatedTiers = supportTiers.filter((_, idx) => idx !== index);
            setSupportTiers(updatedTiers);
            console.log("Updated tiers after delete:", updatedTiers); // Debug output to verify local state update

        } catch (err) {
            console.error('Error removing support tier:', err);
            setFormError('Failed to remove support tier');
        }
    };


    return (
        <Box sx={{ width: '100%', maxWidth: 600, mx: 'auto', p: 2 }}>
            {formError && <Typography color="error">{formError}</Typography>}
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
                        error={!!errors[index]?.title}
                        helperText={errors[index]?.title}
                        sx={{ mb: 1 }}
                    />
                    <TextField
                        label="Description"
                        fullWidth
                        multiline
                        value={tier.description}
                        onChange={(e) => handleTierChange(index, 'description', e.target.value)}
                        error={!!errors[index]?.description}
                        helperText={errors[index]?.description}
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
                    <Button variant="contained" color="secondary" onClick={() => handleRemoveTier(tier, index)} disabled={supportTiers.length === 1}>
                        Remove Tier
                    </Button>
                    <Button onClick={() => handleUpdateSupportTier(tier, index)} variant="contained" color="primary">
                        Save Tier
                    </Button>
                </Paper>
            ))}
            <Button variant="contained" onClick={handleAddTier} disabled={supportTiers.length >= 3}>
                Add Support Tier
            </Button>
            <Button onClick={handleUpdatePetition} variant="contained" color="primary">
                Update Petition
            </Button>
        </Box>
    );
};

export default EditPetition;
