import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { TextField, Button, Typography, MenuItem, Select, FormControl, InputLabel, FormHelperText, Box } from '@mui/material';
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
    const [error, setError] = useState<string>('');
    const [titleError, setTitleError] = useState<string>('');
    const [descriptionError, setDescriptionError] = useState<string>('');

    useEffect(() => {
        if (id) {
            const fetchPetition = async () => {
                try {
                    const response = await axios.get(`${API_HOST}/petitions/${id}`);
                    setPetition(response.data);
                    setTitle(response.data.title);
                    setDescription(response.data.description);
                    setCategoryId(response.data.categoryId);
                } catch (err) {
                    console.error('Error fetching petition details:', err);
                    setError('Failed to load petition details');
                }
            };

            fetchPetition();
        } else {
            setError('Petition ID is not specified in the URL');
        }
    }, [id]);

    useEffect(() => {
        axios.get(`${API_HOST}/petitions/categories`)
            .then(response => {
                setCategories(response.data);
            })
            .catch(() => {
                setError('Error fetching categories');
            });
    }, []);

    const validateInput = () => {
        let valid = true;
        if (!title) {
            setTitleError('Title is required.');
            valid = false;
        } else {
            setTitleError('');
        }

        if (!description) {
            setDescriptionError('Description is required.');
            valid = false;
        } else {
            setDescriptionError('');
        }

        return valid;
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

        if (!validateInput()) {
            return;
        }

        const updateData = {
            title,
            description,
            categoryId
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

    return (
        <Box sx={{ width: '100%', maxWidth: 600, mx: 'auto', p: 2 }}>
            {error && <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>}
            <TextField
                label="Title"
                fullWidth
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                error={!!titleError}
                helperText={titleError || 'Enter the title of the petition.'}
                sx={{ mb: 2 }}
            />
            <TextField
                label="Description"
                fullWidth
                multiline
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                error={!!descriptionError}
                helperText={descriptionError || 'Provide a detailed description.'}
                sx={{ mb: 2 }}
            />
            <FormControl fullWidth error={categoryId === ''} sx={{ mb: 2 }}>
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
                <FormHelperText>{categoryId === '' ? 'Please select a category.' : 'Select the category for your petition.'}</FormHelperText>
            </FormControl>
            <Button onClick={handleUpdate} variant="contained" color="primary" sx={{ mt: 1 }}>
                Update Petition
            </Button>
        </Box>
    );
};

export default EditPetition;
