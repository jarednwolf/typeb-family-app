import { useEffect } from 'react';
import { useAppSelector, useAppDispatch } from './redux';
import { selectUser } from '../store/slices/authSlice';
import { selectFamily } from '../store/slices/familySlice';
import realtimeSyncService from '../services/realtimeSync';

/**
 * Hook to manage real-time sync initialization
 * Automatically starts/stops sync based on auth and family state
 */
export const useRealtimeSyncManager = () => {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser);
  const family = useAppSelector(selectFamily);

  useEffect(() => {
    if (!user) {
      // No user, cleanup sync
      realtimeSyncService.cleanup();
      return;
    }

    // Set dispatch for the service
    realtimeSyncService.setDispatch(dispatch);

    // Initialize sync with user and family
    const familyId = family?.id || null;
    realtimeSyncService.initialize(user.uid, familyId);

    // Cleanup on unmount
    return () => {
      realtimeSyncService.cleanup();
    };
  }, [user, family?.id, dispatch]);
};