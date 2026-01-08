"use client";

import { useEffect, useState } from "react";

interface User {
  name?: string;
  avatar?: string;
}

interface AvatarProps {
  user: User | null;
  size?: number;
  className?: string;
}

const Avatar = ({ user, size = 10, className = "w-8 h-auto" }: AvatarProps) => {
  const [avatarUrl, setAvatarUrl] = useState(
    `https://ui-avatars.com/api/?name=Pengguna&background=random&color=fff&size=128`
  );

  const generateAvatarUrl = (userData: User) => {
    const displayName = userData.name || "Pengguna";
    if (userData.avatar) {
      return userData.avatar.startsWith("http")
        ? userData.avatar
        : `${process.env.NEXT_PUBLIC_API_URL}/uploads/${userData.avatar}`;
    } else {
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(
        displayName
      )}&background=random&color=fff&size=128`;
    }
  };

  useEffect(() => {
    if (user) {
      setAvatarUrl(generateAvatarUrl(user));
    }
  }, [user]);

  useEffect(() => {
    const handleUserUpdate = () => {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setAvatarUrl(generateAvatarUrl(parsedUser));
      }
    };

    window.addEventListener("user-updated", handleUserUpdate);
    return () => window.removeEventListener("user-updated", handleUserUpdate);
  }, []);

  return (
    <img
      src={avatarUrl}
      alt={user?.name || "Avatar Pengguna"}
      width={size}
      height={size}
      className={`rounded-full object-cover ${className}`}
      onError={(e) => {
        const fallbackUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(
          user?.name || "Pengguna"
        )}&background=random&color=fff&size=128`;
        if (e.currentTarget.src !== fallbackUrl) {
          e.currentTarget.src = fallbackUrl;
        }
      }}
    />
  );
};

export default Avatar;