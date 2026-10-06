'use client';
import { useEffect, useState } from 'react';
import Script from 'next/script';
import { usePathname } from 'next/navigation';
import { Button } from './ui/button';
export function Analytics(): JSX.Element | null {
  const pathname = usePathname();
  const [consent, setConsent] = useState<string | null>(null);
  const approved =
    process.env.NODE_ENV !== 'production' && process.env.NEXT_PUBLIC_ANALYTICS_APPROVED === 'true';
  const sensitive = ['/apply', '/login', '/register', '/dashboard'].some((path) =>
    pathname.startsWith(path),
  );
  useEffect(() => {
    setConsent(localStorage.getItem('pharaspay-analytics'));
  }, []);
  function choose(value: string): void {
    localStorage.setItem('pharaspay-analytics', value);
    setConsent(value);
    if (value === 'denied') window.location.reload();
  }
  if (!approved || sensitive) return null;
  const ga = /^G-[A-Z0-9]+$/.test(process.env.NEXT_PUBLIC_GA_ID ?? '')
    ? process.env.NEXT_PUBLIC_GA_ID
    : undefined;
  const pixel = /^\d+$/.test(process.env.NEXT_PUBLIC_META_PIXEL_ID ?? '')
    ? process.env.NEXT_PUBLIC_META_PIXEL_ID
    : undefined;
  return (
    <>
      {consent === null ? (
        <aside
          aria-label="Analytics preferences"
          className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-xl rounded-card border bg-white p-5 shadow-card"
        >
          <p className="text-sm">
            Optional analytics help us improve public pages. Application and account pages are
            excluded. You can decline or withdraw consent.
          </p>
          <div className="mt-4 flex gap-3">
            <Button onClick={() => choose('accepted')}>Accept analytics</Button>
            <Button variant="outline" onClick={() => choose('denied')}>
              Decline
            </Button>
          </div>
        </aside>
      ) : (
        <button
          className="fixed bottom-3 left-3 z-30 rounded-lg border bg-white p-2 text-xs"
          onClick={() => choose('denied')}
        >
          Withdraw analytics consent
        </button>
      )}
      {consent === 'accepted' && ga && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${ga}`}
            strategy="afterInteractive"
          />
          <Script id="ga-init">{`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)};gtag('js',new Date());gtag('config','${ga}',{send_page_view:false,allow_google_signals:false,allow_ad_personalization_signals:false});gtag('event','page_view',{page_location:location.origin+location.pathname,page_title:document.title});`}</Script>
        </>
      )}
      {consent === 'accepted' && pixel && (
        <Script id="meta-init">{`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${pixel}');fbq('track','PageView');`}</Script>
      )}
    </>
  );
}
