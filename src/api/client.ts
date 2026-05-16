import axios from "axios";
import { getToken } from "@/stores/auth";

export const client = axios.create({
    baseURL: "http://localhost:6767/api",
    headers: {
        "Content-Type": "application/json",
    },
});

// Attach auth token to every request if present
client.interceptors.request.use((config) => {
    const token = getToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});
