# Frontend Backend Handoff

## 1. Project Overview

### What this app does

Salex is a single-page Next.js frontend for creating one listing and sharing it across multiple marketplace platforms. The current frontend is fully client-side and stores all app state in memory inside [`app/page.tsx`](/c:/Users/user/Downloads/salex-main/app/page.tsx).

The app currently covers:

- onboarding
- language selection
- user registration profile entry
- marketplace/platform connection
- package selection
- listing creation
- image attachment
- publish progress
- listing management
- analytics display
- profile and support

There is no real backend integration yet:

- no API calls
- no persistent auth/session
- no persistent database storage
- no real media upload
- no real publish integration

### Main user goal

The main user goal is:

1. enter profile information
2. connect at least one marketplace account
3. create a listing
4. attach at least 3 images
5. publish the listing to connected platforms
6. manage listings and subscription/package limits

### Main modules/pages/screens

- `start`
- `language`
- `onboarding`
- `registration`
- `platformActivation`
- `platformConnection`
- `registrationSuccess`
- `dashboard`
- `createListing`
- `imageUpload`
- `sharePlan`
- `shareProgress`
- `listingSuccess`
- `myListings`
- `statistics`
- `packages`
- `profile`
- `support`

### App architecture notes

- There is only one real page route: [`app/page.tsx`](/c:/Users/user/Downloads/salex-main/app/page.tsx).
- Screen changes are handled by local React state, not URL routing.
- Bottom navigation only appears on `dashboard`, `myListings`, `packages`, `statistics`, and `profile`.
- A Telegram Mini App provider exists in [`components/providers/TelegramMiniAppProvider.tsx`](/c:/Users/user/Downloads/salex-main/components/providers/TelegramMiniAppProvider.tsx), but it only calls Telegram UI setup methods and does not provide auth or identity.

## 2. Screen-by-Screen Breakdown

### Start Screen

**Purpose**

Landing screen introducing Salex and supported marketplace concept.

**What user can do**

- see the app value proposition
- tap `START`

**What data is shown**

- static title/subtitle
- static marketplace icon list

**Actions / buttons**

- `START`

**What happens after each action**

- `START` -> navigates to `language`

---

### Language Screen

**Purpose**

Choose active UI language.

**What user can do**

- choose Azerbaijani
- choose Russian
- choose English
- go back to start

**What data is shown**

- current selected language state

**Actions / buttons**

- back button
- language cards

**What happens after each action**

- back -> `start`
- selecting a language updates `LanguageContext`
- after a 300ms delay, selection always navigates to `onboarding`

Important current behavior:

- language selection is not persisted anywhere
- switching language from profile also sends the user back into the onboarding flow

---

### Onboarding Screen

**Purpose**

Short transitional onboarding splash.

**What user can do**

- wait for auto-advance
- go back to language screen

**What data is shown**

- static onboarding illustration
- localized title/subtitle

**Actions / buttons**

- back button

**What happens after each action**

- back -> `language`
- after 3 seconds automatically -> `registration`

---

### Registration Screen

**Purpose**

Collect base profile data before platform connection.

**What user can do**

- enter full name
- enter phone number
- choose account type
- continue if required fields are filled

**What data is shown**

- existing in-memory profile if already present

**Actions / buttons**

- back button
- account type cards
- `Continue`

**What happens after each action**

- back -> `onboarding`
- selecting account type updates local screen state
- `Continue` saves trimmed `fullName`, `phone`, and `accountType` into global profile state
- then navigates to `platformActivation`

Current validation:

- only checks `fullName` non-empty
- only checks `phone` non-empty
- no format validation
- no backend verification here

---

### Platform Activation Screen

**Purpose**

Show connectable platforms, current plan unlocks, and connection status.

**What user can do**

- on first pass: connect at least one platform
- on later passes: view connected platforms, connect more unlocked platforms, view locked platforms, continue after at least one connection

**What data is shown**

- unlocked platforms based on active package
- locked platforms based on active package
- connected platforms

**Actions / buttons**

- back button
- platform cards
- `Continue` when at least one platform is already connected

**What happens after each action**

- back -> `registration`
- tapping an unlocked platform -> `platformConnection`
- after at least one successful connection, screen switches from "step 1" view to management view
- `Continue` -> `registrationSuccess`

Current business behavior:

- `basic` unlocks `Tap.az` and `Lalafo`
- `premium` and `premiumPlus` also unlock `Alan.az`, `Laylo.az`, `Birja.com`
- locked platforms are displayed but not interactive

---

### Platform Connection Screen

**Purpose**

Mock phone/OTP connection flow for a marketplace account.

**What user can do**

- enter a phone number
- request an OTP
- enter a 4-digit OTP
- finish connection

**What data is shown**

- target platform name
- current step: `phone`, `otp`, or `success`

**Actions / buttons**

- back button
- `Send verification code`
- `Verify`
- `Done`

