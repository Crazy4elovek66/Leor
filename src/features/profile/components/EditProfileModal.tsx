import { useState } from 'react';
import { Dialog } from '@/components/ui/dialog';
import { BasicInfoForm } from './BasicInfoForm';
import { InterestsGrid } from './InterestsGrid';
import { SizesSection } from './SizesSection';
import type { FullGiftProfile, TasteCategory, SizeCategory } from '../types';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: FullGiftProfile;
  onUpdateBaseProfile: (data: { bio: string; city: string; birthDate: string }) => Promise<void>;
  onToggleInterest: (category: TasteCategory, title: string) => Promise<void>;
  onSaveSize: (category: SizeCategory, value: string) => Promise<void>;
}

export function EditProfileModal({
  isOpen,
  onClose,
  profile,
  onUpdateBaseProfile,
  onToggleInterest,
  onSaveSize,
}: EditProfileModalProps) {
  const [activeTab, setActiveTab] = useState<'info' | 'interests' | 'sizes'>('info');

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Редактировать Gift Profile">
      <div className="flex border-b border-[#26262B] mb-5">
        <button
          onClick={() => setActiveTab('info')}
          className={`flex-1 py-2 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === 'info'
              ? 'border-[#D8B4B0] text-[#D8B4B0]'
              : 'border-transparent text-[#A1A1AA] hover:text-[#F5F5F7]'
          }`}
        >
          О себе
        </button>
        <button
          onClick={() => setActiveTab('interests')}
          className={`flex-1 py-2 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === 'interests'
              ? 'border-[#D8B4B0] text-[#D8B4B0]'
              : 'border-transparent text-[#A1A1AA] hover:text-[#F5F5F7]'
          }`}
        >
          Интересы
        </button>
        <button
          onClick={() => setActiveTab('sizes')}
          className={`flex-1 py-2 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === 'sizes'
              ? 'border-[#D8B4B0] text-[#D8B4B0]'
              : 'border-transparent text-[#A1A1AA] hover:text-[#F5F5F7]'
          }`}
        >
          Размеры
        </button>
      </div>

      {activeTab === 'info' && (
        <BasicInfoForm
          initialBio={profile.bio}
          initialCity={profile.city}
          initialBirthDate={profile.birthDate}
          onSave={async (data) => {
            await onUpdateBaseProfile(data);
            onClose();
          }}
          onCancel={onClose}
        />
      )}

      {activeTab === 'interests' && (
        <div className="max-h-[60vh] overflow-y-auto pr-1">
          <InterestsGrid
            selectedInterests={profile.tastes}
            onToggleInterest={onToggleInterest}
            isEditable
          />
        </div>
      )}

      {activeTab === 'sizes' && (
        <div className="max-h-[60vh] overflow-y-auto pr-1">
          <SizesSection sizes={profile.sizes} onSaveSize={onSaveSize} isEditable />
        </div>
      )}
    </Dialog>
  );
}
