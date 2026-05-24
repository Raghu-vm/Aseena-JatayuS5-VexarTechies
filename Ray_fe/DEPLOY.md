# Deploying RAY to the cloud

This is a Next.js 16 App Router project. It works on any platform that runs
Node.js, but the smoothest deploys are Vercel, Railway, Render, and Fly.io.

## Before deploying

1. **Generate a real Gmail App Password** for `connectwithvexar@gmail.com`:
   - https://myaccount.google.com/security → turn on 2-Step Verification
   - https://myaccount.google.com/apppasswords → create one named "RAY"
   - Save the 16-char code somewhere safe; you'll paste it as `EMAIL_PASSWORD`.

2. **Decide your production URL.** You need to know this before deploying
   so emails embed a working image URL. Examples:
   - Vercel: `https://ray-yourname.vercel.app`
   - Custom domain: `https://app.vexar.tech`

3. **Local sanity check.** Run `pnpm install && pnpm build && pnpm start` once
   to confirm the production build works on your machine.

## Environment variables to set on the cloud platform

| Name              | Required | Example value                       | Notes                                                    |
| ----------------- | -------- | ----------------------------------- | -------------------------------------------------------- |
| `EMAIL_USER`      | yes      | `connectwithvexar@gmail.com`        | Gmail account that sends OTPs                            |
| `EMAIL_PASSWORD`  | yes      | `xkrt qfsg ezhq lwve`               | 16-char Gmail App Password (spaces stripped automatically) |
| `PUBLIC_BASE_URL` | yes      | `https://ray-yourname.vercel.app`   | Used for absolute image URLs in emails                   |
| `NODE_ENV`        | auto     | `production`                        | Set by the platform; do not override                     |

**Never commit your `.env.local`.** It is already in `.gitignore`.

## Vercel (easiest)

1. Push the project to GitHub.
2. Go to https://vercel.com/new → import the repo.
3. In the Vercel project's **Settings → Environment Variables**, add the 3
   variables from the table above. Make sure to apply them to **Production**,
   **Preview**, and **Development** environments.
4. Click **Deploy**. Done.
5. After the first deploy, copy the `*.vercel.app` URL, paste it back into
   `PUBLIC_BASE_URL`, and redeploy so emails carry the correct image URL.

## Railway / Render / Fly.io

1. Push to GitHub.
2. Create a new Web Service / app, pointing at the repo.
3. **Build command:** `pnpm install && pnpm build`
4. **Start command:** `pnpm start`
5. **Port:** Next.js binds to `$PORT` automatically.
6. Set the same 3 environment variables from the table above.
7. Deploy.

## After deployment — verify it works

1. Open your deployed site, click **Sign In** → use one of the seeded users:
   - `admin` / `admin123` → admin dashboard
   - `executive` / `exec123` → executive dashboard
   - `john.smith` / `emp123` → employee dashboard
2. Click **Get Started** → sign up with a real email → check your inbox for
   the OTP. The RAY mascot image should render (no broken-image icon).
3. Check the server logs:
   - ✅ `[OTP] Email sent to ...: 250 2.0.0 OK ...`
   - ❌ `[OTP] Failed to send email: ... 535-5.7.8 ...` → wrong `EMAIL_PASSWORD`

## If OTP emails go to spam

This is a Gmail behavior, not a bug in the app. Fixes (in order of impact):

1. **Train Gmail once per recipient.** Move the first email out of Spam →
   click "Report not spam" → "Filter messages like this" → "Never send to Spam".
   After this, future emails to that recipient land in inbox.
2. **Use a real transactional service for production.** Free Gmail-to-Gmail
   sending is fine for dev but Gmail aggressively spam-filters it. Switch to:
   - **Resend** (https://resend.com) — easiest, generous free tier
   - **SendGrid** (https://sendgrid.com)
   - **Postmark** (https://postmarkapp.com)

   To switch, only `lib/emailService.ts` needs to change; the API contract
   from the routes stays the same.

## Data persistence note

Users created via the signup flow are stored in the **browser's localStorage**
(under the key `ray_users`). This means each user can only sign in from the
same browser on the same device where they signed up. For real
production usage, replace `lib/auth-data.ts`'s storage with a database
(Postgres + Prisma, Supabase, or PlanetScale are good options).
