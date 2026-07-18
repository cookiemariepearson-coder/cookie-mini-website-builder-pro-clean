Cookie Mini Website Builder Pro — Admin PIN Cleanup + Archive Fix

Upload this package to the CLEAN GitHub repo only:
cookie-mini-website-builder-pro-clean

What this fixes:
- The Admin PIN box stays blank when the page opens.
- The admin dashboard stays hidden until the PIN is entered.
- After the PIN is accepted, the Admin PIN form disappears.
- Adds Refresh Admin and Lock Admin buttons after login.
- Adds an Archive tab and Archive button as a safer delete-style option.
- Keeps permanent deletion out for now to avoid accidental customer-data loss.

Supabase:
Run this SQL in your Website Builder Supabase project if you have not already:
supabase/admin_pin_cleanup_archive_migration.sql

Then upload the inside files/folders, commit, and wait for Vercel Ready.
Test:
https://www.cookiesdigitalcreations.com/admin
