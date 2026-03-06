import { supabase } from './supabase';

export interface UTMParams {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
}

export const captureUTMParams = (): UTMParams => {
  const params = new URLSearchParams(window.location.search);

  const utmParams: UTMParams = {
    utm_source: params.get('utm_source') || undefined,
    utm_medium: params.get('utm_medium') || undefined,
    utm_campaign: params.get('utm_campaign') || undefined,
    utm_term: params.get('utm_term') || undefined,
    utm_content: params.get('utm_content') || undefined,
  };

  if (utmParams.utm_source || utmParams.utm_medium || utmParams.utm_campaign) {
    sessionStorage.setItem('utm_params', JSON.stringify(utmParams));
  }

  return utmParams;
};

export const getStoredUTMParams = (): UTMParams => {
  const stored = sessionStorage.getItem('utm_params');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return {};
    }
  }
  return {};
};

export const trackUTM = async (prospectId: string, leadId?: string) => {
  try {
    const utmParams = getStoredUTMParams();

    if (!utmParams.utm_source && !utmParams.utm_medium && !utmParams.utm_campaign) {
      return;
    }

    const { error } = await supabase.from('utm_tracking').insert({
      prospect_id: prospectId,
      lead_id: leadId || null,
      utm_source: utmParams.utm_source,
      utm_medium: utmParams.utm_medium,
      utm_campaign: utmParams.utm_campaign,
      utm_term: utmParams.utm_term,
      utm_content: utmParams.utm_content,
      landing_page: window.location.pathname,
      referrer: document.referrer || null,
      ip_address: null,
      user_agent: navigator.userAgent,
    });

    if (error) {
      console.error('Error tracking UTM:', error);
    }
  } catch (error) {
    console.error('Error tracking UTM:', error);
  }
};

export const clearUTMParams = () => {
  sessionStorage.removeItem('utm_params');
};

export const getLeadUTMFields = () => {
  const utmParams = getStoredUTMParams();

  return {
    utm_source: utmParams.utm_source || null,
    utm_medium: utmParams.utm_medium || null,
    utm_campaign: utmParams.utm_campaign || null,
    utm_term: utmParams.utm_term || null,
    utm_content: utmParams.utm_content || null,
    landing_page: window.location.pathname || null,
    referrer_url: document.referrer || null,
  };
};
