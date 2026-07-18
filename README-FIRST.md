# Cookie Mini Website Builder Pro — Background Feel + Owner Test Cleanup

Upload this package to the **clean GitHub repo only**:

`cookie-mini-website-builder-pro-clean`

What this fixes:

- Removes **Open Final Launch Test** from the customer builder flow.
- Keeps `/launch-test` as an owner/admin testing page only.
- Improves the **Background feel** choices so they look different:
  - Gradient glow
  - Dark luxury
  - Soft light
  - Pattern / art
- Adds stronger pattern/art backgrounds with decorative artwork based on the website type.
- Keeps checkout routes, drafts, customer dashboard, admin dashboard, and AI Video Studio flow unchanged.

No Supabase SQL is needed.

After Vercel says Ready, test:

- `/builder`
- Step 3 Design → Background feel → try all 4 options
- Confirm Pattern / art looks different and shows richer decorative artwork
- Confirm Final Launch Test is no longer shown inside the customer builder

AI Video Studio real video connection is not included in this patch. It requires choosing an API provider and adding that provider API key to Vercel.
