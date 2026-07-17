Cookie Mini Website Builder Pro - Admin Tabs Force Fix

This is a focused fix for the admin page still showing everything in one long page.

What it changes:
- Replaces /admin with Admin Plan Management v2.
- Shows visible tabs immediately after the PIN card.
- Separates Websites, Plans & Status, Admin Notes, and How to Use.
- Adds support for saving admin_notes through /api/admin/update.

Steps:
1. Run supabase/admin_plan_management_migration.sql in Supabase SQL Editor.
2. Upload the inside files/folders to GitHub.
3. Commit changes.
4. Wait for Vercel to say Ready.
5. Open https://www.cookiesdigitalcreations.com/admin
6. You should see the title: Admin Plan Management v2.

If you do not see "Admin Plan Management v2", you are still viewing an old deployment or old cached page.
