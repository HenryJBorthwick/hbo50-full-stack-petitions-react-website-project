import React, { useEffect, useState, ChangeEvent } from 'react';
import { useParams } from 'react-router-dom';
import {
    Alert,
    Button,
    Card,
    Container,
    FormControl,
    Grid,
    IconButton,
    InputLabel,
    MenuItem,
    Select,
    SelectChangeEvent,
    Snackbar,
    TextField,
    Typography
} from '@mui/material';
import { Delete, Add as AddIcon } from '@mui/icons-material';
import axios from 'axios';
import { API_HOST } from '../../config';
import { useUserStore } from '../store';
import NavBar from './NavBar';

interface PetitionFormData {
    title: string;
    description: string;
    categoryId: number;
}

interface TierData {
    supportTiers: SupportTier[]
}

interface SupportTier {
    title: string;
    description: string;
    cost: number;
    supportTierId: number;
}

interface Category {
    categoryId: number;
    name: string;
}

interface Supporter {
    supportId: number;
    supportTierId: number;
    message: string;
    supporterId: number;
    supporterFirstName: string;
    supporterLastName: string;
    timestamp: string;
    supporterImageUrl?: string;
}

const EditPetition = () => {
    const { id } = useParams();
    const [petitionData, setPetitionData] = useState<PetitionFormData>({
        title: '',
        description: '',
        categoryId: 0
    });

    const [tierData, setTierData] = useState<TierData>({ supportTiers: [] });
    const [staticTierData, setStaticTierData] = useState<TierData>({ supportTiers: [] });
    const [categories, setCategories] = useState<Category[]>([]);
    const [supporters, setSupporters] = useState<Supporter[]>([]);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [snackMessage, setSnackMessage] = useState("");
    const [snackOpenSuccess, setSnackOpenSuccess] = useState(false);
    const [snackOpenFail, setSnackOpenFail] = useState(false);
    const [updateFlag, setUpdateFlag] = useState<number>(1);
    const [cancel, setCancel] = useState<number>(1);

    const { user } = useUserStore();

    useEffect(() => {
        getPetitionInfo();
        getSupporters();
        getCategories();
    }, [updateFlag, cancel]);

    const compareTiers = () => {
        const newSupportTiers: SupportTier[] = [];
        const changedSupportTiers: SupportTier[] = [];
        const deletedSupportTiers: SupportTier[] = [];

        tierData.supportTiers.forEach(tier => {
            const staticTier = staticTierData.supportTiers.find(staticTier => staticTier.supportTierId === tier.supportTierId);

            if (!staticTier) {
                newSupportTiers.push(tier);
            } else if (
                tier.title !== staticTier.title ||
                tier.description !== staticTier.description ||
                tier.cost !== staticTier.cost
            ) {
                changedSupportTiers.push(tier);
            }
        });

        staticTierData.supportTiers.forEach(staticTier => {
            const existingTier = tierData.supportTiers.find(tier => tier.supportTierId === staticTier.supportTierId);
            if (!existingTier) {
                deletedSupportTiers.push(staticTier);
            }
        });

        return {
            newSupportTiers,
            changedSupportTiers,
            deletedSupportTiers
        };
    };

    const getPetitionInfo = async () => {
        if (!id?.match(/^\d+$/)) {
            setSnackMessage("404 Not Found");
            setSnackOpenFail(true);
        } else {
            try {
                const response = await axios.get(`${API_HOST}/petitions/${id}/`);
                setPetitionData({
                    title: response.data.title,
                    description: response.data.description,
                    categoryId: response.data.categoryId
                });

                setTierData({ supportTiers: response.data.supportTiers });
                setStaticTierData({ supportTiers: response.data.supportTiers });
            } catch (error) {
                setSnackMessage((error as Error).message);
                setSnackOpenFail(true);
            }

            try {
                await axios.get(`${API_HOST}/petitions/${id}/image`);
            } catch {
                // Image not found or error fetching image
            }
        }
    };

    const getSupporters = async () => {
        if (!id?.match(/^\d+$/)) {
            setSnackMessage("404 Not Found");
            setSnackOpenFail(true);
        } else {
            try {
                const response = await axios.get(`${API_HOST}/petitions/${id}/supporters/`);
                setSupporters(response.data);
            } catch (error) {
                setSnackMessage((error as Error).message);
                setSnackOpenFail(true);
            }
        }
    };

    const getCategories = async () => {
        try {
            const response = await axios.get(`${API_HOST}/petitions/categories/`);
            setCategories(response.data);
        } catch (error) {
            setSnackMessage((error as Error).message);
            setSnackOpenFail(true);
        }
    };

    const handleSubmit = async () => {
        try {
            await axios.patch(`${API_HOST}/petitions/${id}`, petitionData, { headers: { 'X-Authorization': user?.token } });

            if (selectedFile !== null) {
                await axios.put(`${API_HOST}/petitions/${id}/image`, selectedFile, { headers: { 'X-Authorization': user?.token, "Content-Type": selectedFile.type } });
            }

            const { newSupportTiers, changedSupportTiers, deletedSupportTiers } = compareTiers();
            await Promise.all([
                ...deletedSupportTiers.map(deletedTier => axios.delete(`${API_HOST}/petitions/${id}/supportTiers/${deletedTier.supportTierId}`, { headers: { 'X-Authorization': user?.token } })),
                ...newSupportTiers.map(newTier => axios.post(`${API_HOST}/petitions/${id}/supportTiers`, newTier, { headers: { 'X-Authorization': user?.token } })),
                ...changedSupportTiers.map(changedTier => axios.patch(`${API_HOST}/petitions/${id}/supportTiers/${changedTier.supportTierId}`, changedTier, { headers: { 'X-Authorization': user?.token } }))
            ]);

            setSnackMessage("Successfully Updated Petition");
            setSnackOpenSuccess(true);
            setUpdateFlag(updateFlag * -1);
        } catch (error) {
            setSnackMessage((error as Error).message);
            setSnackOpenFail(true);
        }
    };

    const handleCancel = () => {
        setCancel(cancel * -1);
        setSelectedFile(null);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent<number>) => {
        const { name, value } = e.target;
        setPetitionData((prevData) => ({
            ...prevData,
            [name]: name === 'categoryId' ? Number(value) : value
        }));
    };

    const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files.length > 0) {
            setSelectedFile(event.target.files[0]);
        }
    };

    const handleSnackCloseSuccess = (reason?: string) => {
        if (reason === 'clickaway') return;
        setSnackOpenSuccess(false);
    };

    const handleSnackCloseFail = (reason?: string) => {
        if (reason === 'clickaway') return;
        setSnackOpenFail(false);
    };

    const handleTierChange = (index: number, field: string, value: string | number) => {
        setTierData((prevData) => {
            const updatedTiers = [...prevData.supportTiers];
            updatedTiers[index] = { ...updatedTiers[index], [field]: value };
            return { ...prevData, supportTiers: updatedTiers };
        });
    };

    const handleAddTier = () => {
        if (tierData.supportTiers.length < 3) {
            setTierData((prevData) => ({
                ...prevData,
                supportTiers: [...prevData.supportTiers, { title: '', description: '', cost: 0, supportTierId: 0 }],
            }));
        }
    };

    const handleRemoveTier = (index: number) => {
        setTierData((prevData) => ({
            ...prevData,
            supportTiers: prevData.supportTiers.filter((_, i) => i !== index),
        }));
    };

    const hasSupporters = (supportTierId: number): boolean => {
        return supporters.some(supporter => supporter.supportTierId === supportTierId);
    };

    const displayPetitionDetails = () => (
        <div>
            <TextField
                fullWidth
                required
                label="Title"
                name="title"
                value={petitionData.title}
                onChange={handleChange}
                margin="normal"
            />
            <TextField
                fullWidth
                required
                label="Description"
                name="description"
                value={petitionData.description}
                onChange={handleChange}
                margin="normal"
                multiline
                rows={4}
            />
            <FormControl fullWidth margin="normal">
                <InputLabel id="category-label">Category</InputLabel>
                <Select
                    labelId="category-label"
                    id="category"
                    value={petitionData.categoryId}
                    onChange={handleChange}
                    name="categoryId"
                    required
                >
                    {categories.map((category) => (
                        <MenuItem key={category.categoryId} value={category.categoryId}>
                            {category.name}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>
            {displayImage()}
        </div>
    );

    const displayTiers = () => (
        <Card variant="outlined">
            <div className="scrollable-container">
                {tierData.supportTiers.map((tier, index) => (
                    <Container key={index}>
                        <Typography variant="h6">
                            Support Tier {index + 1}
                            {tierData.supportTiers.length > 1 && !hasSupporters(tier.supportTierId) && (
                                <IconButton onClick={() => handleRemoveTier(index)} aria-label="delete">
                                    <Delete />
                                </IconButton>
                            )}
                        </Typography>
                        <TextField
                            fullWidth
                            required
                            label="Title"
                            value={tier.title}
                            onChange={(e) => handleTierChange(index, 'title', e.target.value)}
                            margin="normal"
                        />
                        <TextField
                            fullWidth
                            required
                            label="Description"
                            value={tier.description}
                            onChange={(e) => handleTierChange(index, 'description', e.target.value)}
                            margin="normal"
                            multiline
                            rows={4}
                        />
                        <TextField
                            fullWidth
                            required
                            type="number"
                            label="Cost"
                            value={tier.cost}
                            onChange={(e) => handleTierChange(index, 'cost', parseFloat(e.target.value))}
                            margin="normal"
                        />
                    </Container>
                ))}
                {tierData.supportTiers.length < 3 && (
                    <Button onClick={handleAddTier} variant="outlined" startIcon={<AddIcon />} color="primary">
                        Add Support Tier
                    </Button>
                )}
            </div>
        </Card>
    );

    const displayImage = () => (
        <div>
            {selectedFile ? (
                <img src={URL.createObjectURL(selectedFile)} width={250} height={250} style={{ borderRadius: '50%' }} alt='Hero' />
            ) : (
                <img src={`${API_HOST}/petitions/${id}/image`} width={250} height={250} style={{ borderRadius: '50%' }} alt='Hero' />
            )}
            <TextField
                fullWidth
                color="secondary"
                type="file"
                onChange={handleFileChange}
            />
        </div>
    );

    const displaySnack = () => (
        <div>
            <Snackbar
                autoHideDuration={6000}
                open={snackOpenSuccess}
                onClose={() => handleSnackCloseSuccess()}
                key={snackMessage}>
                <Alert onClose={() => handleSnackCloseSuccess()} severity="success" sx={{ width: '100%' }}>
                    {snackMessage}
                </Alert>
            </Snackbar>
            <Snackbar
                autoHideDuration={6000}
                open={snackOpenFail}
                onClose={() => handleSnackCloseFail()}
                key={snackMessage}>
                <Alert onClose={() => handleSnackCloseFail()} severity="error" sx={{ width: '100%' }}>
                    {snackMessage}
                </Alert>
            </Snackbar>
        </div>
    );

    return (
        <div>
            <NavBar />
            <Typography variant="h4" gutterBottom>
                Edit Petition
            </Typography>
            <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                    <Container>
                        <Typography variant="h6">
                            Petition Details
                        </Typography>
                        {displayPetitionDetails()}
                        <Button type="submit" variant="outlined" color="primary" onClick={handleCancel}>
                            Revert Changes
                        </Button>
                        <Button type="submit" variant="contained" color="primary" onClick={handleSubmit}>
                            Submit Changes
                        </Button>
                    </Container>
                </Grid>
                <Grid item xs={12} sm={6} justifyContent="center">
                    {displayTiers()}
                </Grid>
            </Grid>
            {displaySnack()}
        </div>
    );
}

export default EditPetition;
