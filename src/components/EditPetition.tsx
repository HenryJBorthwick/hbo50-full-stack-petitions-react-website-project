import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { TextField, Button, Typography, MenuItem, Select, FormControl, InputLabel } from '@mui/material';
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
            categoryId
        };

        try {
            await axios.patch(`${API_HOST}/petitions/${id}`, updateData, {
                headers: {
                    'X-Authorization': user.token
                }
            });
            // Navigate to the general petitions page upon successful update
            navigate('/petitions');
        } catch (err) {
            console.error('Error updating petition:', err);
            setError('Failed to update petition');
        }
    };

    return (
        <div>
            {error && <Typography color="error">{error}</Typography>}
            <TextField
                label="Title"
                fullWidth
                value={title}
                onChange={(e) => setTitle(e.target.value)}
            />
            <TextField
                label="Description"
                fullWidth
                multiline
                value={description}
                onChange={(e) => setDescription(e.target.value)}
            />
            <FormControl fullWidth>
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
            <Button onClick={handleUpdate} variant="contained" color="primary">
                Update Petition
            </Button>
        </div>
    );
};

export default EditPetition;
