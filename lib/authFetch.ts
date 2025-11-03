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
        ...(token && { 'X-Authorization': `Bearer ${token}` }), // Gunakan header kustom
    };

    return fetch(url, { ...options, headers });
};