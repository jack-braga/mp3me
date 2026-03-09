import { SPOTIFY_CLIENT_ID, SPOTIFY_REDIRECT_URI, SPOTIFY_SCOPES } from "@/lib/constants";

const TOKEN_KEYS = {
  accessToken: "spotify_access_token",
  refreshToken: "spotify_refresh_token",
  expiresAt: "spotify_token_expires_at",
  codeVerifier: "spotify_code_verifier",
} as const;

function generateRandomString(length: number): string {
  const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const values = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(values, (x) => possible[x % possible.length]).join("");
}

async function sha256(plain: string): Promise<ArrayBuffer> {
  const encoder = new TextEncoder();
  return crypto.subtle.digest("SHA-256", encoder.encode(plain));
}

function base64urlEncode(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let str = "";
  bytes.forEach((b) => (str += String.fromCharCode(b)));
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export async function startSpotifyLogin(): Promise<void> {
  const codeVerifier = generateRandomString(128);
  localStorage.setItem(TOKEN_KEYS.codeVerifier, codeVerifier);

  const challengeBuffer = await sha256(codeVerifier);
  const codeChallenge = base64urlEncode(challengeBuffer);

  const params = new URLSearchParams({
    client_id: SPOTIFY_CLIENT_ID,
    response_type: "code",
    redirect_uri: SPOTIFY_REDIRECT_URI,
    code_challenge_method: "S256",
    code_challenge: codeChallenge,
    scope: SPOTIFY_SCOPES,
  });

  window.location.href = `https://accounts.spotify.com/authorize?${params.toString()}`;
}

export async function handleSpotifyCallback(code: string): Promise<boolean> {
  const codeVerifier = localStorage.getItem(TOKEN_KEYS.codeVerifier);
  if (!codeVerifier) return false;

  try {
    const response = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: SPOTIFY_CLIENT_ID,
        grant_type: "authorization_code",
        code,
        redirect_uri: SPOTIFY_REDIRECT_URI,
        code_verifier: codeVerifier,
      }),
    });

    if (!response.ok) return false;

    const data = await response.json();
    localStorage.setItem(TOKEN_KEYS.accessToken, data.access_token);
    localStorage.setItem(TOKEN_KEYS.refreshToken, data.refresh_token);
    localStorage.setItem(
      TOKEN_KEYS.expiresAt,
      String(Date.now() + data.expires_in * 1000),
    );
    localStorage.removeItem(TOKEN_KEYS.codeVerifier);
    return true;
  } catch {
    return false;
  }
}

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = localStorage.getItem(TOKEN_KEYS.refreshToken);
  if (!refreshToken) return null;

  try {
    const response = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: SPOTIFY_CLIENT_ID,
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      }),
    });

    if (!response.ok) {
      logout();
      return null;
    }

    const data = await response.json();
    localStorage.setItem(TOKEN_KEYS.accessToken, data.access_token);
    if (data.refresh_token) {
      localStorage.setItem(TOKEN_KEYS.refreshToken, data.refresh_token);
    }
    localStorage.setItem(
      TOKEN_KEYS.expiresAt,
      String(Date.now() + data.expires_in * 1000),
    );
    return data.access_token;
  } catch {
    return null;
  }
}

export async function getValidAccessToken(): Promise<string | null> {
  const accessToken = localStorage.getItem(TOKEN_KEYS.accessToken);
  if (!accessToken) return null;

  const expiresAt = Number(localStorage.getItem(TOKEN_KEYS.expiresAt) ?? "0");

  // Refresh if expiring within 60 seconds
  if (Date.now() > expiresAt - 60_000) {
    return refreshAccessToken();
  }

  return accessToken;
}

export function isSpotifyConnected(): boolean {
  return !!localStorage.getItem(TOKEN_KEYS.accessToken);
}

export function logout(): void {
  localStorage.removeItem(TOKEN_KEYS.accessToken);
  localStorage.removeItem(TOKEN_KEYS.refreshToken);
  localStorage.removeItem(TOKEN_KEYS.expiresAt);
  localStorage.removeItem(TOKEN_KEYS.codeVerifier);
}
