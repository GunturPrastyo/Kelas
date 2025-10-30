"use client";

import Image from "next/image";
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

const Avatar = ({ user, size = 40, className = "" }: AvatarProps) => {
  const [avatarUrl, setAvatarUrl] = useState("/user-placeholder.png");

  useEffect(() => {
    if (user) {
      const displayName = user.name || "Pengguna";

      if (user.avatar) {
        const url = user.avatar.startsWith("http")
          ? user.avatar
          : `${process.env.NEXT_PUBLIC_API_URL}/uploads/${user.avatar}`;
        setAvatarUrl(url);
      } else {
        const initialAvatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(
          displayName
        )}&background=random&color=fff&size=128`;
        setAvatarUrl(initialAvatarUrl);
      }
    }
  }, [user]);

  return (
    <Image
      src={avatarUrl}
      alt={user?.name || "Avatar Pengguna"}
      width={size}
      height={size}
      className={`rounded-full object-cover ${className}`}
    />
  );
};

export default Avatar;