**What happens after each action**

- back -> returns to `platformActivation` or `sharePlan`, depending on where user came from
- `Send verification code` -> step changes from `phone` to `otp`
- `Verify` -> step changes from `otp` to `success`
- `Done` -> calls success handler, marks platform as connected in global state, returns to caller screen

Current behavior notes:

- OTP is fully mocked
- there is no resend timer logic
- there is no backend validation
- the phone used here is not linked to the profile phone automatically

---

### Registration Success Screen

**Purpose**

Confirmation screen after at least one platform is connected.

**What user can do**

- start creating the first listing

**What data is shown**

- success state
- optional lock hint if listing limit is already reached

**Actions / buttons**

- `Create your first listing`

**What happens after each action**

- normal case -> starts listing creation
- if listing limit has been reached -> opens package upgrade flow instead of create flow

---

### Dashboard Screen

**Purpose**

Main home screen showing current limit state and recent listings.

**What user can do**

- see plan limit usage
- create a new listing
- open full listings list
- view recent listings
- navigate via bottom nav

**What data is shown**

- active listing limit
- active plan label
- active listing count
- recent listings
- publish success toast

**Actions / buttons**

- `Create new listing`
- `See all`
- bottom nav tabs

**What happens after each action**

- `Create new listing`
  - if below limit -> `createListing`
  - if at limit -> `packages` in limit-reached mode
- `See all` -> `myListings`
- bottom nav -> switches to selected tab screen

Current behavior notes:

- limit UI is based on active listing count, not a time window
- toast auto-hides after 3 seconds
- recent-listing action menu icon is visual only

---

### Create Listing Screen

**Purpose**

Collect listing data before image upload and publish planning.

**What user can do**

- choose category or category path
- fill common listing fields
- fill category-specific detail forms when applicable
- choose share platforms via checkboxes
- go to image upload

**What data is shown**

- current draft values
- category selector modal and many bottom-sheet selector flows
- common fields: category, price, city, description, images placeholder, share platforms

**Actions / buttons**

- back button
- category selector
- category-specific selectors/forms
- city select
- image upload entry box
- platform checkboxes
- `Publish Listing` button

**What happens after each action**

- back button -> navigates directly to `dashboard`
- image upload box -> saves current draft to global state, navigates to `imageUpload`
- `Publish Listing` button
  - validates special vehicle detail forms if current category uses them
  - saves current draft to global state
  - navigates to `imageUpload`

#### Common fields

- `category`
- `price`
- `city`
- `description`
- `platforms`

The main button is disabled until:

- `category` exists
- `price` exists
- `city` exists
- `description` exists

Special detail validation is enforced only on button click, not on button enabled state.

#### Category selector behavior

The visible category tree currently exposes two main roots:

- `Electronics`
- `Real estate`

Visible electronics subtrees include:

- phones and accessories
- smartphones
- feature phones
- smart watches and bands
- headphones
- phone accessories
- tablets
- laptops
- TVs
- audio systems and speakers
- gaming consoles and gaming accessories
- cameras and camcorders

Visible real-estate subtrees include:

- apartments
- villas / country houses
- land
- commercial properties / offices
- garages

Current category storage behavior:

- the frontend stores category as a display path string joined with `" ->"` visually shown as `" → "`
- many category-specific selector values are appended into the same category string
- there is no stable category ID in current frontend state

#### Dedicated vehicle detail forms

Three dedicated detail payloads exist in frontend state:

- `carDetails`
- `motorcycleDetails`
- `vehiclePartDetails`

These are the only category-specific details stored as structured objects.

Current code behavior:

- cars require at least `brand` to continue
- motorcycles require a more complete form
- vehicle parts require a more complete form

Important ambiguity:

- dedicated car, motorcycle, and vehicle-part flows exist in code and publish logic
- they are not clearly reachable from the current visible category tree data in `CreateListingScreen`

#### Other category-specific selectors

There are many bottom-sheet selector chains that append attributes into the category string for device and real-estate flows, for example:

- storage
- RAM
- color
- condition
- delivery
- TV screen size / resolution / Smart TV
- audio type / connection / power
- camera type / resolution
- refrigerator type / volume / no-frost / energy class
- washing machine type / capacity / spin speed
- dishwasher type / capacity / energy class
- AC type / BTU / area coverage
- vacuum type / power / bag type
- microwave type / capacity / power
- small appliance type / power
- real-estate location / area / room count / condition / repair state

Important current implementation detail:

- many of these selector chains exist in code
- several are unreachable because the category tree never opens them
- several real-estate selectors are explicitly disabled with `false && ...`

Disabled selector screens include:

- apartment floor
- total floors
- apartment features
- villa features
- property type
- object features
- land purpose
- documents
- garage type
- owner info

#### Share platform checkbox behavior

The screen lets the user select one or more platforms via checkboxes.

