import React, { useState, useEffect } from 'react';
import { Avatar, Button, IconButton, Alert } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

interface ImageUploadProps {
    initialImage: string;
    onImageChange: (file: File | null) => void;
    onImageRemove: () => void;
    editMode: boolean;
    isDefaultImage: boolean;
}

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif'];

const ImageUpload: React.FC<ImageUploadProps> = ({ initialImage, onImageChange, onImageRemove, editMode, isDefaultImage }) => {
    const [previewImage, setPreviewImage] = useState<string>(initialImage);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setPreviewImage(initialImage);
    }, [initialImage]);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        if (file) {
            if (file.size > MAX_IMAGE_SIZE) {
                setError(`Image size should not exceed ${MAX_IMAGE_SIZE / (1024 * 1024)} MB.`);
                onImageChange(null);
                return;
            }

            if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
                setError(`Invalid image type. Allowed types are: ${ALLOWED_IMAGE_TYPES.join(', ')}.`);
                onImageChange(null);
                return;
            }

            setPreviewImage(URL.createObjectURL(file));
            onImageChange(file);
            setError(null);
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
                <>
                    <Button variant="contained" component="label">
                        Upload Picture
                        <input type="file" hidden accept={ALLOWED_IMAGE_TYPES.join(',')} onChange={handleImageChange} />
                    </Button>
                    {!isDefaultImage && (
                        <IconButton color="secondary" onClick={handleRemoveImage}>
                            <DeleteIcon />
                        </IconButton>
                    )}
                </>
            )}
            {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
        </div>
    );
};

export default ImageUpload;
