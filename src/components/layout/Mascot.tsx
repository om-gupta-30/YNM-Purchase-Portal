'use client';

import Image from 'next/image';

export default function Mascot() {
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Image
        src="/mascot.png"
        alt="YNM Safety Mascot"
        width={100}
        height={120}
        className="drop-shadow-lg w-16 h-auto md:w-20 lg:w-24"
        priority
      />
    </div>
  );
}