However, current publish behavior later uses all currently connected unlocked platforms, not the checkbox selection, because `SharePlanScreen` publishes `connectedSharePlatforms` instead of `draftListing.platforms`.

This is an important current frontend/backend ambiguity.

---

### Image Upload Screen

**Purpose**

Collect listing images before publish planning.

**What user can do**

- add up to 6 images
- remove images
- continue only after at least 3 images

**What data is shown**

- 6 image slots
- current images
- helper text showing how many more images are needed

**Actions / buttons**

- back button
- empty image slot
- delete image button
- `Continue`

**What happens after each action**

- back -> `createListing`
- clicking an empty slot -> generates a mock image URL and inserts it
- delete icon -> removes that image
- `Continue` -> `sharePlan`

Current behavior notes:

- images are mock `picsum.photos` URLs, not uploaded files
- max images is 6
- min required to continue is 3
- UI copy mentions drag-and-drop reorder, but current implementation does not support reordering

---

### Share Plan Screen

**Purpose**

Show platform-level publish readiness and allow last-minute connection.

**What user can do**

- review connected / not connected / locked platform states
- connect a missing unlocked platform
- publish

**What data is shown**

- all share platforms
- each platform status:
  - `connected`
  - `notConnected`
  - `locked`
- premium banner when premium tiers have unlocked but not yet connected platforms
- limit indicator

**Actions / buttons**

- back button
- per-platform `Connect`
- premium banner action
- publish button
- connection modal buttons: `Log in`, `Later`

**What happens after each action**

- back -> `imageUpload`
- connecting a platform -> opens `platformConnection`, then returns to `sharePlan`
- publish button
  - disabled when there are no connected unlocked platforms
  - if limit reached for a new listing, opens `packages` limit view
  - otherwise stores publish target platforms and navigates to `shareProgress`

Current behavior notes:

- locked platforms are plan-gated only
- the screen does not allow per-platform publish toggling
- actual publish target is all connected unlocked platforms

---

### Share Progress Screen

**Purpose**

Display a mock publish-progress sequence.

**What user can do**

- wait for completion
- retry a failed platform if failure state ever appears

**What data is shown**

- per-platform status:
  - `waiting`
  - `processing`
  - `success`
  - `failed`

**Actions / buttons**

- `Retry` for failed rows

**What happens after each action**

- processing auto-advances one platform at a time every 1.3 seconds
- after final success, screen auto-calls completion after 700ms

Current behavior notes:

- no failure is currently generated by the flow
- retry UI exists but is not reached in normal execution

---

### Listing Success Screen

**Purpose**

Show successful publish confirmation and platform links.

**What user can do**

- open platform links
- view listing list
- return to dashboard

**What data is shown**

- listing title
- published platform list

**Actions / buttons**

- external platform links
- `View Listing`
- `Go to dashboard`

**What happens after each action**

- external link -> opens platform URL in new tab
- `View Listing` -> `myListings`
- `Go to dashboard` -> `dashboard`

Current behavior notes:

- link mapping only exists for `Tap.az`, `Lalafo`, and `Telegram`
- other platform names fall back to `#`

---

### My Listings Screen

**Purpose**

View and manage all current listings.

**What user can do**

- view all listings
- edit a listing
- repost a listing
- delete a listing

**What data is shown**

- image
- title
- formatted price
- city
- description
- status badge
- platform badges

**Actions / buttons**

- `Edit`
- `Repost`
- `Delete`

**What happens after each action**

- `Edit` -> loads listing into draft, goes to `createListing`
- `Repost`
  - if limit reached -> `packages` limit view
  - else clones listing with a new ID/date and goes to `listingSuccess`
- `Delete` -> removes listing from state

Current behavior notes:

- listing action menu icon is visual only
- all created listings currently have status `active`
- there is no UI to mark listings `sold` or `archived`

---

### Statistics Screen

**Purpose**

Show analytics derived from listing data and package entitlement.

**What user can do**

- view summary stats
- view platform bar chart
- view top-performing listings

**What data is shown**

- total views
- active listing count
- views by platform chart
- top-performing listing
- advanced analytics for premium tiers

**Actions / buttons**

- no primary data-changing actions

**What happens after each action**

- none

Current behavior notes:

- analytics are mock/generated on the client
- `premium` and `premiumPlus` show advanced analytics
- `basic` shows only a hint card

Generated metrics use formulas based on:

- number of platforms
- image count
- title length
- description length

So backend analytics can be delayed if exact parity is not required immediately.

---

### Packages Screen

**Purpose**

Show package options and allow instant package activation.

**What user can do**

- view plan cards
- activate a different plan
- when limit reached, view paid plans in a special mode

**What data is shown**

- active plan
- plan pricing copy
- plan feature copy

**Actions / buttons**

- back button
- plan action buttons

**What happens after each action**

- back -> `dashboard`
- selecting a plan immediately changes active plan in global state
- after selection:
  - if user came here from create flow due to limit -> returns to `createListing`
  - otherwise -> `dashboard`

