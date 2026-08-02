import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AppRouter } from '@/router';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppRouter />
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: '#17171A',
              border: '1px solid #26262B',
              color: '#F5F5F7',
              borderRadius: '16px',
            },
          }}
        />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
