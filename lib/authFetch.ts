/**
 * Wrapper untuk `fetch` yang secara otomatis menyertakan Authorization header.
 * @param url URL endpoint API
 * @param options Opsi fetch standar
 * @returns Promise<Response>
 */
export const authFetch = (url: RequestInfo | URL, options: RequestInit = {}): Promise<Response> => {
    // Ambil token dari localStorage
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

    // Gabungkan header yang ada dengan header Authorization
    const headers = {
        ...options.headers,
        ...(token && { 
            'Authorization': `Bearer ${token}`, // Header standar
            'X-Authorization': `Bearer ${token}` // Header alternatif untuk Hostinger
        }), 
    };

    return fetch(url, { ...options, headers });
};