Current behavior notes:

- there is no payment step
- plan activation is immediate
- limit-reached mode hides the basic card and emphasizes paid tiers

---

### Profile Screen

**Purpose**

View/edit profile and access settings-related destinations.

**What user can do**

- view profile
- edit full name, phone, account type
- open language screen
- open packages
- open support
- open platform activation
- logout

**What data is shown**

- profile info
- active plan
- connected platforms
- support lane presentation based on package

**Actions / buttons**

- `Edit`
- `Cancel`
- `Save`
- language card
- active plan card
- help/support card
- connect platforms card
- `Log out`

**What happens after each action**

- `Edit` -> enters inline edit mode
- `Save` -> trims fields and writes back to global profile state
- language -> `language`
- packages -> `packages`
- support -> `support`
- connect platforms -> `platformActivation`
- logout -> resets the entire in-memory app state and returns to `start`

---

### Support Screen

**Purpose**

Submit and review support requests.

**What user can do**

- view whether support is priority or standard
- submit a support request
- review previous requests

**What data is shown**

- support lane card
- request form
- request list

**Actions / buttons**

- back button
- `Send request`

**What happens after each action**

- back -> `profile`
- `Send request`
  - requires non-empty subject and message
  - creates a new in-memory support request
  - clears the form

Current behavior notes:

- requests have no backend status updates
- all submitted requests are shown as queued
- priority/standard lane is based only on current plan

## 3. Main User Flows

### Listing creation flow

1. User reaches `dashboard` or `registrationSuccess`.
2. User taps `Create new listing`.
3. App checks package listing limit.
4. If limit is reached:
   - user is redirected to package upgrade flow
   - if they came from the create-start action, the app remembers to resume create flow after upgrade
5. If limit is not reached:
   - a fresh draft is created
   - user goes to `createListing`
6. User fills:
   - category
   - price
   - city
   - description
   - optional category-specific attributes
   - share-platform checkboxes
7. User taps `Publish Listing`.
8. App validates dedicated vehicle detail forms when relevant.
9. Draft is saved to global state.
10. User goes to `imageUpload`.
11. User adds at least 3 images.
12. User taps `Continue`.
13. User goes to `sharePlan`.

### OTP / phone verification flow

This frontend currently uses OTP only inside marketplace connection, not for app account login.

1. User taps an unlocked platform from `platformActivation` or `sharePlan`.
2. App opens `platformConnection`.
3. User enters a phone number.
4. User taps `Send verification code`.
5. UI moves to OTP step.
6. User enters 4 OTP digits.
7. User taps `Verify`.
8. UI moves to success step.
9. User taps `Done`.
10. App marks that platform as connected in in-memory state.
11. User returns to the originating screen.

### Package selection flow

1. User opens `packages` either from bottom nav, profile, or limit-reached redirect.
2. User sees current plan highlighted.
3. User selects a different plan.
4. App immediately updates `activePlan`.
5. App filters current draft platforms to only those allowed by the new plan and currently connected.
6. App returns:
   - to `createListing` if `resumeCreateAfterUpgrade` was set
   - otherwise to `dashboard`

### Platform connection flow

1. User reaches `platformActivation`.
2. App computes available platforms from package entitlement.
3. User taps an unlocked platform.
4. User completes mocked phone/OTP flow.
5. Platform is added to `connectedPlatforms`.
6. User returns:
   - to `platformActivation` during onboarding/profile management
   - to `sharePlan` during publish preparation

### Publishing flow

1. User reaches `sharePlan`.
2. App shows connected, unlocked-not-connected, and locked platforms.
3. Publish button is enabled only if at least one unlocked connected platform exists.
4. User taps `Publish Listing`.
5. For new listings, app re-checks listing limit.
6. App stores publish target platforms.
7. User moves to `shareProgress`.
8. UI simulates sequential publish progress.
9. Completion handler creates or updates the listing in in-memory state.
10. Listing title is derived on the client.
11. Listing status is set to `active`.
12. User lands on `listingSuccess`.

Important current publish behavior:

- actual publish target is all connected unlocked platforms
- the platform checkboxes from `createListing` are not the final publish source

### Language switching flow

1. User opens `language` from start or profile.
2. User selects a language.
3. `LanguageContext` updates active language.
4. HTML `lang` and `data-language` attributes are updated.
5. After 300ms the app navigates to `onboarding`.
6. Onboarding then auto-advances to `registration`.

Important current behavior:

- language is not persisted
- switching language from profile does not return to profile

## 4. Form Fields and Inputs

### Global / profile fields

| Field name | Type | Required | Where it appears | What it affects |
| --- | --- | --- | --- | --- |
| `fullName` | text input | Required | Registration, Profile edit | User profile display and saved profile payload |
| `phone` | tel input | Required | Registration, Profile edit | User profile payload only |
| `accountType` | card selector / toggle buttons | Required | Registration, Profile edit | User profile payload |
| `language` | card selector | Required for selection action | Language screen | UI language only |

