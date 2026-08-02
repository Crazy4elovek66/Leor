import { Outlet } from 'react-router-dom';

export function RootLayout() {
  return (
    <div className="min-h-screen bg-[#0F0F10] text-[#F5F5F7] selection:bg-[#D8B4B0] selection:text-[#0F0F10]">
      <Outlet />
    </div>
  );
}
