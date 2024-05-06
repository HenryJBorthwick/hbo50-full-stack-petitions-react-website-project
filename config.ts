// import dotenv from 'dotenv'
// dotenv.config()

// export const API_HOST_DEPLOYED = "https://seng365.csse.canterbury.ac.nz/api/v1";
// export const API_HOST_LOCAL = "http://localhost:4941/api/v1";
// export const API_HOST = process.env.VITE_NODE_ENV === 'deployed' ? API_HOST_DEPLOYED : API_HOST_LOCAL;

export const API_HOST_DEPLOYED = import.meta.env.VITE_API_HOST_DEPLOYED;
export const API_HOST_LOCAL = import.meta.env.VITE_API_HOST_LOCAL;
export const API_HOST = import.meta.env.VITE_NODE_ENV === 'deployed' ? API_HOST_DEPLOYED : API_HOST_LOCAL;