### Platform connection / OTP fields

| Field name | Type | Required | Where it appears | What it affects |
| --- | --- | --- | --- | --- |
| connection phone | tel input | Required to move forward | Platform Connection | Starts mocked OTP flow |
| `otp[0..3]` | 4 single-character inputs | Effectively required | Platform Connection | Moves UI to success state when user taps verify |

### Common listing fields

| Field name | Type | Required | Where it appears | What it affects |
| --- | --- | --- | --- | --- |
| `category` | modal selector / bottom-sheet flow | Required | Create Listing | Enables continue, drives category-specific UI, used in final listing |
| `price` | numeric input | Required | Create Listing | Stored in draft, formatted as `AZN` on listing creation |
| `city` | select | Required | Create Listing | Stored in listing, affects district options for motorcycles |
| `description` | textarea | Required | Create Listing | Stored in listing, used in title fallback logic |
| `images` | image slot actions | At least 3 required to continue | Image Upload | Required to move to share plan; stored in listing |
| `platforms` | checkbox list | Optional in UI, prefilled | Create Listing | Stored in draft, but not currently used as final publish source |

### Vehicle-specific structured fields

#### Car detail fields

| Field name | Type | Required | Where it appears | What it affects |
| --- | --- | --- | --- | --- |
| `carDetails.brand` | modal selector with search | Required | Car details form | Continue validation, title generation |
| `carDetails.color` | modal selector | Required | Car details form | Structured detail payload |
| `carDetails.engineVolume` | numeric input | Required | Car details form | Structured detail payload |
| `carDetails.fuelType` | modal selector | Required | Car details form | Structured detail payload |
| `carDetails.transmission` | modal selector | Required | Car details form | Structured detail payload |
| `carDetails.bodyType` | modal selector | Required | Car details form | Structured detail payload |
| `carDetails.year` | numeric input | Required | Car details form | Continue validation, title generation |

#### Motorcycle detail fields

| Field name | Type | Required | Where it appears | What it affects |
| --- | --- | --- | --- | --- |
| `motorcycleDetails.type` | modal selector | Required | Motorcycle details form | Continue validation |
| `motorcycleDetails.brand` | modal selector with search | Required | Motorcycle details form | Continue validation, title generation |
| `motorcycleDetails.model` | text input | Required | Motorcycle details form | Continue validation, title generation |
| `motorcycleDetails.engineVolume` | numeric input | Required | Motorcycle details form | Continue validation |
| `motorcycleDetails.year` | numeric input | Required | Motorcycle details form | Continue validation |
| `motorcycleDetails.mileage` | numeric input | Required | Motorcycle details form | Continue validation |
| `motorcycleDetails.isNew` | checkbox / switch | Optional | Motorcycle details form | Structured detail payload |
| `motorcycleDetails.district` | select or text input | Optional in completion check, visually important | Create Listing when motorcycle flow is active | Structured detail payload; depends on city |
| `motorcycleDetails.fuelType` | exists in state but not currently rendered in form | Not currently collected | Stored in state only | No visible effect today |
| `motorcycleDetails.transmission` | exists in state but not currently rendered in form | Not currently collected | Stored in state only | No visible effect today |
| `motorcycleDetails.color` | exists in state but not currently rendered in form | Not currently collected | Stored in state only | No visible effect today |
| `motorcycleDetails.condition` | exists in state but not currently rendered in form | Not currently collected | Stored in state only | No visible effect today |

#### Vehicle part detail fields

| Field name | Type | Required | Where it appears | What it affects |
| --- | --- | --- | --- | --- |
| `vehiclePartDetails.category` | modal selector | Required | Vehicle part details form | Continue validation |
| `vehiclePartDetails.compatibilityBrand` | modal selector | Required | Vehicle part details form | Continue validation |
| `vehiclePartDetails.compatibilityModel` | modal selector or text input | Required | Vehicle part details form | Continue validation |
| `vehiclePartDetails.productName` | text input | Required | Vehicle part details form | Continue validation, title generation |
| `vehiclePartDetails.condition` | modal selector | Required | Vehicle part details form | Continue validation |
| `vehiclePartDetails.delivery` | modal selector | Required | Vehicle part details form | Continue validation |

### Category-path attribute fields

These fields do not become dedicated structured objects. They are appended into the `category` display path string.

Important active examples:

- smartphone/tablet/laptop:
  - brand
  - model
  - storage
  - RAM
  - color
  - condition
  - delivery
- TV:
  - brand
  - model
  - screen size
  - resolution
  - smart TV yes/no
  - color
  - delivery
- audio:
  - brand
  - model
  - audio type
  - connection
  - power/output
  - color
  - delivery
- camera:
  - brand
  - model
  - device type
  - resolution
  - condition
  - color
  - delivery
