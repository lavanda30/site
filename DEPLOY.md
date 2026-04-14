# 🚀 LAVANDA — Deployment & Setup Guide

> Last updated: 2026-03-27

---

## Overview

The site has two audiences:

| Audience | Access | What they see |
|----------|--------|---------------|
| **Customers** | Anyone | Public landing page — hero, collections, configurator, CTA |
| **Agents** | Salesforce login required | Same site + embedded CRM panel (contacts, curtains, canvas image) |

---

## STEP 1 — Host the website

Deploy the `website/` folder to any static hosting provider.

### Option A — Netlify (recommended, free)

1. Go to [netlify.com](https://netlify.com) → **Add new site → Deploy manually**
2. Drag & drop the entire `website/` folder
3. Note the URL, e.g. `https://lavanda-curtains.netlify.app/`
4. Optional: add a custom domain in **Site settings → Domain management**

### Option B — GitHub Pages

```bash
# In your GitHub repo settings:
Settings → Pages → Source: Deploy from branch
Branch: main  /  folder: /website
```

Resulting URL: `https://your-username.github.io/lavanda/`

### Option C — Vercel

1. Push code to GitHub
2. Import repo in [vercel.com](https://vercel.com)
3. Set **Root Directory** to `website`

### Option D — Local dev server (for testing only)

```bash
# VS Code Live Server, or:
npx serve website
# or
python -m http.server 5500 --directory website
```

---

## STEP 2 — Create a Salesforce Connected App

This enables OAuth login for agents.

1. Go to **Salesforce Setup** → search **"App Manager"**
2. Click **New Connected App** (top right)

Fill in:

| Field | Value |
|-------|-------|
| Connected App Name | `LAVANDA Website` |
| API Name | `LAVANDA_Website` |
| Contact Email | your SF admin email |

3. ✅ **Enable OAuth Settings**

| OAuth Field | Value |
|-------------|-------|
| Callback URL | `https://your-site.com/` ← your real domain **+ trailing slash** |
| | `http://localhost:5500/` ← add this too for local dev |
| Selected OAuth Scopes | `Access and manage your data (api)` |
| | `Perform requests on your behalf at any time (refresh_token, offline_access)` |

4. ✅ **Enable for Device Flow** — leave unchecked  
5. Click **Save** → wait **2–10 minutes** for activation

6. On the next page click **Manage Consumer Details** (requires MFA confirmation)  
   → Copy the **Consumer Key** (a long string like `3MVG9...`)

---

## STEP 3 — Paste Consumer Key into the site

Open `website/shared/sf-api.js` and set `consumerKey`:

```javascript
const SF_CONFIG = {
    consumerKey: '3MVG9xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',  // ← paste here
    loginUrl: 'https://login.salesforce.com',
    // ...
};
```

> For **Sandbox** org: change `loginUrl` to `'https://test.salesforce.com'`

Re-deploy the updated `sf-api.js` file.

---

## STEP 4 — Configure CORS in Salesforce

Without this, browser API calls from the website to Salesforce will be blocked.

1. **Setup** → search **"CORS"**
2. Click **New**
3. Origin URL Pattern: `https://your-site.com` (no trailing slash)
4. Add another: `http://localhost:5500` (for local dev)
5. Save

---

## STEP 5 — Check Agent permissions in Salesforce

Agents must have access to the custom objects and fields used by the site.

### Objects needed

| Object | Required permissions |
|--------|----------------------|
| `Contact__c` | Read, Create, Edit |
| `Curtain__c` | Read, Create, Edit |
| `ContentVersion` | Create (for saving canvas images) |
| `ContentDocumentLink` | Create |

### How to verify

1. **Setup → Object Manager → Contact__c → Fields & Relationships**  
   Ensure all fields used in the CRM form have **Read** (and **Edit** where needed) in the agent's Profile or Permission Set.

2. **Setup → Profiles → [Agent Profile] → Object Settings**  
   Set `Contact__c` and `Curtain__c` to **Read, Create, Edit** *(Delete is optional)*.

3. If using a **Permission Set** instead of Profile:  
   **Setup → Permission Sets → [Your Set] → Object Settings** → same as above.

---

## STEP 6 — Verify the Connected App is accessible to agents

1. **Setup → App Manager → LAVANDA Website → Manage**
2. Under **Profiles** click **Manage Profiles**
3. Add the agent's profile (e.g. `Standard User` or a custom profile)
   — OR use **Permission Sets** under **Manage Permission Sets**

---

## STEP 7 — Test end-to-end

### Customer test
1. Open `https://your-site.com/`
2. Confirm: no "Агент" button visible after login — it's always shown (but inconspicuous)
3. Configurator works, consultation form works

### Agent test
1. Open `https://your-site.com/`
2. Click **🔒 Агент** button (top-right of nav)
3. SF login page opens → authenticate
4. Redirected back to site with `#access_token=...` in URL
5. Nav shows: **CRM** link + agent name + logout button
6. CRM panel appears below testimonials
7. Create a contact → verify it appears in Salesforce
8. Create a curtain → verify trigger fires and calculates fields
9. Preview canvas image → Download PNG
10. Save image to SF → verify file attached to `Curtain__c`

---

## Troubleshooting

| Problem | Cause | Fix |
|---------|-------|-----|
| OAuth redirect shows "invalid_client_id" | Wrong Consumer Key | Check `sf-api.js` → `consumerKey` |
| Redirect to wrong URL after login | Callback URL mismatch | SF Connected App → Callback URLs must include `https://your-site.com/` (with trailing slash) |
| API calls blocked (CORS error) | CORS not configured | Step 4 above — add site origin in SF CORS settings |
| "Session expired" immediately | Connected App not activated yet | Wait 10 min after creating, then test again |
| Contacts/Curtains not loading | Permission issue | Check agent Profile object permissions (Step 5) |
| Sandbox org | Login URL wrong | Change `loginUrl` to `https://test.salesforce.com` in `sf-api.js` |

---

## Summary checklist

```
SALESFORCE:
  [ ] Connected App created
  [ ] Consumer Key copied → pasted into sf-api.js
  [ ] Callback URL: https://your-site.com/ (exact match, trailing slash)
  [ ] OAuth Scopes: api + refresh_token
  [ ] CORS entry: https://your-site.com
  [ ] Agent Profile: Read/Create/Edit on Contact__c and Curtain__c
  [ ] Connected App accessible to agent Profile/PermSet

WEBSITE:
  [ ] website/ folder deployed to hosting
  [ ] sf-api.js → consumerKey filled in
  [ ] sf-api.js → loginUrl correct (prod vs sandbox)
  [ ] Custom domain configured (optional)

TESTING:
  [ ] Guest view: no CRM visible
  [ ] Agent login: OAuth redirect works
  [ ] Agent CRM: contacts load
  [ ] Agent CRM: curtain save + trigger recalculation visible
  [ ] Canvas PNG download works
```

