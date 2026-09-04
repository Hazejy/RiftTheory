declare global {
    interface Window {
        dataLayer: any[];
    }
}

export function setupAnalytics() {
    // Keep upstream call sites compatible, without collecting or sending events.
    window.gtag = () => undefined;
}
