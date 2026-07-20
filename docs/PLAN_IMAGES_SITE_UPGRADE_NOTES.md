# Plan Images Site Upgrade Notes

This upgrade adds Cookie Mini Website Builder Gumroad plan graphics to the public website without touching the active builder workspace, checkout logic, Supabase tables, admin dashboard, customer dashboard, or AI Video Studio.

## Where the images appear

- Home page: a polished plan preview section using Starter, Business, and Premium graphics.
- Pricing page: individual plan graphics for Starter Pro, Business, Premium, and Extra Page Add-On.

## Important domain note

The full comparison graphic is included in `public/gumroad-plan-images/choose-your-plan-optional.png`, but it is not displayed by default because it mentions custom domains. Current launch sites use:

`customername.cookiesdigitalcreations.com`

Custom domain support can be added later as a Premium feature or paid add-on.

## No SQL needed

This update is visual and content-only. No Supabase SQL is needed.
