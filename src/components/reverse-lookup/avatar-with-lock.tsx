'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';

import { IconLock } from '../ui/icon/icons';

type AvatarWithLockProps = {
  animate?: boolean;
};

const AvatarWithLock = ({ animate = true }: AvatarWithLockProps) => {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(animate ? 1 : 0);

  useEffect(() => {
    if (!animate) {
      return;
    }

    const interval = setInterval(() => {
      setCurrentPhotoIndex(prev => (prev % 6) + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [animate]);

  return (
    <div>
      <div className="relative">
        <span className="
      absolute
      bottom-0
      right-0
      z-[1]
      flex
      items-center
      justify-center
      before:pointer-events-none
      before:absolute
      before:-z-10
      before:block
      before:size-8
      before:rounded-full
      before:bg-primary
    "
        >
          <IconLock className="size-5 text-white" />
        </span>
        <Image
          className="!h-auto !max-w-none"
          src={`/images/reverse-lookup/blur_photo_${currentPhotoIndex}.png`}
          alt="photo"
          width={72}
          height={72}
        />
      </div>
    </div>
  );
};

export default AvatarWithLock;
