# EGGameDB Supabase Auth email templates

## Paste templates and subjects

In Supabase Dashboard, open **Authentication → Email Templates**. For each template below, paste the matching HTML file from this directory into its template body and paste the English and Arabic subject line into the subject field (Supabase supports one subject per send; the provided combined subject includes both languages):

| Template | File | Subject (EN + AR) |
|---|---|---|
| Confirm signup | `confirm-signup.html` | Confirm your EGGameDB account \| أكّد حسابك في EGGameDB |
| Magic link | `magic-link.html` | Your EGGameDB sign-in link \| رابط تسجيل الدخول إلى EGGameDB |
| Reset password | `reset-password.html` | Reset your EGGameDB password \| أعد تعيين كلمة مرور EGGameDB |
| Change email | `change-email.html` | Confirm your new EGGameDB email \| أكّد بريدك الإلكتروني الجديد في EGGameDB |
| Invite user | `invite.html` | You are invited to EGGameDB \| تمت دعوتك إلى EGGameDB |
| Reauthentication | `reauthentication.html` | Your EGGameDB verification code \| رمز التحقق الخاص بك في EGGameDB |

The templates use Supabase's `{{ .ConfirmationURL }}`, `{{ .Token }}`, `{{ .Email }}`, and `{{ .NewEmail }}` variables. Keep those placeholders unchanged.

## Configure URLs

1. In Supabase Dashboard, open **Authentication → URL Configuration**.
2. Set **Site URL** to `https://www.eggamedb.com`.
3. Add these **Redirect URLs**:
   - `https://www.eggamedb.com/**`
   - `https://www.eggamedb.com/api/auth/callback`
   - `http://localhost:3000/**`

The registration flow passes `emailRedirectTo` to the implemented `/api/auth/callback` route. Keep the Site URL and allowed Redirect URLs above in sync with the deployed domain.

## Confirmation link does nothing

In Supabase Dashboard, open **Authentication → URL Configuration**. Set **Site URL** to `https://www.eggamedb.com` (with `www`, not the bare domain) and add `https://www.eggamedb.com/**` to **Redirect URLs**. A mismatch can send confirmation links to the bare domain, where the browser's PKCE verifier may not be available.

## Forgot password

The forgot-password flow sends users through the PKCE callback at `/api/auth/callback`, then returns them to the password reset form. Install the **Reset password** email template from `reset-password.html` so recovery emails use the correct confirmation link.

## Set the sender name and address

Configure custom SMTP in **Authentication → SMTP Settings**. For example, use Resend and set the sender to `EGGameDB <noreply@eggamedb.com>`. Verify `eggamedb.com` with Resend, then add the exact SPF, DKIM, and any DMARC DNS records Resend supplies to Porkbun's DNS management before enabling sending. Confirm the domain and sender are verified in Resend.

Supabase's built-in email service is heavily rate-limited (only a few emails per hour) and must not be used in production. Use verified custom SMTP for production email.
