const listeners: Array<(state: any) => void> = [];

const NetInfo = {
  addEventListener: (callback: (state: any) => void) => {
    listeners.push(callback);
    return () => {
      const idx = listeners.indexOf(callback);
      if (idx >= 0) listeners.splice(idx, 1);
    };
  },
  fetch: async () => ({ isConnected: true, isInternetReachable: true, type: 'wifi' }),
};

export default NetInfo;


