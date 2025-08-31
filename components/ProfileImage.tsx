'use client';
import Image from 'next/image';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export default function ProfileImage() {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 서버와 클라이언트가 일치하지 않을 때는 기본 이미지를 보여줌
  if (!mounted) {
    return (
      <Image
        src="/images/profile-hoya-light.png"
        alt="hoya"
        width={144}
        height={144}
        className="object-cover"
      />
    );
  }

  return (
    <Image
      src={theme === 'light' ? '/images/profile-hoya-light.png' : '/images/profile-hoya-dark.png'}
      alt="hoya"
      width={144}
      height={144}
      className="object-cover"
    />
  );
}
