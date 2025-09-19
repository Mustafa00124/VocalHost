import { useEffect } from 'react';
import { useDemoState } from '../state/demoStateProvider';
// WebSocket import removed - using HTTP API

export const useAgentSync = () => {
  const demoState = useDemoState();

  useEffect(() => {
    // State sync removed - using HTTP API
    console.log('🎯 Agent sync initialized (HTTP mode)');
  }, [demoState]);

  return {
    // Expose any additional sync functionality if needed
    isConnected: true, // HTTP API is always available
  };
};
