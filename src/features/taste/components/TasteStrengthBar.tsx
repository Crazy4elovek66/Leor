interface TasteStrengthBarProps {
  weight: number; // Range 0.00 to 1.00
  label?: string;
}

export function TasteStrengthBar({ weight, label }: TasteStrengthBarProps) {
  const percentage = Math.min(100, Math.max(0, Math.round(weight * 100)));

  return (
    <div className="w-full space-y-1">
      {label && (
        <div className="flex justify-between items-center text-[10px]">
          <span className="text-[#A1A1AA]">{label}</span>
          <span className="font-mono text-[#D8B4B0] font-bold">{percentage}%</span>
        </div>
      )}
      <div className="w-full h-1.5 bg-[#26262B] rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-[#D8B4B0]/60 to-[#D8B4B0] rounded-full transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
