import React from 'react';
import { TextField, Box } from '@mui/material';

interface SearchBarProps {
    searchQuery: string;
    setSearchQuery: (query: string) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ searchQuery, setSearchQuery }) => {
    return (
        <Box sx={{ mb: 3 }}>
            <TextField
                fullWidth
                label="Search Petitions"
                variant="outlined"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Enter keywords"
            />
        </Box>
    );
};

export default SearchBar;
