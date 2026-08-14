'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { websiteDeletionConfirmationMatches, websiteDisplayName } from '../lib/customerWebsiteManagement.mjs';

const FOCUSABLE = 'button:not([disabled]), input:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])';

export default function WebsiteManagementDialog({ dialog, busy, error, onCancel, onConfirm, fallbackFocusRef }) {
  const titleId = useId();
  const descriptionId = useId();
  const panelRef = useRef(null);
  const cancelRef = useRef(null);
  const inputRef = useRef(null);
  const busyRef = useRef(busy);
  const onCancelRef = useRef(onCancel);
  const [confirmation, setConfirmation] = useState('');
  busyRef.current = busy;
  onCancelRef.current = onCancel;

  useEffect(() => {
    if (!dialog) return undefined;
    setConfirmation('');
    const returnFocus = dialog.returnFocus;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const timer = window.setTimeout(() => {
      (dialog.action === 'delete' ? inputRef.current : cancelRef.current)?.focus();
    }, 0);

    function handleKeyDown(event) {
      if (event.key === 'Escape' && !busyRef.current) {
        event.preventDefault();
        onCancelRef.current();
        return;
      }
      if (event.key !== 'Tab') return;
      const focusable = [...(panelRef.current?.querySelectorAll(FOCUSABLE) || [])];
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      window.setTimeout(() => {
        if (returnFocus?.isConnected) returnFocus.focus();
        else fallbackFocusRef?.current?.focus();
      }, 0);
    };
  }, [dialog, fallbackFocusRef]);

  if (!dialog) return null;

  const name = websiteDisplayName(dialog.site);
  const deleting = dialog.action === 'delete';
  const confirmationValid = !deleting || websiteDeletionConfirmationMatches(dialog.site, confirmation);

  return (
    <div className="websiteDialogBackdrop" role="presentation" onMouseDown={event => {
      if (event.target === event.currentTarget && !busy) onCancel();
    }}>
      <section
        className={`websiteDialog ${deleting ? 'websiteDialogDanger' : ''}`}
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
      >
        <span className="kicker">Manage Website</span>
        <h2 id={titleId}>{deleting ? 'Delete this website?' : 'Unpublish this website?'}</h2>
        {deleting ? (
          <>
            <p id={descriptionId}>This removes the website from public access and My Websites. Its content moves to protected, recoverable Trash. This does not cancel your subscription or delete your account.</p>
            <div className="websiteDialogNotice">
              <strong>Your other information stays safe.</strong>
              <p>Purchases, subscription and payment records, other websites, AI Videos, and unrelated customer data are not deleted. Contact support if you need this website recovered; no automatic permanent purge occurs.</p>
            </div>
            <label htmlFor={`${titleId}-confirmation`}>Type <strong>{name}</strong> to confirm</label>
            <input
              id={`${titleId}-confirmation`}
              ref={inputRef}
              value={confirmation}
              onChange={event => setConfirmation(event.target.value)}
              autoComplete="off"
              aria-invalid={Boolean(confirmation) && !confirmationValid}
              disabled={busy}
            />
            {confirmation && !confirmationValid && <p className="websiteDialogError" role="alert">The website name does not match.</p>}
          </>
        ) : (
          <p id={descriptionId}>Unpublish this website? Visitors will no longer be able to open it, but your website and content will remain saved. You can edit and publish it again later.</p>
        )}
        {error && <p className="websiteDialogError" role="alert">{error}</p>}
        <div className="websiteDialogActions">
          <button ref={cancelRef} className="btn light" type="button" onClick={onCancel} disabled={busy}>
            {deleting ? 'Keep My Website' : 'Keep Website Published'}
          </button>
          <button
            className={deleting ? 'btn danger' : 'btn'}
            type="button"
            onClick={() => onConfirm(confirmation)}
            disabled={busy || !confirmationValid}
          >
            {busy ? (deleting ? 'Deleting…' : 'Unpublishing…') : (deleting ? 'Delete Website' : 'Unpublish Website')}
          </button>
        </div>
      </section>
    </div>
  );
}