- real estate:
  - location text
  - area
  - room count
  - real-estate condition
  - repair status
  - villa land area
  - garage area

Backend implication:

- most non-vehicle category attributes are currently packed into one `category` string path
- there is no separate typed payload for those attributes today

### Package and platform fields

| Field name | Type | Required | Where it appears | What it affects |
| --- | --- | --- | --- | --- |
| `activePlan` | card selection | Required for plan activation | Packages | Listing limit, platform unlocks, analytics visibility, support lane |
| `connectedPlatforms` | derived connection state | Required for publish readiness | Platform screens, Share Plan, Profile | Determines where user can publish |
| `publishingPlatforms` | derived internal array | Required to publish | Share Plan -> Share Progress | Final platform list for publish completion |

### Support fields

| Field name | Type | Required | Where it appears | What it affects |
| --- | --- | --- | --- | --- |
| `subject` | text input | Required | Support | Request creation |
| `message` | textarea | Required | Support | Request creation |

## 5. Frontend States

### Global app states

- `screen`
- `language`
- `activePlan`
- `profile`
- `connectedPlatforms`
- `listings`
- `draftListing`
- `supportRequests`

### Listing-related states

- draft exists / no draft
- editing existing listing / creating new listing
- image count below minimum
- image count ready to publish
- publish in progress
- publish complete
- publish limit reached
- active listing

### Connection states

- platform `connected`
- platform `notConnected`
- platform `locked`
- OTP phone step
- OTP entry step
- OTP success step

### Package / entitlement states

- `basic`
- `premium`
- `premiumPlus`
- package current / not current
- package screen default mode
- package screen limit-reached mode
- premium connection banner shown / hidden

### Button and validation states

- disabled create listing button when common required fields are missing
- disabled image-upload continue button until at least 3 images exist
- disabled publish button when no connected unlocked platforms exist
- inline validation shown for car form
- inline validation shown for motorcycle form
- inline validation shown for vehicle part form

### Analytics and support states

- advanced analytics enabled
- advanced analytics locked
- priority support lane
- standard support lane
- support request queued

### Status labels currently visible

- `loading` is not used as a general network state because there is no real backend
- `publishing`
- `processing`
- `waiting`
- `success`
- `failed` exists in publish-progress code but is not currently triggered

## 6. Business Logic Already Visible in Frontend

### Package limits

Frontend-enforced plan limits from [`lib/app-state.ts`](/c:/Users/user/Downloads/salex-main/lib/app-state.ts):

- `basic` -> limit `3`
- `premium` -> limit `10`
- `premiumPlus` -> `Infinity`

Important note:

- package marketing copy says `3 listings per day`, `10 listings per week`, and `unlimited listings`
- actual frontend enforcement is only based on current active listing count, not day/week/month windows

### Platform unlocking

- `basic` unlocks `Tap.az`, `Lalafo`
- `premium` unlocks all share platforms
- `premiumPlus` unlocks all share platforms

### Publishing rules

- user must have at least one connected unlocked platform to publish
- new listing publish is blocked when plan limit is reached
- edit publish bypasses the limit gate because limit is only rechecked for non-edit publishes
- repost also checks the same limit gate
- published listing status is always created as `active`

### Listing title generation

Title is derived on the client:

- car: `brand + year`
- motorcycle: `brand + model`
- vehicle part: `productName`
- fallback: category tail or first description words

This logic currently lives in [`deriveListingTitle`](/c:/Users/user/Downloads/salex-main/lib/app-state.ts).

### Profile behavior

- default account type is `business`
- profile phone is collected at registration
- profile phone is not reused automatically in marketplace connection OTP flow

### Language behavior

- default language is `az`
- language is held only in `LanguageContext`
- language changes update HTML attributes
- language is not persisted to backend or local storage
- changing language from profile routes the user back through onboarding/registration

### Analytics behavior

- basic users do not see advanced metrics
- premium and premiumPlus users do
- analytics are synthetic client-generated values, not backend values

### Support behavior

- premiumPlus shows priority support copy/badge
- other plans show standard support copy
- request queue state is visual only

### Real-estate behavior

- some real-estate subflows are active
- many real-estate selectors exist in code but are intentionally disabled with `false &&`
- current real-estate data is mostly stored by appending descriptive segments into the `category` string

### Draft behavior

- draft is persisted only in client state while moving between create/image/share steps
- leaving create screen via its back button does not save the draft first

## 7. Backend Dependencies

### Auth / identity

Current frontend needs at least:

- a user identity record
- a session or equivalent current-user lookup
- profile read/update support

The frontend does not currently implement login/logout beyond full in-memory reset, so backend auth UI is not yet represented in the frontend.

### OTP / platform connection

Current frontend needs backend support for:

- send OTP to phone for a target platform connection
- verify OTP
- create/update a platform connection record
- list connection state per platform for current user

### Listings

Current frontend needs backend support for:

