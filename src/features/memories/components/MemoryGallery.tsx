import type { MemoryMedia } from '../types';
import { Image as ImageIcon } from 'lucide-react';

interface MemoryGalleryProps {
  media: MemoryMedia[];
}

export function MemoryGallery({ media }: MemoryGalleryProps) {
  if (!media || media.length === 0) {
    return (
      <div className="p-6 bg-[#17171A] border border-[#26262B] rounded-[24px] text-center">
        <ImageIcon className="w-8 h-8 text-[#71717A] mx-auto mb-1.5" />
        <p className="text-xs text-[#A1A1AA]">В этой памяти пока нет дополнительных фотографий</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2">
      {media.map((item) => (
        <div key={item.id} className="aspect-square bg-[#26262B] rounded-2xl overflow-hidden border border-[#383843]">
          <img src={item.image_url} alt="Media" className="w-full h-full object-cover" />
        </div>
      ))}
    </div>
  );
}
