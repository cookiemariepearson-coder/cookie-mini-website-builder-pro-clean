'use client';

import Link from 'next/link';
import { AccountAction, useAccountModal } from './AccountModalProvider';

export default function CustomerHeroAccountPrompt() {
  const { accountState } = useAccountModal();

  if (accountState === 'checking') {
    return <div className="heroAccountPrompt" role="status">Checking your secure account…</div>;
  }

  if (accountState === 'signed-in') {
    return <div className="heroAccountPrompt">
      <span>Welcome back!</span>
      <Link className="heroTextAction" href="/customer">Open My Websites</Link>
    </div>;
  }

  return <div className="heroAccountPrompt">
    <span>New customer?</span>
    <AccountAction className="heroTextAction" destination="/customer" mode="create">Create your free account</AccountAction>
    <span aria-hidden="true">·</span>
    <span>Returning customer?</span>
    <AccountAction className="heroTextAction" destination="/customer" mode="signin">Sign in</AccountAction>
  </div>;
}
