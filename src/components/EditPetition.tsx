import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { TextField, Button, Typography, MenuItem, Select, FormControl, InputLabel, Paper, Container, CssBaseline, ThemeProvider, createTheme, Grid, Snackbar, Alert } from '@mui/material';
import axios from 'axios';
import { API_HOST } from '../../config';
import { useUserStore } from '../store';
import NavBar from './NavBar';

const theme = createTheme();

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
    const [originalTiers, setOriginalTiers] = useState<any[]>([]);
    const [error, setError] = useState<string>('');
    const [openSnackbar, setOpenSnackbar] = useState(false);

    useEffect(() => {
        if (id) {
            axios.get(`${API_HOST}/petitions/${id}`)
                .then(response => {
                    const data = response.data;
                    setPetition(data);
                    setTitle(data.title);
                    setDescription(data.description);
                    setCategoryId(data.categoryId);
                    setSupportTiers(data.supportTiers || []);
                    setOriginalTiers(data.supportTiers || []);
                })
                .catch(err => {
                    console.error('Error fetching petition details:', err);
                    setError('Failed to load petition details');
                    setOpenSnackbar(true);
                });

            axios.get(`${API_HOST}/petitions/categories`)
                .then(response => {
                    setCategories(response.data);
                })
                .catch(() => {
                    setError('Error fetching categories');
                    setOpenSnackbar(true);
                });
        } else {
            setError('Petition ID is not specified in the URL');
            setOpenSnackbar(true);
        }
    }, [id]);

    const validateTiers = () => {
        const titles = supportTiers.map(tier => tier.title.trim());
        const uniqueTitles = new Set(titles);

        if (titles.some(title => title === "")) {
            return "Support tier titles cannot be blank.";
        }

        if (supportTiers.some(tier => tier.description.trim() === "")) {
            return "Support tier descriptions cannot be blank.";
        }

        if (titles.length !== uniqueTitles.size) {
            return "Support tier titles must be unique.";
        }

        return null;
    };

    const handleUpdate = async () => {
        if (!user) {
            setError('You must be logged in to edit a petition.');
            setOpenSnackbar(true);
            return;
        }
        if (!id || user.id !== petition.ownerId) {
            setError('You are not authorized to edit this petition.');
            setOpenSnackbar(true);
            return;
        }

        const validationError = validateTiers();
        if (validationError) {
            setError(validationError);
            setOpenSnackbar(true);
            return;
        }

        const updateData = { title, description, categoryId };
        try {
            await axios.patch(`${API_HOST}/petitions/${id}`, updateData, {
                headers: { 'X-Authorization': user.token }
            });

            const addedTiers = supportTiers.filter(tier => !tier.supportTierId);
            const updatedTiers = supportTiers.filter(tier => originalTiers.some(orig => orig.supportTierId === tier.supportTierId && (tier.title !== orig.title || tier.description !== orig.description || tier.cost !== orig.cost)));
            const deletedTiers = originalTiers.filter(orig => !supportTiers.some(tier => tier.supportTierId === orig.supportTierId));

            for (const tier of addedTiers) {
                await axios.put(`${API_HOST}/petitions/${id}/supportTiers`, tier, {
                    headers: { 'X-Authorization': user.token }
                });
            }

            for (const tier of updatedTiers) {
                await axios.patch(`${API_HOST}/petitions/${id}/supportTiers/${tier.supportTierId}`, tier, {
                    headers: { 'X-Authorization': user.token }
                });
            }

            for (const tier of deletedTiers) {
                await axios.delete(`${API_HOST}/petitions/${id}/supportTiers/${tier.supportTierId}`, {
                    headers: { 'X-Authorization': user.token }
                });
            }

            navigate('/petitions');
        } catch (err) {
            if (axios.isAxiosError(err) && err.response) {
                const statusText = err.response.statusText;
                switch (err.response.status) {
                    case 400:
                        if (statusText.includes("title")) {
                            setError("Title must not be empty.");
                        } else if (statusText.includes("description")) {
                            setError("Description must not be empty.");
                        } else if (statusText.includes("categoryId")) {
                            setError("Category must be selected.");
                        } else {
                            setError('Invalid data provided. Please check your input.');
                        }
                        break;
                    case 401:
                        setError('You are not authorized to edit this petition.');
                        break;
                    case 403:
                        setError('You are not allowed to edit this petition.');
                        break;
                    case 404:
                        setError('Petition not found.');
                        break;
                    case 500:
                        setError('An internal server error occurred.');
                        break;
                    default:
                        setError('An unknown error occurred.');
                }
            } else {
                setError('Failed to update petition. Please try again.');
            }
            setOpenSnackbar(true);
        }
    };

    const handleTierChange = (index: number, field: string, value: any) => {
        const updatedTiers = supportTiers.map((tier, idx) => idx === index ? { ...tier, [field]: value } : tier);
        setSupportTiers(updatedTiers);
    };

    const handleAddTier = () => {
        if (supportTiers.length < 3) {
            setSupportTiers([...supportTiers, { title: '', description: '', cost: 0 }]);
        } else {
            setError('Cannot have more than 3 support tiers');
            setOpenSnackbar(true);
        }
    };

    const handleRemoveTier = (index: number) => {
        const updatedTiers = supportTiers.filter((_, idx) => idx !== index);
        setSupportTiers(updatedTiers);
    };

    const handleCloseSnackbar = () => {
        setOpenSnackbar(false);
    };

    return (
        <ThemeProvider theme={theme}>
            <NavBar />
            <CssBaseline />
            <Container component="main" maxWidth="md" sx={{ mt: 8, mb: 4 }}>
                <Paper elevation={3} sx={{ p: 3 }}>
                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <TextField label="Title" fullWidth value={title} onChange={(e) => setTitle(e.target.value)} />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField label="Description" fullWidth multiline value={description} onChange={(e) => setDescription(e.target.value)} />
                        </Grid>
                        <Grid item xs={12}>
                            <FormControl fullWidth>
                                <InputLabel>Category</InputLabel>
                                <Select value={categoryId} label="Category" onChange={(e) => setCategoryId(e.target.value)}>
                                    {categories.map((category) => (
                                        <MenuItem key={category.categoryId} value={category.categoryId}>
                                            {category.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        {supportTiers.map((tier, index) => (
                            <Grid item xs={12} key={index}>
                                <Paper sx={{ p: 2 }}>
                                    <Typography variant="h6">Support Tier {index + 1}</Typography>
                                    <TextField label="Title" fullWidth value={tier.title} onChange={(e) => handleTierChange(index, 'title', e.target.value)} sx={{ mb: 1 }} />
                                    <TextField label="Description" fullWidth multiline value={tier.description} onChange={(e) => handleTierChange(index, 'description', e.target.value)} sx={{ mb: 1 }} />
                                    <TextField label="Cost" type="number" fullWidth value={tier.cost} onChange={(e) => handleTierChange(index, 'cost', Number(e.target.value))} sx={{ mb: 1 }} />
                                    <Button variant="contained" color="secondary" onClick={() => handleRemoveTier(index)} disabled={supportTiers.length === 1}>
                                        Remove Tier
                                    </Button>
                                </Paper>
                            </Grid>
                        ))}
                        <Grid item xs={12}>
                            <Button variant="contained" onClick={handleAddTier} disabled={supportTiers.length >= 3}>
                                Add Support Tier
                            </Button>
                        </Grid>
                        <Grid item xs={12}>
                            <Button onClick={handleUpdate} variant="contained" color="primary">
                                Update Petition
                            </Button>
                        </Grid>
                    </Grid>
                </Paper>
                <Snackbar open={openSnackbar} autoHideDuration={6000} onClose={handleCloseSnackbar}>
                    <Alert onClose={handleCloseSnackbar} severity="error" sx={{ width: '100%' }}>
                        {error}
                    </Alert>
                </Snackbar>
            </Container>
        </ThemeProvider>
    );
};

export default EditPetition;
