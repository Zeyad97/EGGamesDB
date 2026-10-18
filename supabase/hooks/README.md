# Sign-up limit: 2 accounts per network

This keeps one network (your home, one phone connection, one cafe) from creating more than 2 EGGameDB accounts. It runs inside Supabase, so it applies to every sign-up, including people who skip the website.

Do these steps in order. You only do them once.

## (a) Run migration 011 in the SQL editor

1. Open the Supabase Dashboard for EGGameDB, then **SQL Editor** → **New query**.
2. Open the file `supabase/migrations/011_signup_ip_limit.sql` from this project, copy everything in it, and paste it into the editor.
3. Click **Run**. It should finish with no red error. Running it again later is also safe.

## (b) Connect the hook

1. In the Dashboard, open **Authentication** → **Hooks**.
2. Click **Before User Created**.
3. For the hook type, choose **Postgres function**.
4. Set **Schema** to `public` and **Function** to `hook_before_user_created`.
5. Click **Create** (or **Save**).

## (c) Test it

1. Open a private/incognito window on the network you are using (for example, your home Wi-Fi).
2. Go to the register page and sign up with three different emails (for example `test1@yourmail.com`, `test2@yourmail.com`, `test3@yourmail.com`).
3. The first two should work and ask you to verify your email. The third should show: "Too many accounts have been created from this network. Each network can create up to 2 accounts."
4. Clean up: in the Dashboard, open **Authentication** → **Users**, select the test users, and delete them. Deleting a user frees its slot right away. A sign-up that never became an account (for example a mistyped email) frees its slot by itself after one hour.

## (d) Allow your own network (so you are never blocked)

1. Find your public IP address. Search for "what is my IP" in a browser and copy the address it shows (for example `1.2.3.4`).
2. In **SQL Editor**, run this, replacing `1.2.3.4` with your address:

```sql
INSERT INTO public.signup_ip_allowlist(ip_hash, note)
VALUES (public.signup_ip_hash('1.2.3.4'), 'owner home');
```

Your network is never limited after this. If your internet provider changes your address, repeat this step with the new one.

## (e) Change the limit

The limit is the number on the line `max_accounts int := 2;` in `supabase/migrations/011_signup_ip_limit.sql`. To change it (for example to 3):

1. Change the number in that file, then copy the whole file into the **SQL Editor** and click **Run** again.
2. Nothing is deleted when you do this. Existing accounts stay as they are.

## (f) Honest limits of this

- **Shared networks.** People on the same school, office, mobile-carrier, or cafe network share one address. The 3rd person on that network will be refused, even if they did nothing wrong. Ask them to try again later or use another network.
- **VPNs and mobile data switching.** A person can get a new address with a VPN or by switching to mobile data, so this is a deterrent, not a guarantee.
- **IPv6.** A single home connection usually gets a whole block of addresses. The limit counts each /64 block as one network, so one household is counted once.
- **Mistyped emails.** A sign-up attempt that never becomes an account (for example, a mistyped email such as `gmial.com`) holds one of the 2 slots for 1 hour, then is released. An account that was created, even if its email was never confirmed, keeps its slot until the account is deleted.
- **Privacy.** Only a one-way hash of the address is stored, never the address itself. The hash is deleted when the account is deleted. The privacy page explains this to users.

## (g) Turn the hook off if it causes trouble

If sign-ups stop working or too many real people are blocked:

1. Open **Authentication** → **Hooks** in the Dashboard.
2. Open **Before User Created** and **remove** the hook (or switch it off). Sign-ups go back to normal right away.

Turning it off does not delete the data. Turn it back on with step (b) later.
