'use client';

import { useEffect, useRef, useState } from 'react';

type CouplePhotoImageProps = {
  src: string;
  x?: number;
  y?: number;
  zoom?: number;
  alt?: string;
  className?: string;
};

export default function CouplePhotoImage({
  src,
  x = 50,
  y = 50,
  zoom = 1,
  alt = '',
  className = '',
}: CouplePhotoImageProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [frame, setFrame] = useState({ width: 0, height: 0 });
  const [imageRatio, setImageRatio] = useState(16 / 9);

  useEffect(() => {
    const element = frameRef.current;
    if (!element) return;
    const observer = new ResizeObserver(entries => {
      const rect = entries[0]?.contentRect;
      if (rect) setFrame({ width: rect.width, height: rect.height });
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const safeZoom = Math.max(1, Math.min(3, Number(zoom) || 1));
  const imageWidth = frame.width && frame.height
    ? Math.max(frame.width, frame.height * imageRatio)
    : 0;
  const imageHeight = imageWidth && imageRatio ? imageWidth / imageRatio : 0;
  const maxPanX = Math.max(0, (imageWidth * safeZoom - frame.width) / 2);
  const maxPanY = Math.max(0, (imageHeight * safeZoom - frame.height) / 2);
  const translateX = ((50 - Math.max(0, Math.min(100, x))) / 50) * maxPanX;
  const translateY = ((50 - Math.max(0, Math.min(100, y))) / 50) * maxPanY;

  return (
    <div ref={frameRef} className={`relative overflow-hidden ${className}`}>
      <img
        src={src}
        alt={alt}
        draggable={false}
        onLoad={event => {
          const image = event.currentTarget;
          if (image.naturalWidth && image.naturalHeight) {
            setImageRatio(image.naturalWidth / image.naturalHeight);
          }
        }}
        className="pointer-events-none absolute left-1/2 top-1/2 max-w-none select-none"
        style={{
          width: imageWidth || '100%',
          height: imageHeight || '100%',
          objectFit: 'fill',
          transform: `translate(-50%, -50%) translate(${translateX}px, ${translateY}px) scale(${safeZoom})`,
          transformOrigin: 'center center',
        }}
      />
    </div>
  );
}
