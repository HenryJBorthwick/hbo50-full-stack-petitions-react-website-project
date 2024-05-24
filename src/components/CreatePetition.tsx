import React, { useState, useEffect } from 'react';
import {
    TextField,
    Button,
    MenuItem,
    Typography,
    Paper,
    Grid,
    Container,
    CssBaseline,
    ThemeProvider,
    createTheme,
    Alert,
    Box
} from '@mui/material';
import axios from 'axios';
import { API_HOST } from '../../config';
import { useUserStore } from '../store';
import NavBar from './NavBar';
import { useNavigate } from 'react-router-dom';

interface Category {
    categoryId: number;
    name: string;
}

const theme = createTheme();
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif'];
const MAX_COST = 9999999; // Maximum allowable cost for support tiers

const CreatePetition: React.FC = () => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [categoryId, setCategoryId] = useState<number | string>('');
    const [supportTiers, setSupportTiers] = useState([{ title: '', description: '', cost: 0 }]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [image, setImage] = useState<File | null>(null);
    const [error, setError] = useState<string>('');

    const { user } = useUserStore();
    const navigate = useNavigate();

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

    const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0] || null;
        setImage(file);
    };

    const validateFields = () => {
        if (!title.trim()) {
            return "Petition title cannot be blank.";
        }

        if (!description.trim()) {
            return "Petition description cannot be blank.";
        }

        if (!categoryId) {
            return "Please select a category.";
        }

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

        if (supportTiers.some(tier => tier.cost > MAX_COST)) {
            return `Support tier cost cannot exceed ${MAX_COST}.`;
        }

        if (!image) {
            return "Please upload an image.";
        }

        if (image.size > MAX_IMAGE_SIZE) {
            return `Image size should not exceed ${MAX_IMAGE_SIZE / (1024 * 1024)} MB.`;
        }

        if (!ALLOWED_IMAGE_TYPES.includes(image.type)) {
            return `Invalid image type. Allowed types are: ${ALLOWED_IMAGE_TYPES.join(', ')}.`;
        }

        return null;
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!user) {
            setError('You must be logged in to create a petition.');
            return;
        }

        const validationError = validateFields();
        if (validationError) {
            setError(validationError);
            return;
        }

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

            // Ensure image is not null before reading it as an ArrayBuffer
            if (image) {
                const imageData = await image.arrayBuffer();
                const imageType = image.type; // Get the image type

                await axios.put(`${API_HOST}/petitions/${petitionResponse.data.petitionId}/image`, imageData, {
                    headers: {
                        'Content-Type': imageType,
                        'X-Authorization': user.token
                    }
                });
            } else {
                throw new Error('Image is null');
            }

            // Clear form and error
            setTitle('');
            setDescription('');
            setCategoryId('');
            setSupportTiers([{ title: '', description: '', cost: 0 }]);
            setImage(null);
            setError('');

            // Navigate to the Petitions page
            navigate('/petitions');
        } catch (err) {
            if (axios.isAxiosError(err) && err.response) {
                const statusText = err.response.statusText;
                switch (err.response.status) {
                    case 400:
                        if (statusText.includes("data/title must NOT have fewer than 1 characters")) {
                            setError("Petition title cannot be empty.");
                        } else if (statusText.includes("data/title must NOT have more than 128 characters")) {
                            setError("Petition title cannot exceed 128 characters.");
                        } else if (/data\/supportTiers\/\d+\/title must NOT have more than 128 characters/.test(statusText)) {
                            setError("Support tier title cannot exceed 128 characters.");
                        } else if (statusText.includes("data/description must NOT have fewer than 1 characters")) {
                            setError("Petition description cannot be empty.");
                        } else if (statusText.includes("data/description must NOT have more than 1024 characters")) {
                            setError("Petition description cannot exceed 1024 characters.");
                        } else if (/data\/supportTiers\/\d+\/description must NOT have more than 1024 characters/.test(statusText)) {
                            setError("Support tier description cannot exceed 1024 characters.");
                        } else if (statusText.includes("photo must be image/jpeg, image/png, image/gif type")) {
                            setError("Invalid image type. Allowed types are: image/jpeg, image/png, image/gif.");
                        } else {
                            setError('Invalid information. Please check your input.');
                        }
                        break;
                    case 403:
                        setError('You are not authorized to create this petition.');
                        break;
                    case 413:
                        setError('Field or File size exceeds the allowable limit.');
                        break;
                    case 500:
                        setError('Internal server error. Please try again.');
                        break;
                    default:
                        setError('An unexpected error occurred. Please try again.');
                }
            } else {
                setError('Unable to connect to the server. Please try again later.');
            }
        }
    };

    return (
        <ThemeProvider theme={theme}>
            <NavBar />
            <CssBaseline />
            <Container component="main" maxWidth="md" sx={{ mt: 8, mb: 4 }}>
                <Paper elevation={3} sx={{ p: 3 }}>
                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <TextField
                                label="Title"
                                fullWidth
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                required
                                InputLabelProps={{ shrink: true }}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                label="Description"
                                fullWidth
                                multiline
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                required
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
                            <Grid item xs={12} key={index}>
                                <Paper sx={{ p: 2 }}>
                                    <Typography variant="h6" align="center">Support Tier {index + 1}</Typography>
                                    <TextField
                                        label="Title"
                                        fullWidth
                                        value={tier.title}
                                        onChange={(e) => handleTierChange(index, 'title', e.target.value)}
                                        sx={{ mb: 1 }}
                                        required
                                        InputLabelProps={{ shrink: true }}
                                    />
                                    <TextField
                                        label="Description"
                                        fullWidth
                                        multiline
                                        value={tier.description}
                                        onChange={(e) => handleTierChange(index, 'description', e.target.value)}
                                        sx={{ mb: 1 }}
                                        required
                                        InputLabelProps={{ shrink: true }}
                                    />
                                    <TextField
                                        label="Cost"
                                        type="number"
                                        fullWidth
                                        value={tier.cost}
                                        onChange={(e) => handleTierChange(index, 'cost', e.target.value === '' ? 0 : parseFloat(e.target.value))}
                                        sx={{ mb: 1 }}
                                        required
                                        InputLabelProps={{ shrink: true }}
                                        InputProps={{
                                            onKeyDown: handleCostKeyDown(index),
                                            inputProps: { min: 0, max: MAX_COST }
                                        }}
                                    />
                                    <Box display="flex" justifyContent="center">
                                        <Button
                                            variant="contained"
                                            color="secondary"
                                            onClick={() => handleRemoveTier(index)}
                                            disabled={supportTiers.length === 1}
                                        >
                                            Remove Tier
                                        </Button>
                                    </Box>
                                </Paper>
                            </Grid>
                        ))}
                        <Grid item xs={12} container justifyContent="center">
                            <Button variant="contained" onClick={handleAddTier} disabled={supportTiers.length >= 3}>
                                Add Support Tier
                            </Button>
                        </Grid>
                        <Grid item xs={12} container direction="column" alignItems="center">
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
                            {image && <Typography sx={{ mt: 1 }}>{image.name}</Typography>}
                        </Grid>
                        <Grid item xs={12} container justifyContent="center">
                            <Button onClick={handleSubmit} variant="contained" color="primary">
                                Create Petition
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

export default CreatePetition;
