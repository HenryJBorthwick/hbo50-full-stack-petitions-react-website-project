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
    SelectChangeEvent
} from '@mui/material';
import dayjs from 'dayjs';
import { API_HOST } from '../../config';
import SearchBar from './SearchBar';
import FilterBar from './FilterBar';

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

const Petitions: React.FC = () => {
    const [petitions, setPetitions] = useState<Petition[]>([]);
    const [categories, setCategories] = useState<{ [key: number]: string }>({});
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
    const [maxCost, setMaxCost] = useState<number>(0);
    const [sortBy, setSortBy] = useState<string>('CREATED_ASC');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPetitions, setTotalPetitions] = useState(0);
    const [pageSize, setPageSize] = useState(10);  // Default page size is 10

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

    useEffect(() => {
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
                setTotalPetitions(petitionsResponse.data.count);  // Set the total number of petitions
                const petitionsWithDetails = await Promise.all(
                    petitionsResponse.data.petitions.map(async (petition: Petition) => {
                        const detailedPetition = await fetchPetitionDetails(petition);
                        try {
                            const imageResponse = await axios.get(`${API_HOST}/users/${detailedPetition.ownerId}/image`, { responseType: 'blob' });
                            detailedPetition.ownerProfileImage = URL.createObjectURL(imageResponse.data);
                        } catch (error) {
                            detailedPetition.ownerProfileImage = '/images/example.jpg';
                        }
                        return detailedPetition;
                    })
                );
                setPetitions(petitionsWithDetails);
            } catch (error) {
                console.error('Failed to fetch petitions:', error);
            }
        };

        fetchPetitions();
    }, [searchQuery, selectedCategories, maxCost, sortBy, currentPage, pageSize]);

    const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
        setCurrentPage(value);
    };

    const handlePageSizeChange = (event: SelectChangeEvent<number>) => {
        setPageSize(event.target.value as number);
        setCurrentPage(1);
    };

    const isFirstPage = currentPage === 1;
    const lastPage = Math.ceil(totalPetitions / pageSize);
    const isLastPage = currentPage === lastPage;

    return (
        <Container maxWidth="lg">
            <Box sx={{ position: 'sticky', top: 0, zIndex: 1, backgroundColor: 'white', padding: 3, borderRadius: 1, boxShadow: 3 }}>
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
            </Box>
            <Box sx={{ marginTop: 3 }}>
                <Grid container spacing={2} sx={{ minHeight: '60vh' }}>
                    {petitions.length > 0 ? (
                        petitions.map((petition) => (
                            <Grid item key={petition.petitionId} xs={12} sm={6} md={4}>
                                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
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
                                        <Typography gutterBottom variant="h5" component="div" noWrap>
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
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 3 }}>
                <FormControl variant="outlined" sx={{ minWidth: 120 }}>
                    <InputLabel>Page Size</InputLabel>
                    <Select
                        value={pageSize}
                        onChange={handlePageSizeChange}
                        label="Page Size"
                    >
                        {[5, 10].map(size => (
                            <MenuItem key={size} value={size}>{size}</MenuItem>
                        ))}
                    </Select>
                </FormControl>
                <Pagination
                    count={lastPage}
                    page={currentPage}
                    onChange={handlePageChange}
                    color="primary"
                    showFirstButton
                    showLastButton
                />
            </Box>
            {isFirstPage && (
                <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ marginTop: 1 }}>
                    You are on the first page.
                </Typography>
            )}
            {isLastPage && totalPetitions > 0 && (
                <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ marginTop: 1 }}>
                    You are on the last page.
                </Typography>
            )}
        </Container>
    );
};

export default Petitions;
