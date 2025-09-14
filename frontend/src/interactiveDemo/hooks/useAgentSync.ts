import { useEffect } from 'react';
import { useDemoState } from '../state/demoStateProvider';
import { websocketClient } from '../websocket/websocketClient';

export const useAgentSync = () => {
  const demoState = useDemoState();

  useEffect(() => {
    // Set the demo state in the WebSocket client so it can update state
    websocketClient.setDemoState(demoState);

    // Cleanup on unmount
    return () => {
      websocketClient.setDemoState(null);
    };
  }, [demoState]);

  return {
    // Expose any additional sync functionality if needed
    isConnected: true, // You could track WebSocket connection status here
  };
};
