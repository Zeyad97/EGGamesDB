# Security

## Reporting

Please do not disclose vulnerabilities in public issues. Email the maintainers at `security@eggamedb.com` with reproduction steps, impact, and affected versions. Do not include real user data or credentials. The maintainers should acknowledge reports within five business days and coordinate a fix and disclosure date with the reporter. If this address is not monitored, use GitHub's private vulnerability reporting for this repository.

## Risk register

| Finding | Severity | Status | Location / notes |
|---|---|---|---|
| Profile role and developer-status escalation | Critical | Mitigated, pending migration | `supabase/migrations/007_security_hardening.sql`; apply before relying on these protections. |
| Game moderation and forged ownership/metrics | Critical | Mitigated, pending migration | `supabase/migrations/007_security_hardening.sql`; developer deletion is limited to draft/rejected games. Owner resubmission (`draft↔pending`, `rejected→pending`, clearing `rejection_reason` only on resubmit) is enforced by `protect_game_fields` + `games_own_update`, and served by `PATCH /api/games/[id]` (owner/admin, 10/min, zod + sanitized). |
| Stored HTML injection in game descriptions | Critical | Fixed in application | `src/lib/security/sanitize-html.ts`; sanitized on game submission and render. Steam `detailed_description` is sanitized in `steamDataToGameFields`; `fetchSteamGameData` only fetches `https://store.steampowered.com/api/appdetails` for numeric app ids. |
| Vulnerable dependencies | Critical/high | Mitigated | Next and eslint-config-next at 16.4.2; direct `sharp@0.34.5` dependency removed (nothing in `src/` imports it; Next bundles sharp 0.35.5). `npm audit --omit=dev --audit-level=high` exits 0. |
| Public storage abuse | High | Mitigated, pending migration | Migration restricts upload roles, path, MIME types and size; check object ownership semantics after applying. |
| SECURITY DEFINER search path and function exposure | High | Mitigated, pending migration | `007_security_hardening.sql`; `get_user_role`/`is_admin_or_above` are explicitly granted to `anon` + `authenticated` so anon reads under `games_public_read_approved` (002) cannot fail with "permission denied for function". Anonymous view counting moved to `increment_view_count_server` (service-role only, approved games only). |
| Anonymous view-count bypass | High | Mitigated, pending migration | `increment_view_count` returns early for anon; the game page now counts logged-out views via `increment_view_count_server` through `createAdminClient()`, gated by `enforceRateLimit(headers, "view:"+id, 1, 900)`, fire-and-forget and never blocking render; demo games skipped. |
| Missing browser security headers | High | Mitigated | CSP is static and currently permits inline scripts for framework/JSON-LD compatibility; replace with nonce CSP after validating all route rendering. |
| Distributed API abuse | High | Mitigated | Upstash REST limiter for Steam/search/games submit/update and per-game view counting, with in-memory fail-open fallback; `EXPIRE … NX` keeps the original window, and client IP prefers `x-vercel-forwarded-for`, then `x-real-ip`, then the first `x-forwarded-for` hop. `enforceRateLimit` accepts a `Request` or `Headers`. |
| Admin user deletion left orphaned auth identity | Medium | Fixed in application | Super-admin-only `DELETE /api/admin/users/[id]`; database migration still needs application. |
| Origin/CSRF and input validation | Medium | Partially mitigated | Game POST, game PATCH (`/api/games/[id]`), and admin delete enforce same-origin/allowlisted Origin; PATCH accepts only `draft`/`pending` status and never `developer_id`/`reviewed_*`/`spotlight_at`/counters/`rejection_reason` from the body. Review remaining mutation routes as added. |
| User-generated content spam | Medium | Mitigated, pending migration | Insert rate triggers and contact field length checks are in migration. |
| Secrets / session / server route access | Medium | Reviewed | `.env*` is ignored; server pages for admin/dashboard/profile perform server-side authentication. Re-audit history before any secret exposure. |

## Future-proofing checklist

- Dependabot is configured weekly for npm and GitHub Actions in `.github/dependabot.yml`.
- CI runs `npm audit --omit=dev --audit-level=high`, lint, type-check, and build.
- Enable GitHub secret scanning and push protection; rotate any credential ever committed.
- Enable Supabase leaked-password protection and require MFA for all administrator accounts in the Supabase dashboard.
- Every new Supabase table must enable RLS and include explicit least-privilege policies in the same migration; test anon, authenticated, contributor, admin, and super-admin access.
- Review CSP reports and remove unnecessary external origins and inline-script allowances.
- Apply migrations in a staging project and execute `supabase/tests/security_check.sql` with disposable test accounts before production rollout.
