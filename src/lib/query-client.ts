import { QueryClient, focusManager, onlineManager } from '@tanstack/react-query';
import { addNetworkStateListener } from 'expo-network';
import { AppState, Platform } from 'react-native';

// Refetch stale queries when the app returns to the foreground.
if (Platform.OS !== 'web') {
  focusManager.setEventListener((handleFocus) => {
    const subscription = AppState.addEventListener('change', (state) => {
      handleFocus(state === 'active');
    });
    return () => subscription.remove();
  });
}

// Pause queries while offline and resume them when the connection returns.
onlineManager.setEventListener((setOnline) => {
  const subscription = addNetworkStateListener((state) => {
    setOnline(state.isConnected !== false);
  });
  return () => subscription.remove();
});

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
    mutations: {
      // Never retry writes automatically: sales and stock changes must not be sent twice
      // by the client. Idempotent retries are handled explicitly where needed.
      retry: false,
    },
  },
});
