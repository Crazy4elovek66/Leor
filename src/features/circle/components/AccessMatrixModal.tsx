import { Dialog } from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCircleAccess } from '../hooks/useCircleAccess';
import { SECTION_LABELS, type ProfileSection } from '../types';
import { Shield, Check, Lock } from 'lucide-react';

interface AccessMatrixModalProps {
  isOpen: boolean;
  onClose: () => void;
  circleId: string;
  circleName: string;
  profileId: string;
}

const SECTIONS: ProfileSection[] = ['BASIC_INFO', 'INTERESTS', 'SIZES', 'WISHLIST', 'MEMORIES'];

export function AccessMatrixModal({
  isOpen,
  onClose,
  circleId,
  circleName,
  profileId,
}: AccessMatrixModalProps) {
  const { grantedSections, isLoading, toggleSectionAccess } = useCircleAccess(circleId, profileId);

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title={`Доступ к профилю для "${circleName}"`}>
      <div className="space-y-4">
        <div className="flex items-center space-x-2 text-xs text-[#A1A1AA] bg-[#26262B]/50 p-3 rounded-2xl">
          <Shield className="w-4 h-4 text-[#D8B4B0] shrink-0" />
          <span>
            Управляйте видимым содержимым вашей карты. Участники этого круга увидят только отмеченные разделы.
          </span>
        </div>

        {isLoading ? (
          <div className="space-y-2 py-4">
            <div className="h-14 bg-[#26262B] rounded-2xl animate-pulse" />
            <div className="h-14 bg-[#26262B] rounded-2xl animate-pulse" />
          </div>
        ) : (
          <div className="space-y-2">
            {SECTIONS.map((secKey) => {
              const meta = SECTION_LABELS[secKey];
              const isGranted = grantedSections.includes(secKey);
              const isDisabled = meta.disabled;

              return (
                <Card
                  key={secKey}
                  onClick={() => !isDisabled && toggleSectionAccess(secKey)}
                  className={`p-4 bg-[#17171A] border-[#26262B] transition-all flex items-center justify-between ${
                    isDisabled
                      ? 'opacity-50 cursor-not-allowed'
                      : 'cursor-pointer hover:border-[#D8B4B0]/50'
                  }`}
                >
                  <div className="pr-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-semibold text-[#F5F5F7]">{meta.label}</span>
                      {isDisabled && (
                        <Badge variant="outline" className="text-[9px] text-[#A1A1AA] border-[#383843]">
                          Скоро
                        </Badge>
                      )}
                    </div>
                    <p className="text-[11px] text-[#A1A1AA] mt-0.5">{meta.description}</p>
                  </div>

                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center border transition-all shrink-0 ${
                      isDisabled
                        ? 'border-[#26262B] bg-[#17171A]'
                        : isGranted
                        ? 'bg-[#D8B4B0] border-[#D8B4B0] text-[#0F0F10]'
                        : 'border-[#383843] bg-[#26262B]'
                    }`}
                  >
                    {isDisabled ? (
                      <Lock className="w-3 h-3 text-[#71717A]" />
                    ) : isGranted ? (
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    ) : null}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </Dialog>
  );
}
