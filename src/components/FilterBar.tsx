import React from 'react';
import { Box, FormControl, InputLabel, Select, MenuItem, Checkbox, ListItemText, TextField, SelectChangeEvent } from '@mui/material';

interface FilterBarProps {
    categories: { [key: number]: string };
    selectedCategories: number[];
    setSelectedCategories: React.Dispatch<React.SetStateAction<number[]>>;
    maxCost: string;
    setMaxCost: React.Dispatch<React.SetStateAction<string>>;
    sortBy: string;
    setSortBy: React.Dispatch<React.SetStateAction<string>>;
}

const MAX_COST_LIMIT = 9999999; // Set a reasonable upper limit for max cost

const FilterBar: React.FC<FilterBarProps> = ({ categories, selectedCategories, setSelectedCategories, maxCost, setMaxCost, sortBy, setSortBy }) => {
    const handleCategoryChange = (event: SelectChangeEvent<number[]>) => {
        const value = event.target.value as number[];
        setSelectedCategories(value);
    };

    const handleCostChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;
        if (!isNaN(Number(value)) && value === '' || (Number(value) >= 0 && Number(value) <= MAX_COST_LIMIT)) {
            setMaxCost(value);
        }
    };

    const handleSortChange = (event: SelectChangeEvent<string>) => {
        setSortBy(event.target.value);
    };

    return (
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <FormControl variant="outlined" sx={{ minWidth: 200 }}>
                <InputLabel>Categories</InputLabel>
                <Select
                    multiple
                    value={selectedCategories}
                    onChange={handleCategoryChange}
                    label="Categories"
                    renderValue={(selected) => (selected as number[]).map(id => categories[id]).join(', ')}
                >
                    {Object.entries(categories).map(([id, name]) => (
                        <MenuItem key={id} value={Number(id)}>
                            <Checkbox checked={selectedCategories.indexOf(Number(id)) > -1} />
                            <ListItemText primary={name} />
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>
            <TextField
                label="Max Supporting Cost"
                variant="outlined"
                type="number"
                value={maxCost}
                onChange={handleCostChange}
                onKeyPress={(event) => {
                    if (!/[0-9]/.test(event.key)) {
                        event.preventDefault();
                    }
                }}
                sx={{ width: 200 }}
                inputProps={{
                    min: 0,
                    max: MAX_COST_LIMIT,
                }}
            />
            <FormControl variant="outlined" sx={{ minWidth: 200 }}>
                <InputLabel>Sort By</InputLabel>
                <Select
                    value={sortBy}
                    onChange={handleSortChange}
                    label="Sort By"
                >
                    <MenuItem value="CREATED_ASC">Creation Date (Oldest to Newest)</MenuItem>
                    <MenuItem value="CREATED_DESC">Creation Date (Newest to Oldest)</MenuItem>
                    <MenuItem value="ALPHABETICAL_ASC">Title (A-Z)</MenuItem>
                    <MenuItem value="ALPHABETICAL_DESC">Title (Z-A)</MenuItem>
                    <MenuItem value="COST_ASC">Supporting Cost (Low to High)</MenuItem>
                    <MenuItem value="COST_DESC">Supporting Cost (High to Low)</MenuItem>
                </Select>
            </FormControl>
        </Box>
    );
};

export default FilterBar;
