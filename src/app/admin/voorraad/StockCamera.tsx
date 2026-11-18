'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './keyforcars.module.css';
import { usePreviewLanguage } from '../PreviewLanguage';

export default function StockCamera({ onPhoto, onClose }: { onPhoto: (file: File) => void; onClose: () => void }) {
  const { t } = usePreviewLanguage();
  const dialog = useRef<HTMLDialogElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const filePicker = useRef<HTMLInputElement>(null);
  const active = useRef(false);
  const [ready, setReady] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [message, setMessage] = useState('Camera openen…');

  useEffect(() => {
    const modal = dialog.current;
    modal?.showModal();
    active.current = true;
    let cancelled = false;
    let stream: MediaStream | undefined;
    async function openCamera() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setMessage('Livecamera vereist HTTPS. Gebruik de telefooncamera of kies een foto.');
        return;
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false });
        if (cancelled || !video.current) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        video.current.srcObject = stream;
        await video.current.play();
      } catch (error) {
        stream?.getTracks().forEach((track) => track.stop());
        if (!cancelled) {
          setMessage(error instanceof DOMException && error.name === 'NotAllowedError'
            ? 'Sta cameratoegang toe in je browser of kies een foto.'
            : 'De camera is niet beschikbaar. Kies een foto.');
        }
      }
    }
    queueMicrotask(() => { if (!cancelled) void openCamera(); });
    return () => {
      cancelled = true;
      active.current = false;
      stream?.getTracks().forEach((track) => track.stop());
      modal?.close();
    };
  }, []);

  function capture() {
    const frame = video.current;
    if (!frame?.videoWidth || !frame.videoHeight || capturing) return;
    const canvas = document.createElement('canvas');
    canvas.width = frame.videoWidth;
    canvas.height = frame.videoHeight;
    const context = canvas.getContext('2d');
    if (!context) return;
    setCapturing(true);
    context.drawImage(frame, 0, 0);
    canvas.toBlob((blob) => {
      if (!active.current) return;
      if (blob) onPhoto(new File([blob], `keyforcars-${Date.now()}.jpg`, { type: 'image/jpeg' }));
      else { setCapturing(false); setMessage('Foto maken mislukt. Probeer het opnieuw.'); }
    }, 'image/jpeg', .92);
  }

  return (
    <dialog ref={dialog} className={styles.camera} aria-labelledby="stock-camera-title" onCancel={onClose}>
      <h2 id="stock-camera-title">Camera</h2>
      <video ref={video} muted playsInline autoPlay hidden={!ready} onCanPlay={() => { setReady(true); setMessage(''); }} />
      <p role="status" hidden={!message}>{t(message)}</p>
      <input ref={filePicker} type="file" accept="image/*" capture="environment" hidden onChange={(event) => {
        const file = event.target.files?.[0];
        if (file) onPhoto(file);
      }} />
      <div className={styles.labelActions}>
        <button type="button" className={styles.secondary} onClick={onClose}>{t("Sluiten")}</button>
        <button type="button" className={styles.secondary} onClick={() => filePicker.current?.click()}>{t("Telefooncamera / foto kiezen")}</button>
        <button type="button" className={styles.primary} disabled={!ready || capturing} onClick={capture}>{t("Foto maken")}</button>
      </div>
    </dialog>
  );
}
