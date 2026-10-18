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
   - `http://localhost:3000/**`

The register page currently does not pass `emailRedirectTo`; Supabase therefore chooses the redirect from its configured Site URL/default redirect behavior. Set the Site URL and allowed redirect URLs above. For explicit routing later, pass `emailRedirectTo` to `auth.signUp` and point it at an implemented confirmation callback on the live domain.

## Set the sender name and address

Configure custom SMTP in **Authentication → SMTP Settings**. For example, use Resend and set the sender to `EGGameDB <noreply@eggamedb.com>`. Verify `eggamedb.com` with Resend, then add the exact SPF, DKIM, and any DMARC DNS records Resend supplies to Porkbun's DNS management before enabling sending. Confirm the domain and sender are verified in Resend.

Supabase's built-in email service is heavily rate-limited (only a few emails per hour) and must not be used in production. Use verified custom SMTP for production email.
