import React from 'react';

export function TelegramSafeContainer({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`w-full max-w-md mx-auto min-h-screen flex flex-col pt-[calc(env(safe-area-inset-top,24px)+24px)] pb-[calc(env(safe-area-inset-bottom,16px)+76px)] px-4 ${className}`}>
      {children}
    </div>
  );
}
