import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes in milliseconds
const WARNING_TIME = 2 * 60 * 1000; // Warn 2 minutes before expiration

export function useSessionManagement() {
  const navigate = useNavigate();

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    let warningId: NodeJS.Timeout;
    let lastActivity = Date.now();

    const resetTimer = () => {
      lastActivity = Date.now();
      
      // Clear existing timers
      if (timeoutId) clearTimeout(timeoutId);
      if (warningId) clearTimeout(warningId);

      // Set warning timer
      warningId = setTimeout(() => {
        toast.warning('Your session will expire in 2 minutes due to inactivity', {
          duration: 10000,
        });
      }, SESSION_TIMEOUT - WARNING_TIME);

      // Set logout timer
      timeoutId = setTimeout(async () => {
        await supabase.auth.signOut();
        toast.error('Session expired. Please log in again.');
        navigate('/auth');
      }, SESSION_TIMEOUT);
    };

    const handleActivity = () => {
      // Only reset if session is still active
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          resetTimer();
        }
      });
    };

    // Activity listeners
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    events.forEach(event => {
      document.addEventListener(event, handleActivity);
    });

    // Start timer on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        resetTimer();
      }
    });

    // Monitor auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        resetTimer();
      } else if (event === 'SIGNED_OUT') {
        if (timeoutId) clearTimeout(timeoutId);
        if (warningId) clearTimeout(warningId);
      }
    });

    // Cleanup
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
      if (timeoutId) clearTimeout(timeoutId);
      if (warningId) clearTimeout(warningId);
      subscription.unsubscribe();
    };
  }, [navigate]);
}
