import React, { useState, useEffect } from 'react';
import { Avatar, Button, IconButton } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

interface ImageUploadProps {
    initialImage: string;
    onImageChange: (file: File | null) => void;
    onImageRemove: () => void;
    editMode: boolean;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ initialImage, onImageChange, onImageRemove, editMode }) => {
    const [previewImage, setPreviewImage] = useState<string>(initialImage);

    useEffect(() => {
        setPreviewImage(initialImage);
    }, [initialImage]);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setPreviewImage(URL.createObjectURL(file));
            onImageChange(file);
        }
    };

    const handleRemoveImage = () => {
        setPreviewImage(initialImage);
        onImageChange(null);
        onImageRemove();
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Avatar alt="Profile Image" src={previewImage || initialImage} sx={{ width: 100, height: 100 }} />
            {editMode && (
                <Button variant="contained" component="label">
                    Upload Picture
                    <input type="file" hidden onChange={handleImageChange} />
                </Button>
            )}
            {editMode && previewImage && previewImage !== initialImage && (
                <IconButton color="secondary" onClick={handleRemoveImage}>
                    <DeleteIcon />
                </IconButton>
            )}
        </div>
    );
};

export default ImageUpload;
