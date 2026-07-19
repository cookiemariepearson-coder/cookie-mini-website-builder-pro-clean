# Cookie Mini Website Builder Pro — HeyGen Real Video Beta Pack

Upload these inside files/folders to the clean GitHub repo only:

```text
cookie-mini-website-builder-pro-clean
```

This pack adds:

- Server API route: `/api/heygen/create`
- Server API route: `/api/heygen/status`
- Updated `/video-studio` page
- Protected real HeyGen video generation button
- HeyGen status checker
- HeyGen MP4/video link display when ready
- Keeps creative kit mode in place

## Required

You already added:

```text
HEYGEN_API_KEY
```

Redeploy after upload.

## Safety

The real video button asks for an AI Video Access Code. It uses `HEYGEN_VIDEO_ACCESS_CODE` if you add it, otherwise it uses `ADMIN_PIN`.

This prevents random visitors from using your paid HeyGen credits.

## Test

After Vercel says Ready, open:

```text
https://www.cookiesdigitalcreations.com/video-studio
```

Fill out the form, check the credit warning box, enter your access code, click Generate Real Video with HeyGen, then click Check Video Status until the MP4 is ready.
