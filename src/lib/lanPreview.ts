import { CRM_PREVIEW } from '@/lib/supabase/env';

/**
 * DEMO ONLY: lets a phone on the home Wi-Fi open the local preview.
 *
 * Switched on by PREVIEW_LAN_HOST (ip:port) plus a long PREVIEW_LAN_TOKEN in
 * .env.local. While it is on, every visitor needs the token cookie, this Mac
 * included: the Host header can be faked, so "it says localhost" is no proof.
 * The link with ?k=<token> sets an 8-hour cookie once.
 */
const HOST = process.env.PREVIEW_LAN_HOST ?? '';
const TOKEN = process.env.PREVIEW_LAN_TOKEN ?? '';
export const LAN_COOKIE = 'kfc_lan_preview';

export const lanMode = () => CRM_PREVIEW && process.env.NODE_ENV === 'development' && HOST !== '' && TOKEN.length >= 20;

export function lanTokenMatches(value: string | null) {
  if (value === null || value.length !== TOKEN.length) return false;
  let difference = 0;
  for (let i = 0; i < TOKEN.length; i++) difference |= value.charCodeAt(i) ^ TOKEN.charCodeAt(i);
  return difference === 0;
}

export function hasLanCookie(cookieHeader: string | null) {
  const cookie = (cookieHeader ?? '').split(/;\s*/).find((part) => part.startsWith(`${LAN_COOKIE}=`));
  return lanTokenMatches(cookie ? cookie.slice(LAN_COOKIE.length + 1) : null);
}

export const lanToken = () => TOKEN;
