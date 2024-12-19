'use client';
import mixpanel from 'mixpanel-browser';
import React, { createContext, useContext, useEffect } from 'react';

const MixpanelContext = createContext<typeof mixpanel | null>(null);

export const useMixpanel = () => {
  return useContext(MixpanelContext);
};

// Near entry of your product, init Mixpanel
mixpanel.init('5f26ca7d00ab18a4738448a4bcaf2bc6', {
  debug: true,
  track_pageview: true,
  persistence: 'localStorage',
});

export function MixpanelProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const test = window.location.hostname !== 'funding.raylac.com';

    mixpanel.register({
      test,
    });
  }, []);

  return (
    <MixpanelContext.Provider value={mixpanel}>
      {children}
    </MixpanelContext.Provider>
  );
}
