import { create } from 'zustand';

export const useAppStore = create((set) => ({
  loadingProgress: 0,
  isLoadingComplete: false,
  isMuted: true,
  currentStatusStep: 'Preparing Experience...',
  
  // Maintenance configuration states
  isMaintenanceMode: false,
  maintenanceData: null,
  
  setLoadingProgress: (progress) => set({ loadingProgress: progress }),
  setIsLoadingComplete: (complete) => set({ isLoadingComplete: complete }),
  setIsMuted: (muted) => set({ isMuted: muted }),
  setStatusStep: (step) => set({ currentStatusStep: step }),
  
  // Method to programmatically trigger maintenance mode
  GoToMaintenance: () => set({ isMaintenanceMode: true }),
  
  // Fetch config from the public JSON file
  fetchMaintenanceConfig: async () => {
    try {
      const response = await fetch('/maintenance-config.json');
      if (response.ok) {
        const data = await response.json();
        set({ 
          isMaintenanceMode: data.isMaintenanceMode ?? false,
          maintenanceData: data 
        });
      }
    } catch (error) {
      console.warn('Failed to load maintenance config from public JSON', error);
    }
  },

  incrementProgress: (amount) => set((state) => {
    const nextProgress = Math.min(state.loadingProgress + amount, 100);
    let nextStep = state.currentStatusStep;
    
    if (nextProgress < 30) {
      nextStep = 'Preparing Experience...';
    } else if (nextProgress < 60) {
      nextStep = 'Loading Assets...';
    } else if (nextProgress < 85) {
      nextStep = 'Building Magic...';
    } else {
      nextStep = 'Optimizing Experience...';
    }
    
    return {
      loadingProgress: nextProgress,
      currentStatusStep: nextStep,
      isLoadingComplete: nextProgress === 100,
    };
  }),
}));
