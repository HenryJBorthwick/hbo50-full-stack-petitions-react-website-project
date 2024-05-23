import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Card,
    CardContent,
    Typography,
    CardMedia,
    Grid,
    Box,
    Avatar,
    Container,
    Pagination,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    SelectChangeEvent,
    Button,
    Stack,
    Paper,
    CssBaseline,
    createTheme,
    ThemeProvider,
    Snackbar,
    Alert
} from '@mui/material';
import dayjs from 'dayjs';
import { API_HOST } from '../../config';
import SearchBar from './SearchBar';
import FilterBar from './FilterBar';
import NavBar from './NavBar';
import { useUserStore } from '../store';
import { generateDefaultAvatar, convertCanvasToBlob } from '../utils/avatarUtils';

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
    description?: string;
    ownerProfileImage?: string;
}

interface Category {
    categoryId: number;
    name: string;
}

const theme = createTheme();

const Petitions: React.FC = () => {
    const [petitions, setPetitions] = useState<Petition[]>([]);
    const [categories, setCategories] = useState<{ [key: number]: string }>({});
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
    const [maxCost, setMaxCost] = useState<number>(0);
    const [sortBy, setSortBy] = useState<string>('CREATED_ASC');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPetitions, setTotalPetitions] = useState(0);
    const [pageSize, setPageSize] = useState(9);
    const { user } = useUserStore();
    const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
    const [errorSnackbarOpen, setErrorSnackbarOpen] = useState(false);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const categoriesResponse = await axios.get(`${API_HOST}/petitions/categories`);
                const categoriesMap: { [key: number]: string } = {};
                categoriesResponse.data.forEach((category: Category) => {
                    categoriesMap[category.categoryId] = category.name;
                });
                setCategories(categoriesMap);
            } catch (error) {
                console.error('Error fetching categories:', error);
            }
        };

        fetchCategories();
    }, []);

    const fetchPetitionDetails = async (petition: Petition): Promise<Petition> => {
        try {
            const detailsResponse = await axios.get(`${API_HOST}/petitions/${petition.petitionId}`);
            return { ...petition, description: detailsResponse.data.description };
        } catch (error) {
            console.error(`Failed to fetch details for petition ${petition.petitionId}:`, error);
            return petition;
        }
    };

    const fetchPetitions = async () => {
        try {
            const params: any = {
                sortBy,
                startIndex: (currentPage - 1) * pageSize,
                count: pageSize
            };
            if (searchQuery) {
                params.q = searchQuery;
            }
            if (selectedCategories.length > 0) {
                params.categoryIds = selectedCategories;
            }
            if (maxCost > 0) {
                params.supportingCost = maxCost;
            }

            const petitionsResponse = await axios.get(`${API_HOST}/petitions`, { params });
            setTotalPetitions(petitionsResponse.data.count);
            const petitionsWithDetails = await Promise.all(
                petitionsResponse.data.petitions.map(async (petition: Petition) => {
                    const detailedPetition = await fetchPetitionDetails(petition);
                    try {
                        const imageResponse = await axios.get(`${API_HOST}/users/${detailedPetition.ownerId}/image`, { responseType: 'blob' });
                        detailedPetition.ownerProfileImage = URL.createObjectURL(imageResponse.data);
                    } catch (error) {
                        const initial = petition.ownerFirstName.charAt(0).toUpperCase();
                        const canvas = generateDefaultAvatar(initial);
                        const blob = await convertCanvasToBlob(canvas, 'image/png');
                        detailedPetition.ownerProfileImage = URL.createObjectURL(blob);
                    }
                    return detailedPetition;
                })
            );
            setPetitions(petitionsWithDetails);
        } catch (error) {
            console.error('Failed to fetch petitions:', error);
        }
    };

    useEffect(() => {
        fetchPetitions();
    }, [searchQuery, selectedCategories, maxCost, sortBy, currentPage, pageSize]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, selectedCategories, maxCost, sortBy]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (confirmDeleteId !== null) {
                const target = event.target as HTMLElement;
                if (!target.closest('.confirm-delete')) {
                    setConfirmDeleteId(null);
                }
            }
        };

        document.addEventListener('click', handleClickOutside);
        return () => {
            document.removeEventListener('click', handleClickOutside);
        };
    }, [confirmDeleteId]);

    const handleConfirmDelete = (petitionId: number) => {
        setConfirmDeleteId(petitionId);
    };

    const handleDeletePetition = async (petitionId: number) => {
        try {
            await axios.delete(`${API_HOST}/petitions/${petitionId}`, {
                headers: { 'X-Authorization': user?.token }
            });
            setConfirmDeleteId(null);
            fetchPetitions();
        } catch (error: any) {
            if (
                axios.isAxiosError(error) &&
                error.response &&
                error.response.status === 403 &&
                error.response.statusText === 'Can not delete a petition if one or more users have supported it'
            ) {
                setErrorSnackbarOpen(true);
            } else {
                console.error('Failed to delete petition:', error);
            }
        }
    };

    const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
        setCurrentPage(value);
    };

    const handlePageSizeChange = (event: SelectChangeEvent<number>) => {
        setPageSize(event.target.value as number);
        setCurrentPage(1); // Reset to the first page whenever page size changes
    };

    return (
        <ThemeProvider theme={theme}>
            <NavBar />
            <CssBaseline />
            <Container component="main" maxWidth="lg" sx={{ mt: 8, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
                <Paper elevation={3} sx={{ p: 3, width: '100%', mb: 3 }}>
                    <SearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
                    <FilterBar
                        categories={categories}
                        selectedCategories={selectedCategories}
                        setSelectedCategories={setSelectedCategories}
                        maxCost={maxCost}
                        setMaxCost={setMaxCost}
                        sortBy={sortBy}
                        setSortBy={setSortBy}
                    />
                </Paper>
                <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
                    <Stack spacing={3}>
                        <Grid container spacing={3} sx={{ justifyContent: 'center', maxWidth: 1200, mx: 'auto' }}>
                            {petitions.length > 0 ? (
                                petitions.map((petition) => (
                                    <Grid item key={petition.petitionId} xs={12} sm={6} md={4}>
                                        <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', borderRadius: 2, boxShadow: 3 }}>
                                            <CardMedia
                                                component="img"
                                                height="140"
                                                image={`${API_HOST}/petitions/${petition.petitionId}/image`}
                                                alt="Petition image"
                                            />
                                            <CardContent sx={{ flexGrow: 1 }}>
                                                <Box display="flex" alignItems="center" mb={2}>
                                                    <Avatar
                                                        src={petition.ownerProfileImage}
                                                        alt={`${petition.ownerFirstName} ${petition.ownerLastName}`}
                                                        sx={{ mr: 2 }}
                                                    />
                                                    <Typography variant="body1" noWrap>
                                                        {petition.ownerFirstName} {petition.ownerLastName}
                                                    </Typography>
                                                </Box>
                                                <Typography gutterBottom variant="h6" component="div" noWrap>
                                                    {petition.title}
                                                </Typography>
                                                <Box sx={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                    <Typography variant="body2" color="text.secondary">
                                                        Category: {categories[petition.categoryId] || 'Loading...'}
                                                    </Typography>
                                                    <Typography variant="body2" color="text.secondary">
                                                        Creation Date: {dayjs(petition.creationDate).format('DD/MM/YYYY')}
                                                    </Typography>
                                                    <Typography variant="body2" color="text.secondary">
                                                        Supporting Cost: ${petition.supportingCost}
                                                    </Typography>
                                                </Box>
                                            </CardContent>
                                            <Button variant="outlined" color="primary" href={`/petition/${petition.petitionId}`} sx={{ m: 1 }}>
                                                View Details
                                            </Button>
                                            {user && user.id === petition.ownerId && (
                                                <>
                                                    <Button variant="contained" color="secondary" href={`/edit/${petition.petitionId}`} sx={{ m: 1 }}>
                                                        Edit
                                                    </Button>
                                                    {confirmDeleteId === petition.petitionId ? (
                                                        <Button
                                                            className="confirm-delete"
                                                            variant="contained"
                                                            color="warning"
                                                            onClick={() => handleDeletePetition(petition.petitionId)}
                                                            sx={{ m: 1 }}
                                                        >
                                                            Confirm Delete
                                                        </Button>
                                                    ) : (
                                                        <Button
                                                            variant="contained"
                                                            color="error"
                                                            onClick={() => handleConfirmDelete(petition.petitionId)}
                                                            sx={{ m: 1 }}
                                                        >
                                                            Delete
                                                        </Button>
                                                    )}
                                                </>
                                            )}
                                        </Card>
                                    </Grid>
                                ))
                            ) : (
                                <Grid item xs={12}>
                                    <Typography variant="h6" color="text.secondary" textAlign="center">
                                        No petitions found.
                                    </Typography>
                                </Grid>
                            )}
                        </Grid>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <FormControl variant="outlined" sx={{ minWidth: 120 }}>
                                <InputLabel>Page Size</InputLabel>
                                <Select
                                    value={pageSize}
                                    onChange={handlePageSizeChange}
                                    label="Page Size"
                                >
                                    {[6, 9].map(size => (
                                        <MenuItem key={size} value={size}>{size}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            <Pagination
                                count={Math.ceil(totalPetitions / pageSize)}
                                page={currentPage}
                                onChange={handlePageChange}
                                color="primary"
                                showFirstButton
                                showLastButton
                            />
                        </Box>
                    </Stack>
                </Paper>
            </Container>
            <Snackbar
                open={errorSnackbarOpen}
                autoHideDuration={6000}
                onClose={() => setErrorSnackbarOpen(false)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
            >
                <Alert onClose={() => setErrorSnackbarOpen(false)} severity="error" sx={{ width: '100%' }}>
                    Cannot delete a petition that has supporters.
                </Alert>
            </Snackbar>
        </ThemeProvider>
    );
};

export default Petitions;
