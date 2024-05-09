import React from 'react';
import { Box, FormControl, InputLabel, Select, MenuItem, Checkbox, ListItemText, TextField, SelectChangeEvent } from '@mui/material';

interface FilterBarProps {
    categories: { [key: number]: string };
    selectedCategories: number[];
    setSelectedCategories: (categories: number[]) => void;
    maxCost: number;
    setMaxCost: (cost: number) => void;
}

const FilterBar: React.FC<FilterBarProps> = ({ categories, selectedCategories, setSelectedCategories, maxCost, setMaxCost }) => {
    const handleCategoryChange = (event: SelectChangeEvent<number[]>) => {
        const value = event.target.value as number[];
        setSelectedCategories(value);
    };

    const handleCostChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setMaxCost(Number(event.target.value));
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
                sx={{ width: 200 }}
            />
        </Box>
    );
};

export default FilterBar;
