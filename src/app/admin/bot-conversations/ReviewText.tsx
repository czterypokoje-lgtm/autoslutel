'use client';

import { usePreviewLanguage } from '../PreviewLanguage';

export function ReviewText({ en, nl }: { en: string; nl: string }) {
  const { english } = usePreviewLanguage();
  return english ? en : nl;
}

export function ReviewDate({ value }: { value: string }) {
  const { english } = usePreviewLanguage();
  return <time dateTime={value}>{new Intl.DateTimeFormat(english ? 'en-GB' : 'nl-NL', {
    dateStyle: 'medium', timeStyle: 'short', timeZone: 'Europe/Amsterdam',
  }).format(new Date(value))}</time>;
}