- create listing
- read listings
- update listing
- delete listing
- repost/clone listing
- store listing status
- store category string and optional detail payloads
- store image URLs or upload references

Optional but useful:

- draft save/load endpoints if draft persistence beyond current session is desired later

### Media

The image screen currently needs a real replacement for mock URLs:

- upload endpoint or signed-upload flow
- image metadata storage
- listing-image association

### Packages / subscriptions

Current frontend needs backend support for:

- read current user plan
- change active plan
- expose platform entitlements for current plan
- expose listing limit for current plan

If backend wants real billing later, frontend changes will be needed because current UI assumes immediate activation.

### Platforms

Current frontend needs backend support for:

- platform catalog
- platform entitlement by plan
- connection state by user and platform
- connect/disconnect status

### Publishing

Current frontend needs backend support for:

- create publish job for a listing
- publish to one or more connected platforms
- per-platform publish status
- overall publish completion state
- publish result links or external URLs per platform

### Analytics

Current frontend can work without backend analytics because it currently generates fake metrics.

If real analytics are added, backend would need:

- listing views per platform
- messages/leads per listing
- engagement metrics
- top-performing listing aggregates

### Support

Current frontend needs simple support backend support for:

- create support request
- list support requests for current user
- request status updates if backend wants to replace the permanent `Queued` label

### Language / settings

Optional backend support:

- store preferred language on user profile

Not strictly required for current frontend because language is held only in memory.

## 8. Data Model Suggestions Based on Current Frontend

### Minimum entities

#### `user`

Minimum fields:

```ts
type User = {
  id: string;
  fullName: string;
  phone: string;
  accountType: 'individual' | 'business';
  language?: 'az' | 'ru' | 'en';
  activePlan: 'basic' | 'premium' | 'premiumPlus';
  createdAt: string;
  updatedAt: string;
}
```

#### `platform_connection`

```ts
type PlatformConnection = {
  id: string;
  userId: string;
  platformName: 'Tap.az' | 'Lalafo' | 'Alan.az' | 'Laylo.az' | 'Birja.com';
  status: 'connected' | 'not_connected';
  phone?: string;
  connectedAt?: string;
}
```

#### `otp_session`

```ts
type OtpSession = {
  id: string;
  userId: string;
  platformName: string;
  phone: string;
  codeLength: 4;
  status: 'sent' | 'verified' | 'expired';
  createdAt: string;
  expiresAt: string;
}
```

#### `listing`

```ts
type Listing = {
  id: string;
  userId: string;
  title: string;
  category: string;
  priceAmount: string;
  currency: 'AZN';
  city: string;
  description: string;
  status: 'active' | 'sold' | 'archived';
  platformNames: string[];
  imageUrls: string[];
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  clientSeed?: number;
}
```

Notes:

- current frontend stores `price` as a raw string in draft and as `"123 AZN"` in published listing UI state
- backend can mirror that or normalize amount/currency and return formatted price separately

#### `listing_vehicle_details`

```ts
type ListingVehicleDetails = {
  listingId: string;
  carDetails?: {
    category: string;
    brand: string;
    color: string;
    engineVolume: string;
    fuelType: string;
    transmission: string;
    bodyType: string;
    year: string;
  } | null;
  motorcycleDetails?: {
    brand: string;
    model: string;
    type: string;
    engineVolume: string;
    fuelType: string;
    year: string;
    mileage: string;
    transmission: string;
    color: string;
    condition: string;
    district: string;
    isNew: boolean;
  } | null;
  vehiclePartDetails?: {
    category: string;
    compatibilityBrand: string;
    compatibilityModel: string;
    productName: string;
    condition: string;
    delivery: string;
  } | null;
}
```

#### `subscription` or `package_state`

```ts
type PackageState = {
  userId: string;
  activePlan: 'basic' | 'premium' | 'premiumPlus';
  startedAt: string;
  endsAt?: string | null;
}
```

#### `publish_job`

```ts
type PublishJob = {
  id: string;
  userId: string;
  listingId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  createdAt: string;
  completedAt?: string;
}
```

#### `publish_job_platform`

```ts
type PublishJobPlatform = {
  id: string;
  publishJobId: string;
  platformName: string;
  status: 'waiting' | 'processing' | 'success' | 'failed';
  externalUrl?: string;
  externalListingId?: string;
  errorMessage?: string;
}
```

#### `support_request`

```ts
type SupportRequest = {
  id: string;
  userId: string;
  subject: string;
  message: string;
  status: 'queued' | 'in_progress' | 'resolved';
  createdAt: string;
}
```

### Important modeling caveat

Most electronics and real-estate sub-attributes are currently embedded into the `category` path string. That means one of two backend approaches is needed:

1. accept and store the category path string exactly as the frontend currently builds it
2. introduce stable category/attribute IDs, which would require frontend changes

For a minimum backend matching the current frontend, option 1 is the safer path.

