# Product Requirements Document
## Comfort Inn Shelby NC — AI Concierge Chatbot "Elara"
**Version:** 2.0  
**Prepared by:** BoldFlow Labs  
**Client:** Comfort Inn Shelby NC (comfortshelby.com)  
**IDE:** Google Antigravity  
**Automation Layer:** n8n (Client's Self-Hosted Subscription)  
**AI Model:** OpenAI GPT-5.4 mini (`gpt-5.4-mini-2026-03-17`)  
**Date:** May 2026

---

## 1. Executive Summary

Comfort Inn Shelby NC is a 76-room, Gold Award 2023-winning hotel operated under the **Comfort Inn®** brand (a Choice Hotels International property), located at 2012 East Marion Street, Shelby, NC 28150. The official brand name is **Comfort Inn® Shelby**, not "Comfort Inn Shelby NC" — though the latter is used colloquially on the website. All chatbot-facing copy and system prompts should refer to the hotel as **Comfort Inn Shelby**.

The owner's directive was simple:

> *"Just try to solve my problems thinking as an owner and come up with a chatbot."*

**Thinking as the owner,** the real daily pain points at a property like this are:

| Owner Pain Point | Chatbot Solution |
|---|---|
| Staff fielding the same 10 phone questions all day | Elara answers instantly, 24/7, for zero staff cost |
| Guests browse late at night, no one responds, they book elsewhere | Elara engages, captures intent, delivers booking link at 2 AM |
| No guest follow-up system exists | n8n fires a personalized email within 15 minutes of lead capture |
| Zero visibility into what guests are actually asking | Automated weekly digest summarizes top questions and leads |
| Spanish/Japanese guests underserved by English-only staff | Elara auto-detects and responds in the guest's language |
| Negative reviews from confusion over policies | Elara proactively clarifies pet, parking, renovation status before booking |
| Complaints reach the internet before management | Elara escalates in-stay complaints directly to owner in real time |

**Elara** is the AI-powered, 24/7 virtual concierge for Comfort Inn Shelby. She lives as a floating chat widget on the hotel website, speaks like a knowledgeable and warm front desk professional, drives direct bookings, captures leads, and handles every guest interaction that would otherwise fall through the cracks.

---

## 2. Product Vision

**Chatbot Name:** `Elara`  
**Role:** Virtual Concierge, Comfort Inn Shelby  
**One-liner:** A 24/7 AI front desk agent that answers guest questions instantly, qualifies booking intent, captures leads, and automates follow-up — so the owner never loses a guest again.

---

## 3. User Personas

### 3.1 Potential Guest (Primary)
Browsing for hotels in the Shelby / Charlotte area. Comparing amenities and prices. Needs instant answers on breakfast, pool status, check-in time, parking, pet policy. High conversion likelihood if friction is removed.

### 3.2 Returning Guest (Secondary)
Already stayed before, returning to re-book. Wants quick confirmation of policies or current offers. High intent, low friction needed.

### 3.3 Business / Government Traveler (Secondary)
Checking FEMA/government rate eligibility, Wi-Fi reliability, work desk, business center access.

### 3.4 In-Stay Guest (Tertiary)
Current guest with a question, request, or complaint. Needs empathetic escalation, not a chatbot loop.

### 3.5 Hotel Owner / Manager (Internal)
Wants lead data and conversation summaries delivered passively. Does not want to manage software. Does not want to touch code.

---

## 4. Scope

### In Scope — V1
- Embeddable chat widget (drops onto any page of comfortshelby.com via `<script>` tag)
- AI agent (OpenAI GPT-5.4 mini) with full hotel knowledge base
- Intent detection and response routing
- Lead capture flow (in-chat, conversational)
- Click-to-call button in widget header (704-482-5666)
- n8n unified automation workflow (1 workflow, 4 branches)
- Admin dashboard at `/elara-admin`
- Multilingual support (EN / ES / JP — auto-detected)
- Conversation and lead database

### Out of Scope — V1
- Live PMS / room inventory integration (real-time availability)
- Payment processing inside chat
- CRM integration (V2 roadmap)
- Voice support (V2 roadmap)

---

## 5. Feature Requirements

### 5.1 Chat Widget (Frontend)

**FR-001** — The widget appears as a floating button on all pages of the hotel website, anchored bottom-right.

**FR-002** — On first load, after 8 seconds of inactivity, the widget auto-displays a proactive greeting message:
> *"Hi there! 👋 Planning a stay at Comfort Inn Shelby? I'm Elara, your virtual concierge. I can answer questions and help you get the best rate — day or night."*

**FR-003** — The widget header shall include a **direct call button** (phone icon + number) prominently displayed:
- Phone number: **704-482-5666**
- Clicking it on mobile initiates a native phone call (`tel:704-482-5666`)
- On desktop, it displays the number as a copyable tooltip

**FR-004** — The chat shall render markdown-style formatting (bold, links, bullet lists) in message bubbles.

**FR-005** — Quick-reply chips appear under the greeting for one-tap navigation:
- 🛏️ View Rooms
- 🍳 Breakfast Info
- 📍 Location & Parking
- 💰 Book Now / Best Rate
- 📞 Call Us

**FR-006** — The widget is fully mobile-responsive and keyboard-safe on iOS and Android.

**FR-007** — Conversation state persists within the browser session (guest doesn't lose context navigating between pages).

**FR-008** — A typing indicator ("Elara is typing...") displays while the AI response loads.

**FR-009** — Brand color reference for the IDE (not a design prescription — these are the hotel's brand colors to maintain brand consistency): **Primary: dark navy/dark blue. Accent: golden/warm gold.** Let Google Antigravity design freely within the spirit of these brand colors.

---

### 5.2 AI Agent (Core Intelligence)

**FR-010** — The AI is powered by **OpenAI GPT-5.4 mini** (`gpt-5.4-mini-2026-03-17`) via the OpenAI Chat Completions API.

**FR-011** — The AI is configured with a detailed system prompt. The agent's name is **Elara**. Personality: warm, knowledgeable, professional — representative of the hotel's friendly southern hospitality culture. Never robotic.

**FR-012** — Full hotel knowledge base injected into the system prompt context:

**Hotel Identity**
- Brand: Comfort Inn® (Choice Hotels International property)
- Property name: Comfort Inn Shelby
- Address: 2012 East Marion Street, Shelby, NC 28150
- Phone: 704-482-5666
- Website: https://www.comfortshelby.com
- Award: Gold Award 2023

**Operating Info**
- Check-in: 3:00 PM
- Check-out: 11:00 AM
- Pets: Not allowed (service animals accepted, no charge)
- Parking: Free outdoor parking; bus parking available
- Smoking: 100% smoke-free property
- Credit card + matching photo ID required at check-in
- Incidental deposit: $250 USD at check-in

**⚠️ Current Renovation Notice (as of May 2026)**
- Outdoor pool: temporarily closed for renovations
- Fitness center: temporarily closed for renovations
- Elevator: currently unavailable
- EV charging station: currently unavailable
- Elara must proactively mention this when guests ask about pool, gym, elevator, or EV charging

**Rooms (4 Types)**
- 1 King Bed, Nonsmoking, Accessible (max 3 guests) — ADA compliant, visual fire alarm, accessible tub option, roll-in shower option
- 1 King Bed, Nonsmoking (max 3 guests)
- 2 Queen Beds, Nonsmoking (max 4 guests)
- All rooms include: Free Wi-Fi, 42" HDTV, HBO, coffeemaker, microwave, refrigerator, hair dryer, iron & board, desk with ergonomic chair, A/C & heat, AM/FM clock radio, private bath, wake-up service

**Hotel Amenities (available unless noted under renovation)**
- Complimentary hot breakfast daily (waffles, scrambled eggs, sausages, oatmeal, fresh fruit, yogurt)
- Free coffee throughout the day
- Free weekday newspaper
- Laundry / valet cleaning service
- Business center (computer, printer, copier, fax)
- Interior corridors
- 2 stories
- Government / FEMA travelers accepted

**Meeting Space**
- No dedicated meeting room
- Breakfast area available for meetings and events after 11:00 AM

**Booking**
- Direct booking: https://www.comfortshelby.com/click-reservation
- Special offers: https://www.comfortshelby.com/offers
- Choice Privileges loyalty program eligible

**Nearby (Location)**
- 1 hour east of Charlotte via US Highway 74
- Cleveland Mall (adjacent)
- John Henry Moss Lake
- Cleveland Golf Club
- Woodbridge Golf Course, Royster Memorial Golf Course (within 5 miles)
- Kings Mountain Historical Museum
- Gardner-Webb University
- Wing Haven Gardens & Bird Sanctuary
- Historic Latta Plantation

**Nearby Dining**
- Denny's, Golden Corral, Fatz Southern Kitchen, Red Bridges Barbecue

**FR-013** — Intent classification: The AI detects and handles the following intents:

| Intent | Description |
|---|---|
| `BOOKING_INTENT` | Guest wants to book a room or check rates |
| `ROOM_INQUIRY` | Questions about room types, capacity, amenities |
| `POLICY_INQUIRY` | Pet, smoking, parking, check-in, deposit policies |
| `AMENITY_INQUIRY` | Breakfast, pool, gym, Wi-Fi, business center |
| `RENOVATION_INQUIRY` | Questions about pool, gym, elevator, EV charger |
| `LOCATION_INQUIRY` | Directions, nearby attractions, restaurants |
| `COMPLAINT_ESCALATION` | In-stay guest reporting a problem |
| `LEAD_CAPTURE` | Guest willing to share contact info |
| `GENERAL_FAQ` | Any other hotel-related question |

**FR-014** — Booking intent handling: When `BOOKING_INTENT` is detected, Elara shall:
1. Confirm check-in/check-out dates and guest count if not already provided
2. Recommend the most suitable room type
3. Deliver the direct booking link
4. Offer to capture the guest's email for rate alerts or follow-up

**FR-015** — Renovation transparency: Elara proactively mentions the renovation status when guests ask about pool, gym, elevator, or EV charging. She frames it warmly and accurately without discouraging the stay.

**FR-016** — Pricing transparency: Elara **never fabricates room rates**. When asked about price, she says:
> *"Rates vary by date — let me pull up today's best available price for you."* → delivers direct booking link.

**FR-017** — Complaint escalation: If a current in-stay guest raises a complaint, Elara:
1. Acknowledges with empathy immediately
2. Provides the front desk phone number (704-482-5666)
3. Triggers the n8n complaint branch (owner alert)

**FR-018** — Language detection: Elara auto-detects Spanish or Japanese and responds in the guest's language using the same full knowledge base.

**FR-019** — Out-of-scope graceful handling: If asked something outside the hotel's knowledge, Elara says: *"I want to make sure I give you the right answer on that — please call our front desk directly at 704-482-5666 and we'll sort it out."*

---

### 5.3 Lead Capture Flow

**FR-020** — After 2+ exchanges OR upon `BOOKING_INTENT` detection, Elara smoothly offers:
> *"Would you like me to send you the best rate for your dates? I just need a couple of details — it takes less than a minute."*

**FR-021** — Lead capture collects the following fields (conversationally, not as a form):

| Field | Required |
|---|---|
| First name | Yes |
| Email address | Yes |
| Phone number | **Yes (required)** |
| Preferred check-in date | Yes (if not already in conversation) |
| Room preference (King / Queen / Accessible) | Yes |

**FR-022** — Upon lead capture completion, the chatbot immediately triggers the n8n unified workflow via webhook.

---

### 5.4 n8n Unified Automation Workflow

> All four automation cases are handled inside **one single n8n workflow** with conditional branches. This keeps the n8n dashboard clean, easy to maintain, and easy for a non-technical owner to understand at a glance.

**Workflow Name:** `Elara — Hotel Automation Hub`

**Trigger:** Webhook node — receives all events from the chatbot backend at a single endpoint: `POST /webhook/elara-events`

**Payload structure the chatbot sends to n8n:**
```json
{
  "event_type": "LEAD_CAPTURED | COMPLAINT_ESCALATED | BOOKING_ABANDONED | WEEKLY_DIGEST_REQUEST",
  "session_id": "abc123",
  "timestamp": "2026-05-22T14:30:00Z",
  "guest": {
    "name": "Sarah",
    "email": "sarah@email.com",
    "phone": "555-123-4567",
    "checkin_date": "2026-06-10",
    "room_preference": "King"
  },
  "complaint_summary": "Guest reports noise from room 204",
  "conversation_snippet": "..."
}
```

**n8n Workflow Branches (Switch Node on `event_type`):**

---

#### Branch A — `LEAD_CAPTURED` (Guest Follow-Up)
1. **Wait** 15 minutes (prevents overeager email)
2. **Send Email** to guest (Gmail/SMTP node):
   - Subject: *"Your stay at Comfort Inn Shelby — here's your direct booking link"*
   - Body: personalized with guest name, dates, room preference, direct link, phone number
3. **Google Sheets** — append lead row to `Elara Leads` sheet (name, email, phone, dates, room, timestamp)
4. **Send Email** to owner: *"New lead captured: [Name] | [Email] | [Phone] | Check-in: [Date] | Room: [Preference]"*

---

#### Branch B — `COMPLAINT_ESCALATED` (Owner Alert)
1. **Send Email** to owner immediately:
   - Subject: *"⚠️ Guest Complaint — Elara Alert"*
   - Body: guest name (if known), complaint summary, session timestamp, suggestion to call 704-482-5666
2. **Google Sheets** — log complaint to `Elara Complaints` sheet
3. *(Optional — if Twilio configured)*: Send SMS to owner's mobile number with a one-line alert

---

#### Branch C — `BOOKING_ABANDONED` (Re-Engagement)
1. **Wait** 2 hours after session end (chatbot sends this event when guest had BOOKING_INTENT but did not complete lead capture AND did leave an email at any point in the session)
2. **Send Email** to guest:
   - Subject: *"Still thinking about Shelby? Your room is waiting."*
   - Body: friendly reminder, direct booking link, phone number
3. **Google Sheets** — log abandoned session to `Elara Abandoned` sheet

---

#### Branch D — `WEEKLY_DIGEST_REQUEST` (Owner Intelligence)
1. **Trigger:** Cron node — every Monday at 8:00 AM
2. **Google Sheets** — fetch last 7 days of rows from all Elara sheets
3. **OpenAI node** — summarize data:
   - Total conversations
   - Leads captured
   - Top 5 questions guests asked
   - Any complaints logged
   - Renovation-related questions (to monitor guest sentiment on pool/gym closure)
4. **Send Email** to owner with the full digest

---

#### Default Branch — Unknown Event
- Log to Google Sheets `Elara Errors` sheet with raw payload
- Send email to developer: *"Unknown event type received from Elara"*

---

### 5.5 Admin Dashboard (`/elara-admin`)

**FR-023** — A standalone, password-protected admin dashboard at `/elara-admin`.

**FR-024** — Dashboard sections:

**Overview Cards (top row)**
- Total conversations (last 30 days)
- Leads captured (last 30 days)
- Complaints escalated (last 30 days)
- Most asked intent (last 30 days)

**Lead Management Table**
- Columns: Name, Email, Phone, Check-in Date, Room Preference, Captured At, Follow-up Sent
- Search, sort, date filter
- CSV export button

**Conversation Log**
- Searchable list of all sessions
- Click to expand full transcript
- Intent tags per session
- Language flag

**Intent Analytics**
- Bar chart: top intents by volume, last 7 / 30 days toggle

**Knowledge Base Editor**
- Simple text editor for the owner to update hotel info (hours, policies, temporary notices like renovation status) without touching code
- Changes take effect on next conversation without deployment

**Live Widget Preview**
- Owner can see how Elara looks and responds as a guest would

**FR-025** — Admin authentication: email + password login with session tokens. Single owner account for V1.

---

## 6. Technical Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                   comfortshelby.com                          │
│  ┌───────────────────────────────────────────────────────┐   │
│  │     Elara Chat Widget  (<script> embed, lazy-loaded)  │   │
│  │   React component — floating button, chat interface   │   │
│  │   Header: Hotel name + Elara title + 📞 Call button   │   │
│  └────────────────────────┬──────────────────────────────┘   │
└───────────────────────────┼──────────────────────────────────┘
                            │ HTTPS POST
                            ▼
┌──────────────────────────────────────────────────────────────┐
│            Elara Backend  (Next.js / Node.js, Vercel)        │
│                                                              │
│  POST /api/chat          → AI conversation handler          │
│  POST /api/lead          → Lead save + n8n webhook trigger  │
│  GET  /elara-admin/*     → Admin dashboard routes           │
│  POST /api/event         → n8n event dispatcher             │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │         PostgreSQL (Supabase)                         │   │
│  │  tables: conversations | messages | leads | kb_items  │   │
│  └──────────────────────────────────────────────────────┘   │
│                          │                                   │
│                  ┌───────▼───────┐                           │
│                  │  OpenAI API   │  gpt-5.4-mini-2026-03-17  │
│                  └───────────────┘                           │
└───────────────────────────┬──────────────────────────────────┘
                            │ Webhook (HTTPS POST)
                            ▼
┌──────────────────────────────────────────────────────────────┐
│               n8n  (Client's Self-Hosted Instance)           │
│                                                              │
│  Workflow: "Elara — Hotel Automation Hub"                    │
│  Trigger: Webhook  →  Switch on event_type                   │
│                                                              │
│  Branch A: LEAD_CAPTURED      → Email + Sheets + Owner alert │
│  Branch B: COMPLAINT_ESCALATED → Owner email + SMS + Sheets  │
│  Branch C: BOOKING_ABANDONED  → Re-engagement email          │
│  Branch D: WEEKLY_DIGEST      → Cron + AI summary + Email    │
│  Default:  Unknown event      → Error log + Dev alert        │
│                                                              │
│  External: Gmail/SMTP | Google Sheets | Twilio (optional)    │
└──────────────────────────────────────────────────────────────┘
```

### 6.1 Tech Stack

| Layer | Technology |
|---|---|
| Chat Widget | React (embeddable JS snippet) |
| Backend / API | Next.js (App Router + API Routes) |
| AI Model | OpenAI `gpt-5.4-mini-2026-03-17` |
| Database | PostgreSQL via Supabase |
| Automation | n8n (client's self-hosted subscription) |
| Email | n8n → Gmail node or SMTP node |
| Sheets logging | n8n → Google Sheets node |
| SMS alerts | n8n → Twilio node (optional) |
| Hosting | Vercel (frontend + API) |
| Admin Dashboard | Next.js pages at `/elara-admin` |
| Admin Auth | NextAuth.js or JWT |

### 6.2 Data Models

**conversations**
```
id | session_id | started_at | ended_at | language | lead_captured (bool) | complaint_flagged (bool) | intent_log (jsonb)
```

**messages**
```
id | session_id | role (user/assistant) | content | timestamp | intent_detected
```

**leads**
```
id | session_id | first_name | email | phone | checkin_date | room_preference | source_page | created_at | followup_sent_at
```

**kb_items** *(knowledge base editor)*
```
id | category | key | value | updated_by | updated_at
```

---

## 7. AI System Prompt (Starter Draft)

```
You are Elara, the virtual concierge for Comfort Inn Shelby — a warm, award-winning hotel located at 2012 East Marion Street, Shelby, NC 28150.

Your job is to be the most knowledgeable, friendly, and genuinely helpful front desk representative for this hotel — available 24 hours a day. You embody the spirit of southern hospitality: warm, unhurried, and genuinely caring. Never robotic, never corporate, never scripted-sounding.

YOUR NAME: Elara
YOUR EMPLOYER: Comfort Inn Shelby (a Comfort Inn® / Choice Hotels property)

CORE MISSION:
1. Answer any hotel-related question accurately using ONLY the knowledge provided below
2. Guide interested guests toward booking — always prefer the direct booking link over third-party sites
3. Collect guest contact information when they show booking intent
4. Escalate genuine in-stay complaints with immediate empathy and owner notification
5. Proactively disclose renovation status (pool, gym, elevator, EV charger are currently unavailable) when relevant

CURRENT RENOVATION NOTICE (important — always mention when asked about pool, gym, elevator, EV charging):
"I want to be upfront with you — our outdoor pool, fitness center, elevator, and EV charging station are temporarily unavailable while we're undergoing renovations. The rest of the hotel is fully open and we'd love to have you!"

[Full knowledge base from FR-012 injected here]

RULES:
- NEVER invent room prices. Always say: "Rates vary by date — here's the link to see today's best price: [link]"
- NEVER mention competitor hotels
- If you don't know something, say: "Let me make sure you get the right answer — please call our front desk at 704-482-5666"
- Always end booking-intent conversations with the direct link: https://www.comfortshelby.com/click-reservation
- Detect the guest's language and respond in English, Spanish, or Japanese accordingly
- After 2 exchanges or on booking intent: offer to send them the best rate via email

LEAD CAPTURE: When offering to send rates, collect: first name, email, phone number, preferred check-in date, room preference.

COMPLAINT ESCALATION: If a current guest reports a problem, respond with empathy first, provide the front desk number (704-482-5666), and flag internally for owner notification.
```

---

## 8. n8n Setup Guide — Complete Beginner's Guide

> This section is written for someone who has never used n8n before. Follow every step in order.

---

### What is n8n?

n8n is an automation tool — think of it like a set of connected pipes. When something happens (like a guest submitting their contact info in the chatbot), n8n automatically does a series of things for you — sends an email, saves data to a spreadsheet, alerts you on your phone — without you doing anything manually.

You already have an n8n hosting subscription, so the software is already running for you online. You just need to log in and build the workflow.

---

### Step 1 — Log Into Your n8n Instance

1. Open the URL your n8n hosting provider gave you (it looks something like `https://your-name.n8n.cloud` or a custom domain)
2. Log in with your email and password
3. You'll land on the n8n dashboard — it shows a blank canvas with a "+" button

---

### Step 2 — Create a New Workflow

1. Click the **"+ New Workflow"** button (top right)
2. A blank canvas opens — this is where you'll build your automation
3. Click the pencil icon at the top and rename it: `Elara — Hotel Automation Hub`
4. Click **Save** (Ctrl+S or Cmd+S)

---

### Step 3 — Add the Webhook Trigger (the "doorbell")

The webhook is what listens for events from the chatbot. Every time something happens in Elara (a lead, a complaint, etc.), the chatbot rings this "doorbell."

1. Click the **"+"** button in the center of the canvas
2. Search for **"Webhook"** and select it
3. In the settings panel on the right:
   - **HTTP Method:** POST
   - **Path:** type `elara-events`
   - **Authentication:** none (for now — the developer will add a secret token later)
4. Click **"Listen for Test Event"** — n8n will now wait for a test ping
5. Copy the webhook URL shown (it looks like `https://your-n8n.com/webhook/elara-events`) — give this to your developer
6. Click **Save**

---

### Step 4 — Add a Switch Node (the "traffic director")

The Switch node looks at what type of event arrived and sends it to the right branch.

1. Click the **"+"** after the Webhook node
2. Search for **"Switch"** and select it
3. In settings:
   - **Mode:** Rules
   - **Value to check:** `{{ $json.event_type }}` (type this exactly)
4. Add 4 rules by clicking **"+ Add Rule"** for each:
   - Rule 1: Equal to → `LEAD_CAPTURED`
   - Rule 2: Equal to → `COMPLAINT_ESCALATED`
   - Rule 3: Equal to → `BOOKING_ABANDONED`
   - Rule 4: Equal to → `WEEKLY_DIGEST_REQUEST`
5. Enable **"Fall Through"** for the default (unmatched events)
6. Click **Save**

You now have 4 + 1 output pins on your Switch node. Each one goes to a different branch.

---

### Step 5 — Build Branch A: Lead Follow-Up

Connect from the **"LEAD_CAPTURED"** output pin:

**Node A1 — Wait (15 minutes)**
1. Click "+" from the LEAD_CAPTURED output
2. Search for **"Wait"** and select it
3. Set: **Amount:** 15, **Unit:** Minutes
4. Save

**Node A2 — Send Email to Guest**
1. Click "+" after the Wait node
2. Search for **"Gmail"** (or "Send Email" if using SMTP) and select it
3. Click **"Connect"** to link your Google account (follow the pop-up login)
4. Settings:
   - **To:** `{{ $json.guest.email }}`
   - **Subject:** `Your stay at Comfort Inn Shelby — here's your direct booking link`
   - **Body (HTML):**
     ```
     Hi {{ $json.guest.name }},

     Thank you for your interest in Comfort Inn Shelby! Here's your direct booking link for the best available rate:

     👉 https://www.comfortshelby.com/click-reservation

     Your details:
     - Preferred check-in: {{ $json.guest.checkin_date }}
     - Room preference: {{ $json.guest.room_preference }}

     If you have any questions, call us at 704-482-5666.

     We look forward to welcoming you!
     Elara | Comfort Inn Shelby Virtual Concierge
     ```
5. Save

**Node A3 — Google Sheets (log the lead)**
1. Click "+" after the Email node
2. Search for **"Google Sheets"** and select it
3. Connect your Google account
4. Settings:
   - **Operation:** Append Row
   - **Spreadsheet:** Create a new Google Sheet called `Elara Leads Log` first, then select it here
   - **Sheet:** Sheet1
   - **Columns:** map fields:
     - Name → `{{ $json.guest.name }}`
     - Email → `{{ $json.guest.email }}`
     - Phone → `{{ $json.guest.phone }}`
     - Check-in Date → `{{ $json.guest.checkin_date }}`
     - Room Preference → `{{ $json.guest.room_preference }}`
     - Timestamp → `{{ $json.timestamp }}`
5. Save

**Node A4 — Email Owner**
1. Click "+" after the Sheets node
2. Add another Gmail/Send Email node
3. Settings:
   - **To:** owner's email address (hardcode it here)
   - **Subject:** `New Lead — Elara Chatbot`
   - **Body:** `New lead captured: {{ $json.guest.name }} | {{ $json.guest.email }} | {{ $json.guest.phone }} | Check-in: {{ $json.guest.checkin_date }} | Room: {{ $json.guest.room_preference }}`
4. Save

---

### Step 6 — Build Branch B: Complaint Alert

Connect from the **"COMPLAINT_ESCALATED"** output pin:

**Node B1 — Send Email to Owner (immediate)**
1. Click "+" from the COMPLAINT_ESCALATED output
2. Add a Gmail/Send Email node
3. Settings:
   - **To:** owner's email
   - **Subject:** `⚠️ Guest Complaint — Elara Alert`
   - **Body:** `A guest has reported an issue: {{ $json.complaint_summary }}. Session time: {{ $json.timestamp }}. Guest name: {{ $json.guest.name || 'Not captured' }}. Please follow up immediately at 704-482-5666.`
4. Save

**Node B2 — Google Sheets (log complaint)**
1. Click "+" after the email node
2. Add a Google Sheets node
3. Append row to a sheet called `Elara Complaints Log`
4. Map: Complaint Summary, Guest Name, Timestamp
5. Save

*(Optional) Node B3 — Twilio SMS*
1. Click "+" after Sheets node
2. Search for **"Twilio"** and select it
3. Connect your Twilio account credentials
4. Settings:
   - **To:** owner's mobile number (with country code, e.g., +17045551234)
   - **From:** your Twilio number
   - **Message:** `⚠️ Elara Alert: Guest complaint — {{ $json.complaint_summary }}`
5. Save

---

### Step 7 — Build Branch C: Abandoned Booking Reminder

Connect from the **"BOOKING_ABANDONED"** output pin:

**Node C1 — Wait (2 hours)**
1. Add a Wait node: **Amount:** 2, **Unit:** Hours

**Node C2 — Send Email to Guest**
1. Add a Gmail/Send Email node
2. Settings:
   - **To:** `{{ $json.guest.email }}`
   - **Subject:** `Still thinking about Shelby? Your room is waiting.`
   - **Body:** `Hi {{ $json.guest.name }}, we noticed you were looking at rooms earlier. We'd love to have you — here's the direct booking link: https://www.comfortshelby.com/click-reservation. Questions? Call 704-482-5666.`

**Node C3 — Google Sheets**
1. Log to `Elara Abandoned Sessions` sheet: guest email, timestamp

---

### Step 8 — Build Branch D: Weekly Digest

This branch runs automatically every Monday at 8 AM — no one needs to trigger it manually.

**Node D1 — Cron Trigger** *(this is a second trigger, added alongside the Webhook)*
1. Go back to the start of your workflow canvas
2. Add a separate **"Schedule Trigger"** node (search "Schedule" or "Cron")
3. Settings:
   - **Trigger:** Weekly
   - **Day:** Monday
   - **Time:** 8:00 AM
4. Connect this to a new path that leads to the digest nodes

**Node D2 — Google Sheets (fetch last 7 days)**
1. Add a Google Sheets node
2. **Operation:** Read Rows
3. Select `Elara Leads Log`
4. Save

**Node D3 — OpenAI (summarize)**
1. Search for **"OpenAI"** and select it
2. Connect your OpenAI API key
3. **Operation:** Chat → Message
4. **Model:** `gpt-5.4-mini-2026-03-17`
5. **Prompt:** `You are a hotel analytics assistant. Here is the last 7 days of chatbot data for Comfort Inn Shelby: {{ $json }}. Summarize: total leads captured, top 5 guest questions, any complaints, renovation-related inquiries. Write a short, friendly summary for the hotel owner.`

**Node D4 — Send Email to Owner**
1. Add Gmail/Send Email node
2. **To:** owner's email
3. **Subject:** `Elara Weekly Digest — Week of {{ $now.format('MMM D') }}`
4. **Body:** `{{ $json.choices[0].message.content }}`

---

### Step 9 — Activate the Workflow

1. Click the **toggle switch** in the top-right of the workflow canvas (it says "Inactive" — click it to set it to "Active")
2. The workflow is now live and listening
3. Share the webhook URL (`https://your-n8n.com/webhook/elara-events`) with your developer so the chatbot can call it

---

### Step 10 — Test Everything

1. In the chatbot (once built), trigger a test lead capture
2. Go to n8n → open the workflow → click **"Executions"** tab on the left
3. You'll see a new execution appear — green = success, red = error
4. Click on any execution to see exactly what happened at each node
5. If something is red, click the red node to see the error message — most common issues are auth credentials not connected

---

### Ongoing Maintenance Tips for the Owner

- **To see all leads:** open `Elara Leads Log` in Google Sheets — it updates automatically
- **To edit automation:** go to n8n, open `Elara — Hotel Automation Hub`, click any node to edit it
- **To pause automation:** toggle the workflow to "Inactive" — it stops running without deleting anything
- **If a branch stops working:** check the Executions tab for red errors — 90% of the time it's an expired Google/Gmail authentication that just needs to be reconnected

---

## 9. Non-Functional Requirements

**NFR-001 Performance:** Widget loads under 1.5 seconds on the hotel site. Full lazy-loading.

**NFR-002 Reliability:** AI response within 4 seconds. If OpenAI API fails, Elara displays: *"I'm having a brief moment — please call us at 704-482-5666 for immediate help."*

**NFR-003 Privacy:** Only PII the guest explicitly provides is stored. Lead data never shared with third parties. Cookie-compliant implementation.

**NFR-004 Accessibility:** Chat widget meets WCAG 2.1 AA. Keyboard navigable. Screen reader compatible. The direct call button must be tappable (min 44×44px touch target).

**NFR-005 Security:** All API keys server-side only (never in client bundle). n8n webhook secured with a shared secret header token. Admin dashboard behind authentication.

**NFR-006 Uptime:** Vercel = 99.9% SLA. All n8n branches have an error-catch node at the end that emails the developer on failure.

---

## 10. Success Metrics

| Metric | 60-Day Target |
|---|---|
| Lead capture rate | ≥ 15% of chatbot sessions |
| After-hours conversations handled without staff | 100% |
| Phone call reduction for FAQ topics | ≥ 30% |
| Lead-to-booking conversion via follow-up email | ≥ 8% |
| Staff time saved per week | ≥ 5 hours |
| Renovation-related confusion complaints | 0 (proactive disclosure) |

---

## 11. Development Phases & Timeline

### Phase 1 — Core Chatbot (Week 1–2)
- [ ] Next.js project scaffolding, Supabase DB setup
- [ ] OpenAI GPT-5.4 mini integration + system prompt
- [ ] Hotel knowledge base (including renovation notice)
- [ ] Chat widget UI — Google Antigravity IDE design pass
- [ ] Quick-reply chips, typing indicator, call button in header
- [ ] Lead capture flow (conversational)
- [ ] Deploy to Vercel + embed script on hotel site

### Phase 2 — n8n Automation (Week 2–3)
- [ ] Client sets up n8n following the guide in Section 8 (or BoldFlow configures on client's instance)
- [ ] Webhook receiver configured
- [ ] Switch node with all 4 branches built and tested
- [ ] Gmail/SMTP connected and email templates confirmed with owner
- [ ] Google Sheets logging confirmed
- [ ] Cron (weekly digest) tested
- [ ] End-to-end test of all 4 branches

### Phase 3 — Admin Dashboard (Week 3–4)
- [ ] `/elara-admin` routes and auth
- [ ] Overview cards
- [ ] Lead table + CSV export
- [ ] Conversation log viewer
- [ ] Intent analytics chart
- [ ] Knowledge base editor
- [ ] Live widget preview

### Phase 4 — QA & Launch (Week 4)
- [ ] Full scenario testing (25+ test cases including renovation questions)
- [ ] Mobile device testing (iOS Safari, Android Chrome)
- [ ] Language switching test (ES, JP)
- [ ] Edge cases: API timeout, empty inputs, rate fabrication attempts
- [ ] Soft launch → 2 weeks real data collection
- [ ] System prompt tuning based on real conversations
- [ ] Owner handover + Loom walkthrough video

---

## 12. Vibe Coding Prompts for Google Antigravity IDE

When prompting the IDE, use these as exact inputs. No design decisions are made in this PRD — these prompts give the IDE the context it needs to make great decisions independently.

**Chat Widget Prompt:**
```
Build a chat widget for a hotel called Comfort Inn Shelby. The chatbot 
inside is named Elara. The hotel's brand colors are dark navy blue as 
primary and warm gold as accent. Design a professional, unique, 
memorable widget that does NOT look like a generic AI chatbot template. 
The widget header must include: the hotel name, "Elara — Virtual Concierge" 
as subtitle, and a prominent click-to-call button showing the phone number 
704-482-5666. Include: chat message bubbles, typing indicator, quick-reply 
chips, and a lead capture conversational state. Professional and unique.
```

**Admin Dashboard Prompt:**
```
Build an admin dashboard for a hotel chatbot system called Elara for 
Comfort Inn Shelby. Brand colors: dark navy primary, warm gold accent. 
The dashboard is used by the hotel owner to review leads, conversation 
logs, intent analytics, and edit the knowledge base. Design a clean, 
professional, dark-mode operations interface. Must feel premium and 
purpose-built — not like a generic SaaS template. Include a sidebar, 
overview stat cards, a lead table, a conversation log, a bar chart for 
intents, and a knowledge base editor. Unique and memorable design.
```

---

## 13. Open Questions for Client Confirmation

1. **Owner email for alerts:** What email address should all n8n lead/complaint notifications go to?
2. **Digest day/time:** Monday 8 AM is assumed for the weekly digest — confirm or adjust.
3. **SMS alerts:** Does the owner want Twilio SMS for complaint escalation, or is email sufficient? If yes, provide mobile number.
4. **n8n access:** Does the owner want to set up n8n personally (using Section 8 guide) or should BoldFlow configure it directly on their n8n instance?
5. **Booking engine:** Confirm that `https://www.comfortshelby.com/click-reservation` is the preferred direct booking link (vs. Choice Hotels booking portal).
6. **Admin access:** Is the dashboard for the owner only, or does the front desk manager also need an account?
7. **Renovation timeline:** Is there an estimated date when pool, gym, elevator, and EV charger will reopen? If so, Elara can be programmed to stop the renovation disclosure after that date.

---

## 14. Deliverables Checklist

- [ ] Embeddable chat widget (`<script>` snippet, drops onto any page)
- [ ] Elara chatbot backend API (Next.js, Vercel)
- [ ] OpenAI GPT-5.4 mini agent with full hotel knowledge base + renovation notice
- [ ] Lead capture flow + database
- [ ] n8n unified workflow: `Elara — Hotel Automation Hub` (4 branches, 1 workflow)
- [ ] n8n setup guide (Section 8 of this document)
- [ ] Admin dashboard at `/elara-admin`
- [ ] Owner onboarding guide (PDF)
- [ ] Loom walkthrough video for the owner
- [ ] 30-day post-launch support window

---

*PRD v2.0 — Updated by BoldFlow Labs, May 2026. All changes from client review applied: chatbot renamed to Elara, hotel brand name corrected to Comfort Inn Shelby, design preferences removed, call button added to widget header, phone required in lead capture, n8n consolidated to one unified workflow, admin endpoint updated to `/elara-admin`, AI model updated to OpenAI GPT-5.4 mini (`gpt-5.4-mini-2026-03-17`), n8n beginner setup guide added, renovation status added to knowledge base.*