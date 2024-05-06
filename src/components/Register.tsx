import * as React from 'react';
import { API_HOST } from '../../config';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import TextField from '@mui/material/TextField';
import Link from '@mui/material/Link';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import {IconButton} from "@mui/material";
import axios from "axios";

const defaultTheme = createTheme();

export default function SignUp() {
    // Storage for selected image
    const [selectedImage, setSelectedImage] = React.useState("/images/example.jpg");

    // Handle the image change
    const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target && event.target.files && event.target.files[0]) {
            const reader = new FileReader();
            reader.onload = e => {
                if (e.target) {
                    setSelectedImage(e.target.result as string);
                }
            };
            reader.readAsDataURL(event.target.files[0]);
        }
    };

    // Handle the register form submission
    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const data = new FormData(event.currentTarget);

        const user = {
            email: data.get('email'),
            firstName: data.get('firstName'),
            lastName: data.get('lastName'),
            password: data.get('password')
        };

        axios.post(`${API_HOST}/users/register`, user)
            .then(response => console.log(response.data))
            .catch(error => console.error('Error:', error));
    };

    // Begin the component
    return (
        <ThemeProvider theme={defaultTheme}>
            <Container component="main" maxWidth="xs">
                <CssBaseline/>
                <Box
                    sx={{
                        marginTop: 8,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                    }}
                >
                    <Avatar sx={{m: 1, bgcolor: 'secondary.main'}}>
                        <LockOutlinedIcon/>
                    </Avatar>
                    <Typography component="h1" variant="h5">
                        Sign up
                    </Typography>

                    {/*profile picture selector*/}
                    <Box component="form" noValidate onSubmit={handleSubmit} sx={{mt: 3}}>
                        <input
                            accept="image/*"
                            style={{display: 'none'}}
                            id="contained-button-file"
                            multiple
                            type="file"
                            onChange={handleImageChange}
                        />
                        <label htmlFor="contained-button-file">
                            <IconButton component="span">
                                <Avatar
                                    src={selectedImage}
                                    style={{
                                        margin: "10px",
                                        width: "60px",
                                        height: "60px",
                                    }}
                                />
                            </IconButton>
                        </label>

                        {/*begin register details form*/}
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    autoComplete="given-name"
                                    name="firstName"
                                    required
                                    fullWidth
                                    id="firstName"
                                    label="First Name"
                                    autoFocus
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    required
                                    fullWidth
                                    id="lastName"
                                    label="Last Name"
                                    name="lastName"
                                    autoComplete="family-name"
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    required
                                    fullWidth
                                    id="email"
                                    label="Email Address"
                                    name="email"
                                    autoComplete="email"
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    required
                                    fullWidth
                                    name="password"
                                    label="Password"
                                    type="password"
                                    id="password"
                                    autoComplete="new-password"
                                />
                            </Grid>
                        </Grid>

                        {/*sign up button*/}
                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            sx={{mt: 3, mb: 2}}
                        >
                            Sign Up
                        </Button>
                        <Grid container justifyContent="flex-end">
                            <Grid item>
                                <Link href="#" variant="body2">
                                    Already have an account? Sign in
                                </Link>
                            </Grid>
                        </Grid>
                    </Box>
                </Box>
            </Container>
        </ThemeProvider>
    );
}