## 9. API Requirements Inferred from Frontend

### Auth / user

- `GET /me`
- `PATCH /me`
- `POST /logout` or equivalent session destroy endpoint

### OTP / platform connection

- `POST /platform-connections/otp/send`
- `POST /platform-connections/otp/verify`
- `GET /platform-connections`
- `POST /platform-connections`
- `DELETE /platform-connections/:platformName` if disconnect is later exposed

### Listings

- `GET /listings`
- `GET /listings/:id`
- `POST /listings`
- `PATCH /listings/:id`
- `DELETE /listings/:id`
- `POST /listings/:id/repost`

Optional if drafts become persistent:

- `GET /listing-drafts/:id`
- `POST /listing-drafts`
- `PATCH /listing-drafts/:id`

### Media

- `POST /uploads/images`
- or `POST /uploads/images/presign`

### Packages / subscriptions

- `GET /packages/current`
- `GET /packages/catalog`
- `POST /packages/select`

### Platforms

- `GET /platforms`
- `GET /platforms/available`
- `GET /platforms/connections`

### Publishing

- `POST /publish-jobs`
- `GET /publish-jobs/:id`
- `GET /publish-jobs/:id/platforms`

### Analytics

Can be delayed. If implemented:

- `GET /analytics/overview`
- `GET /analytics/platforms`
- `GET /analytics/top-listings`

### Support

- `GET /support/requests`
- `POST /support/requests`

### Profile / settings

- `PATCH /settings/language` if language persistence is added

## 10. Open Questions / Ambiguities

1. `CreateListingScreen` contains car, motorcycle, vehicle-part, refrigerator, appliance, and other selector chains, but the visible category tree only clearly exposes Electronics and Real Estate. Some flows may be unreachable from the current UI.
2. Several real-estate selector screens are explicitly disabled with `false && ...`, so the intended final real-estate payload is incomplete from current reachable behavior.
3. The create-listing platform checkboxes are stored in draft state, but final publish uses all connected unlocked platforms. It is unclear whether backend should honor checkbox selection or current actual publish behavior.
4. Package marketing copy references day/week/month limits, but the actual enforced logic only counts active listings globally. Backend implementation needs confirmation on which rule is authoritative.
5. Registration collects a phone number, but the only OTP flow is inside marketplace connection. It is unclear whether app-level auth should also use OTP, or whether registration phone is just profile data.
6. Language switching from profile routes the user back through onboarding and registration screens. This may be intentional in current frontend flow, but it is unusual and should be confirmed before backend relies on language preference lifecycle.
7. Listing category is stored as a human-readable path string, and some appended values are language-dependent. This is not a stable backend key format.
8. Listing success page has real links only for a subset of platforms. Backend publish results may need a platform URL mapping strategy if parity is required.
9. Publish progress has a `failed` state and retry UI, but the current flow never creates failures. Real backend behavior will need a defined failure contract.
10. Image upload screen uses generated mock URLs and claims drag/reorder behavior not actually implemented. Backend media support can only replace what is visibly used now: add/remove image references.
11. There is no persistent listing draft behavior. If backend draft persistence is wanted, frontend behavior is currently incomplete for save-on-back or resume-after-refresh.
12. Support requests have only a queued visual state. No ticket lifecycle is currently represented in the UI.

## 11. Final Summary

### What backend must exist first

The minimum backend required to support the core frontend journey is:

1. user/profile storage
2. package/entitlement state
3. platform connection state plus OTP send/verify
4. listing CRUD
5. media upload/image reference storage
6. publish job creation and status tracking

Without those pieces, the main create -> connect -> publish flow remains mock-only.

### What can be delayed

These areas can be delayed without blocking the main flow:

- real analytics
- support request lifecycle beyond simple create/list
- language preference persistence
- advanced real-estate structured fields
- draft persistence

### Minimum viable backend for this frontend

The smallest practical backend for current frontend parity is:

- a current-user record with plan and profile
- platform connections with mocked or real OTP verification
- a listing table with category string, common fields, images, and optional structured vehicle detail JSON
- a publish-job system that returns per-platform status

Everything else can be layered on after the listing publish path works.

## Backend Build Order

1. Build current-user/profile endpoints and session lookup.
2. Add package state and entitlement resolution (`basic`, `premium`, `premiumPlus` plus allowed platforms and limit).
3. Build platform connection endpoints with OTP send/verify and per-platform connection state.
4. Build listing create/read/update/delete using the current frontend payload shape.
5. Add image upload/storage and return image URLs or asset references compatible with the listing payload.
6. Build publish-job creation and publish-status polling/read endpoints with per-platform statuses.
7. Wire repost behavior and listing limit enforcement on backend.
8. Add package selection/change persistence.
9. Replace frontend-generated analytics with backend analytics if needed.
10. Add support request persistence and status lifecycle.
11. Add language preference persistence only if the frontend flow is confirmed.
