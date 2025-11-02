"use client";

import { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface User {
    _id: string;
}

const SocketContext = createContext<Socket | null>(null);

export const useSocket = () => {
    return useContext(SocketContext);
};

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
    const [socket, setSocket] = useState<Socket | null>(null);

    useEffect(() => {
        const userRaw = localStorage.getItem('user');
        if (!userRaw) return;

        const user: User = JSON.parse(userRaw);

        const newSocket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000', {
            withCredentials: true,
        });

        newSocket.on('connect', () => {
            console.log('🔌 Terhubung ke server socket:', newSocket.id);
            // Bergabung ke room pribadi setelah terhubung
            newSocket.emit('join_room', user._id);
        });

        setSocket(newSocket);

        return () => { newSocket.close(); };
    }, []);

    return <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>;
};