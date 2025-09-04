import { CollectionService } from "~/client/dev/cloudeko/kama/collection/v1/server_pb";
import { RecordService } from "~/client/dev/cloudeko/kama/record/v1/server_pb";

import { type Client as ConnectClient, createClient, type Interceptor, type Transport } from "@connectrpc/connect";
import { createGrpcWebTransport } from "@connectrpc/connect-web";

interface Client {
  getCollectionService(): ConnectClient<typeof CollectionService>;

  getRecordService(): ConnectClient<typeof RecordService>;
}

// Utility function to decode JWT token payload
/*function decodeJWT(token: string): any {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url?.replace(/-/g, '+').replace(/_/g, '/');

        if(!base64) return null;

        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    } catch (error) {
        console.error('Error decoding JWT:', error);
        return null;
    }
}

// Check if JWT token is expired or will expire soon (within 5 minutes)
function isTokenExpired(token: string): boolean {
    const payload = decodeJWT(token);
    if (!payload || !payload.exp) {
        return true;
    }

    const currentTime = Math.floor(Date.now() / 1000);
    const bufferTime = 5 * 60; // 5 minutes buffer
    return payload.exp <= (currentTime + bufferTime);
}

// Global variable to prevent multiple simultaneous refresh attempts
let refreshPromise: Promise<string | null> | null = null;

// Function to refresh the access token
async function refreshAccessToken(): Promise<string | null> {
    // If there's already a refresh in progress, wait for it
    if (refreshPromise) {
        return refreshPromise;
    }

    const refreshToken = localStorage.getItem("refreshToken");
    if (!refreshToken) {
        console.error('No refresh token available');
        return null;
    }

    refreshPromise = (async () => {
        try {
            // Create a temporary auth service client without the authorization interceptor
            const tempTransport = createGrpcWebTransport({baseUrl: "http://localhost:9000"});
            const tempAuthService = createClient(AuthService, tempTransport);

            const response = await tempAuthService.refreshToken({
                refreshToken: refreshToken
            });

            // Update localStorage with new access token
            localStorage.setItem("accessToken", response.accessToken);

            console.log('Access token refreshed successfully');
            return response.accessToken;
        } catch (error) {
            console.error('Failed to refresh access token:', error);

            // Clear tokens on refresh failure
            localStorage.removeItem("accessToken");
            localStorage.removeItem("refreshToken");
            localStorage.removeItem("isAuthenticated");

            // Redirect to login page
            window.location.href = "/";
            return null;
        } finally {
            refreshPromise = null;
        }
    })();

    return refreshPromise;
}*/

const authorization: Interceptor = (next) => async (req) => {
  /*// Skip authorization for auth service endpoints (except refresh token)
    if (req.url.startsWith("/pocketrion.auth.v1.AuthService") && 
        !req.url.includes("RefreshToken")) {
        return await next(req);
    }

    let token = localStorage.getItem("accessToken");

    // Check if token exists and is expired
    if (token && isTokenExpired(token)) {
        console.log('Access token expired, attempting to refresh...');
        const newToken = await refreshAccessToken();
        if (newToken) {
            token = newToken;
        } else {
            // If refresh failed, token will be null and request will proceed without auth
            token = null;
        }
    }

    // Add authorization header if we have a valid token
    if (token) {
        req.header.set("authorization", `Bearer ${token}`);
    }*/

  return await next(req);
};

class ClientImpl implements Client {
  private readonly transport: Transport;

  private readonly collectionService: ConnectClient<typeof CollectionService>;
  private readonly recordService: ConnectClient<typeof RecordService>;

  constructor(hostname: string) {
    this.transport = createGrpcWebTransport({ baseUrl: hostname, interceptors: [authorization] });
    this.collectionService = createClient(CollectionService, this.transport);
    this.recordService = createClient(RecordService, this.transport);
  }

  getCollectionService(): ConnectClient<typeof CollectionService> {
    return this.collectionService;
  }

  getRecordService(): ConnectClient<typeof RecordService> {
    return this.recordService;
  }
}

export const client = new ClientImpl("http://localhost:9000");
