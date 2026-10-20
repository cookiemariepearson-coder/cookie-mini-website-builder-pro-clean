'use client';

import Link from 'next/link';
import { AccountAction, useAccountModal } from './AccountModalProvider';
import { customerWelcomeName } from '../lib/customerWelcome.mjs';

export default function CustomerHeroAccountPrompt() {
  const { accountState, accountEmail, accountDisplayName } = useAccountModal();

  if (accountState === 'checking') {
    return <div className="heroAccountPrompt" role="status">Checking your secure account…</div>;
  }

  if (accountState === 'signed-in') {
    return <div className="heroAccountPrompt">
      <span>Welcome back, {customerWelcomeName(accountDisplayName, accountEmail)}!</span>
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
