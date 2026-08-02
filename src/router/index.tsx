import { useState } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/layouts/AppLayout';
import { RootLayout } from '@/layouts/RootLayout';
import { OnboardingCarousel } from '@/features/auth/components/OnboardingCarousel';
import { TelegramAuthGuard } from '@/features/auth/components/TelegramAuthGuard';
import { GiftProfileView } from '@/features/profile/components/GiftProfileView';
import { CircleList } from '@/features/circle/components/CircleList';
import { CircleDetailsView } from '@/features/circle/components/CircleDetailsView';
import { MemberProfileView } from '@/features/circle/components/MemberProfileView';

export function AppRouter() {
  const navigate = useNavigate();
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean>(() => {
    return localStorage.getItem('leor_onboarding_completed') === 'true';
  });

  const handleCompleteOnboarding = () => {
    localStorage.setItem('leor_onboarding_completed', 'true');
    setHasCompletedOnboarding(true);
    navigate('/profile');
  };

  return (
    <Routes>
      <Route element={<RootLayout />}>
        {/* Onboarding route */}
        <Route
          path="/onboarding"
          element={
            <OnboardingCarousel onComplete={handleCompleteOnboarding} />
          }
        />

        {/* Authenticated App Routes */}
        <Route element={<AppLayout />}>
          <Route
            path="/profile"
            element={
              !hasCompletedOnboarding ? (
                <Navigate to="/onboarding" replace />
              ) : (
                <TelegramAuthGuard>
                  {({ userId, profileId }) => (
                    <GiftProfileView userId={userId} profileId={profileId} />
                  )}
                </TelegramAuthGuard>
              )
            }
          />

          <Route
            path="/circles"
            element={
              <TelegramAuthGuard>
                {({ userId }) => <CircleList currentUserId={userId} />}
              </TelegramAuthGuard>
            }
          />

          <Route
            path="/circles/:id"
            element={
              <TelegramAuthGuard>
                {({ userId }) => <CircleDetailsView currentUserId={userId} />}
              </TelegramAuthGuard>
            }
          />

          <Route
            path="/profile/:id"
            element={
              <TelegramAuthGuard>
                {() => <MemberProfileView />}
              </TelegramAuthGuard>
            }
          />
        </Route>

        {/* Default redirect */}
        <Route
          path="*"
          element={
            hasCompletedOnboarding ? (
              <Navigate to="/profile" replace />
            ) : (
              <Navigate to="/onboarding" replace />
            )
          }
        />
      </Route>
    </Routes>
  );
}
