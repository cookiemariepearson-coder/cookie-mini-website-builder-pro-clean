'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { browserDraftDisplayName, validateBrowserDraftName } from '../lib/browserDraftBackups.mjs';

const FOCUSABLE = 'button:not([disabled]), input:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])';

export default function BrowserDraftDialog({ dialog, busy, error, onCancel, onConfirm, fallbackFocusRef }) {
  const titleId = useId();
  const descriptionId = useId();
  const panelRef = useRef(null);
  const cancelRef = useRef(null);
  const inputRef = useRef(null);
  const busyRef = useRef(busy);
  const onCancelRef = useRef(onCancel);
  const [draftName, setDraftName] = useState('');
  const [attempted, setAttempted] = useState(false);
  busyRef.current = busy;
  onCancelRef.current = onCancel;

  useEffect(() => {
    if (!dialog) return undefined;
    setDraftName(dialog.action === 'rename' ? browserDraftDisplayName(dialog.item) : '');
    setAttempted(false);
    const returnFocus = dialog.returnFocus;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const timer = window.setTimeout(() => {
      (dialog.action === 'rename' ? inputRef.current : cancelRef.current)?.focus();
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

  const renaming = dialog.action === 'rename';
  const deletingOne = dialog.action === 'delete';
  const deletingSelected = dialog.action === 'delete-selected';
  const count = Number(dialog.count || 0);
  const validation = renaming ? validateBrowserDraftName(draftName) : { ok: true };

  let title = 'Delete all browser draft backups?';
  let description = `Delete all ${count} browser draft backups from this browser? This cannot be undone. Your published and server-saved websites will not be deleted.`;
  let cancelLabel = 'Keep My Drafts';
  let confirmLabel = 'Delete All Drafts';
  if (renaming) {
    title = 'Rename this browser draft?';
    description = 'Choose a name that will help you recognize this backup. Its website content, template, saved time, and identity will stay the same.';
    cancelLabel = 'Keep Current Name';
    confirmLabel = 'Save Draft Name';
  } else if (deletingOne) {
    title = 'Delete this browser draft backup?';
    description = 'This removes the saved draft from this browser. It will not delete your published website, customer account, subscription, purchase, or AI Video.';
    cancelLabel = 'Keep My Draft';
    confirmLabel = 'Delete Draft';
  } else if (deletingSelected) {
    title = `Delete these ${count} browser draft backups?`;
    description = `Delete these ${count} browser draft backups? Your published and server-saved websites will not be deleted.`;
    cancelLabel = 'Keep My Drafts';
    confirmLabel = 'Delete Selected Drafts';
  }

  function submit() {
    setAttempted(true);
    if (renaming && !validation.ok) return;
    onConfirm(renaming ? validation.name : '');
  }

  return (
    <div className="websiteDialogBackdrop" role="presentation" onMouseDown={event => {
      if (event.target === event.currentTarget && !busy) onCancel();
    }}>
      <section
        className={`websiteDialog ${renaming ? '' : 'websiteDialogDanger'}`}
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
      >
        <span className="kicker">Browser Draft Backup</span>
        <h2 id={titleId}>{title}</h2>
        <p id={descriptionId}>{description}</p>
        {renaming && (
          <>
            <label htmlFor={`${titleId}-draft-name`}>Draft name</label>
            <input
              id={`${titleId}-draft-name`}
              ref={inputRef}
              value={draftName}
              onChange={event => {
                setDraftName(event.target.value);
                setAttempted(false);
              }}
              maxLength="80"
              autoComplete="off"
              aria-invalid={attempted && !validation.ok}
              aria-describedby={attempted && !validation.ok ? `${titleId}-error` : undefined}
              disabled={busy}
            />
            {attempted && !validation.ok && <p id={`${titleId}-error`} className="websiteDialogError" role="alert">{validation.error}</p>}
          </>
        )}
        {error && <p className="websiteDialogError" role="alert">{error}</p>}
        <div className="websiteDialogActions">
          <button ref={cancelRef} className="btn light" type="button" onClick={onCancel} disabled={busy}>{cancelLabel}</button>
          <button className={renaming ? 'btn' : 'btn danger'} type="button" onClick={submit} disabled={busy}>
            {busy ? (renaming ? 'Saving…' : 'Deleting…') : confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}
