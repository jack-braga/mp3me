export const APP_NAME = "mp3me";

// Spotify OAuth — PKCE public client, client ID is not secret
// Replace with your own Spotify Developer App client ID
export const SPOTIFY_CLIENT_ID = "2a686e31712f445894b3760c98a14cc8";
export const SPOTIFY_REDIRECT_URI = `${window.location.origin}${import.meta.env.BASE_URL}`;
export const SPOTIFY_SCOPES = "playlist-read-private playlist-read-collaborative";

// Storage
export const STORAGE_WARNING_THRESHOLD = 0.8;
export const MAX_UPLOAD_SIZE_BYTES = 100 * 1024 * 1024; // 100MB
export const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
