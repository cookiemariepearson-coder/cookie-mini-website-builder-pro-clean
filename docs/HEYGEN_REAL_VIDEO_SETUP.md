# HeyGen Real Video Integration Setup

This pack connects Cookie AI Video Studio to HeyGen Video Agent beta.

## Required Vercel Environment Variable

You already added:

```text
HEYGEN_API_KEY
```

This should be your HeyGen API key from HeyGen Settings → API.

## Optional Safety Variable

The real video button is protected so public visitors cannot burn through HeyGen API credits.

By default, the app uses your existing `ADMIN_PIN` as the AI Video access code.

If you want a separate code, add this in Vercel:

```text
HEYGEN_VIDEO_ACCESS_CODE
```

Then redeploy.

## How the Video Flow Works

1. Customer or owner fills out AI Video Studio form.
2. The app creates the normal creative kit.
3. Owner/customer checks the real-video confirmation box.
4. They enter the access code.
5. The server sends the video prompt to HeyGen using `HEYGEN_API_KEY`.
6. HeyGen returns a Video Agent session ID.
7. The app lets the user check status until a video URL is ready.
8. When ready, the page shows the MP4 link and video preview.

## Testing

After upload and Vercel Ready:

```text
https://www.cookiesdigitalcreations.com/video-studio
```

Use your ADMIN_PIN or HEYGEN_VIDEO_ACCESS_CODE when testing the real generation button.

## Important

Real HeyGen video generation uses paid API credits. Keep this protected until the Cookie Credits system is built.
