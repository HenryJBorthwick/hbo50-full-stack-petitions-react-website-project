import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { TextField, Button, Typography, MenuItem, Select, FormControl, InputLabel, Paper, Container, CssBaseline, ThemeProvider, createTheme, Grid, Alert } from '@mui/material';
import axios from 'axios';
import { API_HOST } from '../../config';
import { useUserStore } from '../store';
import NavBar from './NavBar';

const theme = createTheme();

interface Supporter {
    supportTierId: number;
}

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
    const [supporters, setSupporters] = useState<{ [key: number]: number }>({});
    const [error, setError] = useState<string>('');

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
                    fetchSupporters(data.supportTiers || []);
                })
                .catch(err => {
                    console.error('Error fetching petition details:', err);
                    setError('Failed to load petition details');
                });

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

    const fetchSupporters = (tiers: any[]) => {
        if (id) {
            axios.get(`${API_HOST}/petitions/${id}/supporters`)
                .then(response => {
                    const allSupporters: Supporter[] = response.data;
                    const supportersData: { [key: number]: number } = {};

                    // Initialize count for each tier to 0
                    tiers.forEach(tier => {
                        supportersData[tier.supportTierId] = 0;
                    });

                    // Count supporters for each tier
                    allSupporters.forEach((supporter: Supporter) => {
                        if (Object.prototype.hasOwnProperty.call(supportersData, supporter.supportTierId)) {
                            supportersData[supporter.supportTierId] += 1;
                        }
                    });

                    setSupporters(supportersData);
                })
                .catch(err => {
                    console.error('Error fetching supporters:', err);
                    setError('Failed to load supporters data');
                });
        }
    };

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
            return;
        }
        if (!id || user.id !== petition.ownerId) {
            setError('You are not authorized to edit this petition.');
            return;
        }

        const validationError = validateTiers();
        if (validationError) {
            setError(validationError);
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

            // Handle deleted tiers
            const processDeletion = async () => {
                for (const tier of deletedTiers) {
                    try {
                        await axios.delete(`${API_HOST}/petitions/${id}/supportTiers/${tier.supportTierId}`, {
                            headers: { 'X-Authorization': user.token }
                        });
                    } catch (err: unknown) {
                        if (axios.isAxiosError(err) && err.response && err.response.status === 403 && err.response.statusText.includes("A petition must have at least 1 support tier")) {
                            if (addedTiers.length > 0) {
                                await axios.put(`${API_HOST}/petitions/${id}/supportTiers`, addedTiers[0], {
                                    headers: { 'X-Authorization': user.token }
                                });
                                addedTiers.shift(); // Remove the first added tier after successful addition
                            }
                            await axios.delete(`${API_HOST}/petitions/${id}/supportTiers/${tier.supportTierId}`, {
                                headers: { 'X-Authorization': user.token }
                            });
                        } else {
                            throw err;
                        }
                    }
                }
            };

            // Handle added tiers
            const processAddition = async () => {
                for (const tier of addedTiers) {
                    await axios.put(`${API_HOST}/petitions/${id}/supportTiers`, tier, {
                        headers: { 'X-Authorization': user.token }
                    });
                }
            };

            // Handle updated tiers
            const processUpdate = async () => {
                for (const tier of updatedTiers) {
                    await axios.patch(`${API_HOST}/petitions/${id}/supportTiers/${tier.supportTierId}`, tier, {
                        headers: { 'X-Authorization': user.token }
                    });
                }
            };

            await processDeletion();
            await processAddition();
            await processUpdate();

            navigate('/petitions');
        } catch (err: unknown) {
            if (axios.isAxiosError(err) && err.response) {
                const statusText = err.response.statusText;
                switch (err.response.status) {
                    case 400:
                        if (statusText.includes("data/title must NOT have fewer than 1 characters")) {
                            setError("Petition title cannot be empty.");
                        } else if (statusText.includes("data/description must NOT have fewer than 1 characters")) {
                            setError("Petition description cannot be empty.");
                        } else {
                            setError('Invalid information. Please check your input.');
                        }
                        break;
                    case 403:
                        setError('You are not authorized to edit this petition.');
                        break;
                    default:
                        setError('An unexpected error occurred. Please try again.');
                }
            } else {
                setError('Unable to connect to the server. Please try again later.');
            }
        }
    };

    const handleTierChange = (index: number, field: string, value: any) => {
        const updatedTiers = supportTiers.map((tier, idx) => idx === index ? { ...tier, [field]: value } : tier);
        setSupportTiers(updatedTiers);
    };

    const handleCostKeyDown = (index: number) => (event: React.KeyboardEvent<HTMLInputElement>) => {
        const key = event.key;
        const currentCost = supportTiers[index].cost.toString();

        if (!/^[0-9]$/.test(key) && key !== 'Backspace') {
            event.preventDefault();
        }

        if (key === 'Backspace' && currentCost.length === 1) {
            setSupportTiers(supportTiers.map((tier, idx) =>
                idx === index ? { ...tier, cost: 0 } : tier
            ));
            event.preventDefault();
        }

        if (supportTiers[index].cost === 0 && /^[0-9]$/.test(key)) {
            setSupportTiers(supportTiers.map((tier, idx) =>
                idx === index ? { ...tier, cost: parseInt(key, 10) } : tier
            ));
            event.preventDefault();
        }
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
                                    <TextField
                                        label="Title"
                                        fullWidth
                                        value={tier.title}
                                        onChange={(e) => handleTierChange(index, 'title', e.target.value)}
                                        sx={{ mb: 1 }}
                                        disabled={!!supporters[tier.supportTierId]}
                                    />
                                    <TextField
                                        label="Description"
                                        fullWidth
                                        multiline
                                        value={tier.description}
                                        onChange={(e) => handleTierChange(index, 'description', e.target.value)}
                                        sx={{ mb: 1 }}
                                        disabled={!!supporters[tier.supportTierId]}
                                    />
                                    <TextField
                                        label="Cost"
                                        type="number"
                                        fullWidth
                                        value={tier.cost}
                                        onChange={(e) => handleTierChange(index, 'cost', e.target.value === '' ? 0 : parseFloat(e.target.value))}
                                        sx={{ mb: 1 }}
                                        InputProps={{
                                            onKeyDown: handleCostKeyDown(index),
                                            inputProps: { min: 0 }
                                        }}
                                        disabled={!!supporters[tier.supportTierId]}
                                    />
                                    <Button
                                        variant="contained"
                                        color="secondary"
                                        onClick={() => handleRemoveTier(index)}
                                        disabled={supportTiers.length === 1 || !!supporters[tier.supportTierId]}
                                    >
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
                        <Grid item xs={12}>
                            {error && <Alert severity="error">{error}</Alert>}
                        </Grid>
                    </Grid>
                </Paper>
            </Container>
        </ThemeProvider>
    );
};

export default EditPetition;
