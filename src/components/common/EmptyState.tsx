import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export function EmptyState({ title, description, actionText, onAction, icon }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 rounded-[24px] border border-[#26262B] bg-[#17171A] my-4">
      {icon && <div className="mb-4 text-[#D8B4B0] p-4 bg-[#D8B4B0]/10 rounded-full">{icon}</div>}
      <h3 className="text-base font-semibold text-[#F5F5F7] mb-1">{title}</h3>
      <p className="text-xs text-[#A1A1AA] leading-relaxed max-w-xs mb-6">{description}</p>
      {actionText && onAction && (
        <Button variant="primary" size="md" onClick={onAction}>
          {actionText}
        </Button>
      )}
    </div>
  );
}
