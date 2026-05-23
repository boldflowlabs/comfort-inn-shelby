import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import OpenAI from "openai";

// ─── Rate Limiting ──────────────────────────────────────────────────
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 30; // max requests per window per session

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

// Auto-cleanup stale entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitMap) {
    if (now > entry.resetAt) rateLimitMap.delete(key);
  }
}, 5 * 60 * 1000);

function isRateLimited(sessionId: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(sessionId);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(sessionId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  entry.count++;
  return entry.count > RATE_LIMIT_MAX;
}

// Helper to trigger the n8n webhook
async function triggerN8nWebhook(payload: any) {
  const url = process.env.N8N_WEBHOOK_URL;
  if (!url) {
    console.warn("N8N_WEBHOOK_URL is not set.");
    return;
  }
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-elara-secret": process.env.JWT_SECRET || ""
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      console.error(`n8n Webhook returned status ${res.status}`);
    }
  } catch (e) {
    console.error("Failed to send webhook to n8n:", e);
  }
}

// Validation & Extraction helpers
function extractEmail(text: string): string | null {
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
  const match = text.match(emailRegex);
  return match ? match[0] : null;
}

function extractPhone(text: string): string | null {
  const cleanPhone = text.replace(/\D/g, "");
  if (cleanPhone.length < 7) {
    return null;
  }
  if (text.includes("@")) {
    return null;
  }
  const letterCount = (text.match(/[a-zA-Z]/g) || []).length;
  if (letterCount > 4 && letterCount > cleanPhone.length) {
    return null;
  }
  return cleanPhone;
}

function isValidEmail(email: string): boolean {
  return extractEmail(email) !== null;
}

function isValidPhone(phone: string): boolean {
  return extractPhone(phone) !== null;
}


function isValidComplaintDetails(details: string, guestName: string): boolean {
  const trimmed = details.trim().toLowerCase();
  if (trimmed.length < 8) return false;

  const fillerWords = [
    "hello", "hi", "hey", "good morning", "good afternoon", "good evening",
    "ok", "okay", "yes", "no", "none", "n/a", "nothing", "thanks", "thank you",
    "test", "testing", "please", "help"
  ];
  if (fillerWords.includes(trimmed)) return false;

  if (guestName) {
    const nameLower = guestName.toLowerCase();
    if (trimmed === nameLower) return false;

    const nameParts = nameLower.split(/\s+/).filter(part => part.length > 1);
    const detailParts = trimmed.split(/\s+/).filter(part => part.length > 1);

    const allWordsFromName = detailParts.every(word => nameParts.includes(word));
    if (allWordsFromName && detailParts.length > 0) return false;
  }

  return true;
}

function isValidComplaintContact(contact: string): boolean {
  const trimmed = contact.trim().toLowerCase();
  const skips = ["none", "no", "skip", "n/a", "none / n/a", "no contact"];
  if (skips.includes(trimmed)) return true;

  return isValidEmail(trimmed) || isValidPhone(trimmed);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, sessionId, history = [], leadStep = "inactive", leadData = null, complaintStep = "inactive", complaintData = null } = body;

    if (!message || !sessionId) {
      return NextResponse.json({ error: "Missing message or sessionId" }, { status: 400 });
    }

    // Rate limit check
    if (isRateLimited(sessionId)) {
      return NextResponse.json({
        response: "You're sending messages a bit too quickly. Please wait a moment and try again.",
        intent: "GENERAL_FAQ"
      }, { status: 429 });
    }

    // 1. Fetch latest Knowledge Base from DB
    const kbItems = await prisma.kbItem.findMany();
    const kbContext = kbItems
      .map((item) => `- [${item.category}] ${item.key}: ${item.value}`)
      .join("\n");

    // Get the renovation notice specifically to reinforce it
    const renovationNotice = kbItems.find(item => item.key === "notice")?.value || "";

    // 2. Create or find conversation
    let conversation = await prisma.conversation.findUnique({
      where: { sessionId }
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          sessionId,
          startedAt: new Date(),
          intentLog: JSON.stringify([]),
        }
      });
    }

    // 3. Save User Message to DB
    await prisma.message.create({
      data: {
        sessionId,
        role: "user",
        content: message,
        timestamp: new Date()
      }
    });

    // 4. Set up OpenAI Client
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey || apiKey === "your-openai-api-key-here") {
      return NextResponse.json({
        response: "I'm having a brief moment — please call us at 704-482-5666 for immediate help.",
        intent: "GENERAL_FAQ"
      });
    }

    const openai = new OpenAI({ apiKey });

    // 5. System Prompt defining personality and required JSON output format
    let systemPrompt = `You are Elara, the virtual concierge for Comfort Inn Shelby — a warm, award-winning hotel located at 2012 East Marion Street, Shelby, NC 28150.
Your job is to be the most knowledgeable, friendly, and genuinely helpful front desk representative for this hotel. You embody the spirit of southern hospitality: warm, unhurried, and caring. Never sound robotic or overly scripted.

YOUR NAME: Elara
YOUR EMPLOYER: Comfort Inn Shelby (a Comfort Inn® / Choice Hotels property)

CORE MISSION:
1. Answer any hotel-related question accurately using ONLY the knowledge provided below.
2. Guide interested guests toward booking — always prefer the direct booking link over third-party sites.
3. Collect guest contact information when they show booking intent (Conversational Lead Capture).
4. Escalate genuine in-stay complaints with immediate empathy and owner notification.
5. Proactively disclose renovation status (pool, gym, elevator, EV charger are currently unavailable) when asked about them.

CURRENT RENOVATION NOTICE:
"${renovationNotice}"

HOTEL KNOWLEDGE BASE:
${kbContext}

RULES:
- NEVER invent or fabricate room prices. Always say: "Rates vary by date — let me check today's best available price for you." and offer the booking link: https://www.comfortshelby.com/click-reservation
- NEVER mention competitor hotels.
- If you don't know something, say: "Let me make sure you get the right answer on that — please call our front desk directly at 704-482-5666."
- Always provide the direct reservation link for bookings: https://www.comfortshelby.com/click-reservation
- Detect the guest's language and respond in English, Spanish, or Japanese accordingly.
- After 2 exchanges or on booking intent, offer to send them the best rates via email/phone (e.g. "Would you like me to send you the best rate for your dates? I just need a couple of details — it takes less than a minute.").
- If you classify the user's intent as COMPLAINT_ESCALATED and they are not currently in the complaint capture flow (i.e. complaintStep is "inactive"), you MUST write a warm, empathetic response apologizing for the issue, ask for their name to start logging the complaint details, and set "nextComplaintStep" to "name" in your JSON output.

INTENT CLASSIFICATION SCHEME:
Classify the user's intent into one of the following:
- BOOKING_INTENT: Guest wants to book a room, check rates, or check availability.
- ROOM_INQUIRY: Questions about room types, amenities, or capacity.
- POLICY_INQUIRY: Pet, smoking, parking, check-in rules, deposit policies.
- AMENITY_INQUIRY: Questions about breakfast, pool, gym, Wi-Fi, business center.
- RENOVATION_INQUIRY: Questions about pool, gym, elevator, or EV charger status.
- LOCATION_INQUIRY: Directions, location, nearby restaurants, or attractions.
- COMPLAINT_ESCALATED: Current in-stay guest reporting an issue (needs front desk escalation).
- LEAD_CAPTURE: User is in the middle of providing their contact info or check-in details.
- GENERAL_FAQ: Any other standard greetings, generic questions, or queries.

OUTPUT FORMAT:
You MUST respond in valid JSON format. Your output should contain exactly these fields:
{
  "response": "Your friendly, warm conversational answer (formatted with markdown if appropriate)",
  "intent": "BOOKING_INTENT | ROOM_INQUIRY | POLICY_INQUIRY | AMENITY_INQUIRY | RENOVATION_INQUIRY | LOCATION_INQUIRY | COMPLAINT_ESCALATED | LEAD_CAPTURE | GENERAL_FAQ",
  "language": "en | es | ja",
  "complaintSummary": "A brief summary of the issue if the intent is COMPLAINT_ESCALATED, otherwise null",
  "nextComplaintStep": "inactive | name | room | contact | details | confirming"
}`;

    if (leadStep !== "inactive") {
      systemPrompt += `

--- AI-ASSISTED LEAD CAPTURE ACTIVE ---
The user is currently in a step-by-step lead capture flow to receive direct booking rates.
Current Step: "${leadStep}"
Lead Data collected so far: ${JSON.stringify(leadData)}

Your tasks for this step:
1. Analyze the user's message: "${message}".
2. Determine if they provided the information required for the current step "${leadStep}" based on these validation rules:
    - If "${leadStep}" is "name": Did they provide a name/first name? Accept any non-empty name (e.g., "John", "Sarah", "Bob", "Dr. Smith"). If they typed gibberish, "no", or "none", it is invalid.
    - If "${leadStep}" is "email": Did they provide a valid email format? (Must strictly contain "@" and a domain extension like ".com", ".net", etc., e.g., "alice@example.com"). If they typed an invalid email format, a phone number, gibberish, or just words without a valid email address, it is INVALID. You MUST set "leadValid" to false, "extractedValue" to null, and "nextStep" to "email".
    - If "${leadStep}" is "phone": Did they provide a valid phone number? Must strictly contain at least 7 digits (allow spaces, dashes, parentheses, plus signs, e.g., "+1 (704) 555-0100" or "7045550100"). If it contains fewer than 7 digits, is a plain email, or is just alphabetical words without a phone number, it is INVALID. You MUST set "leadValid" to false, "extractedValue" to null, and "nextStep" to "phone".
    - If "${leadStep}" is "date": Did they provide any check-in date description? Accept any date representation (e.g., "June 10", "tomorrow", "next Monday", "July 4th weekend") or flexible answers like "not sure yet" / "flexible". Do NOT require a year or strict format.
    - If "${leadStep}" is "room": Did they select or type any room preference? Accept any preference description (e.g., "King Bed", "2 Queens", "accessible", "anything", "no preference").

3. Check if the user is asking a question or expressing a concern/objection about this step (e.g., "why do you need my phone?", "is parking free?").
   - If they are asking a question or expressing a concern:
     - Answer their question/concern clearly and warmly using the hotel knowledge base (e.g. explain why we need it, or answer the unrelated hotel question).
     - Politely prompt them again for the information needed for the current step "${leadStep}".
     - You must output:
       "leadValid": false,
       "extractedValue": null,
       "nextStep": "${leadStep}" (do NOT advance to the next step)
   - If they did NOT provide a valid answer for "${leadStep}" and did NOT ask a question (e.g. they typed gibberish, an invalid email/phone, or an irrelevant statement):
     - Politely explain what is wrong or request the info again.
     - You must output:
       "leadValid": false,
       "extractedValue": null,
       "nextStep": "${leadStep}" (do NOT advance to the next step)
   - If they DID provide a valid answer for "${leadStep}":
     - Extract the clean value (e.g., just the name, the email, the phone digits, the date, or the room preference).
     - Determine the next step strictly according to these transitions:
       - If current step "${leadStep}" is "name", nextStep MUST be "email".
       - If current step "${leadStep}" is "email", nextStep MUST be "phone".
       - If current step "${leadStep}" is "phone", nextStep MUST be "date".
       - If current step "${leadStep}" is "date", nextStep MUST be "room".
       - If current step "${leadStep}" is "room", nextStep MUST be "confirming".
     - You must output:
       "leadValid": true,
       "extractedValue": "<the extracted clean value>",
       "nextStep": "<the next step in the sequence>"
     - For the "response" field, write a warm confirmation and ask the question for the next step:
       - If next step is "email": "Thanks, <Name>! What is your email address?"
       - If next step is "phone": "Got it. What phone number can we reach you at? (This is required to send your rate alerts)."
       - If next step is "date": "Perfect! What is your preferred check-in date? (e.g. June 10, or write 'Not sure yet')"
       - If next step is "room": "Great. What is your room preference? (e.g., King Bed, 2 Queens, or Accessible King)"
       - If next step is "confirming": "Perfect! Logging your details and generating your custom rates now..."

OUTPUT FORMAT FOR LEAD CAPTURE:
Since you are in the lead capture flow, your output JSON must include "leadValid", "extractedValue", and "nextStep" fields in addition to the standard fields:
{
  "response": "Your response text",
  "intent": "LEAD_CAPTURE",
  "language": "en | es | ja",
  "complaintSummary": null,
  "leadValid": true | false,
  "extractedValue": "extracted string or null",
  "nextStep": "name | email | phone | date | room | confirming"
}`;
    }

    if (complaintStep !== "inactive") {
      systemPrompt += `

--- AI-ASSISTED COMPLAINT CAPTURE ACTIVE ---
The user is currently in a step-by-step complaint registration flow to escalate an issue to the hotel owner/manager.
Current Step: "${complaintStep}"
Complaint Data collected so far: ${JSON.stringify(complaintData)}

Your tasks for this step:
1. Analyze the user's message: "${message}".
2. Determine if they provided the information required for the current step "${complaintStep}" based on these validation rules:
    - If "${complaintStep}" is "name": Did they provide a name? Accept any non-empty name (e.g. "John", "Sarah", "Dr. Bob"). If they just said "no" or "none" or gibberish, it's invalid.
    - If "${complaintStep}" is "room": Did they provide a room number or indicate they don't have one? (Accept numbers like "101", "Room 205", or statements like "no room", "none", "N/A", "none / n/a", "trying to book", "booking issue"). If they don't have a room or say "none" or "n/a", this is a 100% VALID answer. You MUST set "complaintValid" to true, extract "None" or "N/A", and transition nextComplaintStep to "contact". Do NOT ask them for further room details or clarification.
    - If "${complaintStep}" is "contact": Did they provide a contact phone number or email, or indicate they want to skip it? Must strictly contain a valid phone number (at least 7 digits), a valid email, or a skip keyword (like "none", "no", "skip", "n/a"). If they type a guest name, generic words, or gibberish, it is INVALID. You MUST set "complaintValid" to false, "extractedValue" to null, and "nextComplaintStep" to "contact".
    - If "${complaintStep}" is "details": Did they describe the complaint/issue in more detail? Must strictly be a descriptive sentence of the actual problem or issue. If they typed a guest name (such as repeating a name), short greetings (like "hi", "hello", "hey"), or short filler/acknowledgement words (like "ok", "yes", "no", "none"), it is strictly INVALID. They must describe the issue itself. If invalid, you MUST set "complaintValid" to false, "extractedValue" to null, and "nextComplaintStep" to "details".

3. Check if the user is asking a question or expressing a concern/objection about this step.
   - If they are asking a question or expressing a concern:
     - Answer their question/concern clearly and warmly using the hotel knowledge base.
     - Politely prompt them again for the information needed for the current step "${complaintStep}".
     - You must output:
       "complaintValid": false,
       "extractedValue": null,
       "nextComplaintStep": "${complaintStep}" (do NOT advance to the next step)
   - If they did NOT provide a valid answer for "${complaintStep}" and did NOT ask a question (e.g. they typed gibberish):
     - Politely explain what is wrong or request the info again.
     - You must output:
       "complaintValid": false,
       "extractedValue": null,
       "nextComplaintStep": "${complaintStep}" (do NOT advance to the next step)
   - If they DID provide a valid answer for "${complaintStep}":
     - Extract the clean value (e.g., the name, the room number, the contact info, or the details description).
     - Determine the next step strictly according to these transitions:
       - If current step "${complaintStep}" is "name", nextComplaintStep MUST be "room".
       - If current step "${complaintStep}" is "room", nextComplaintStep MUST be "contact".
       - If current step "${complaintStep}" is "contact", nextComplaintStep MUST be "details".
       - If current step "${complaintStep}" is "details", nextComplaintStep MUST be "confirming".
     - You must output:
       "complaintValid": true,
       "extractedValue": "<the extracted clean value>",
       "nextComplaintStep": "<the next step in the sequence>"
     - For the "response" field, write a warm confirmation and ask the question for the next step:
       - If next step is "room": "Got it. What room number are you staying in? (If you don't have a room or this is a general/booking issue, just let me know)."
       - If next step is "contact": "Thank you. What is a good phone number or email we can reach you at to follow up?"
       - If next step is "details": "Thank you. Could you please provide some more details about the complaint? (e.g. what exactly is happening, or any other helpful info)."
       - If next step is "confirming": "Perfect! Logging your complaint details and alerting management now..."

OUTPUT FORMAT FOR COMPLAINT CAPTURE:
Since you are in the complaint capture flow, your output JSON must include "complaintValid", "extractedValue", and "nextComplaintStep" fields in addition to the standard fields:
{
  "response": "Your response text",
  "intent": "COMPLAINT_ESCALATED",
  "language": "en | es | ja",
  "complaintSummary": "A brief summary of the issue",
  "complaintValid": true | false,
  "extractedValue": "extracted string or null",
  "nextComplaintStep": "name | room | contact | details | confirming"
}`;
    }

    // Format chat messages
    const apiMessages: any[] = [
      { role: "system", content: systemPrompt },
      ...history.map((h: any) => ({
        role: h.role === "user" ? "user" : "assistant",
        content: typeof h.content === "object" ? JSON.stringify(h.content) : h.content
      })),
      { role: "user", content: message }
    ];

    // 6. Request Completion with fallback model mechanism
    let modelName = process.env.OPENAI_MODEL || "gpt-4o-mini";
    let chatCompletion;

    try {
      chatCompletion = await openai.chat.completions.create({
        model: modelName,
        messages: apiMessages,
        response_format: { type: "json_object" }
      });
    } catch (openaiErr: any) {
      console.warn(`Model ${modelName} failed or unavailable. Falling back to gpt-4o-mini. Error:`, openaiErr.message);
      modelName = "gpt-4o-mini";
      chatCompletion = await openai.chat.completions.create({
        model: modelName,
        messages: apiMessages,
        response_format: { type: "json_object" }
      });
    }

    const responseContent = chatCompletion.choices[0]?.message?.content || "{}";
    let parsedResponse = {
      response: "I'm having a brief moment — please call us at 704-482-5666 for immediate help.",
      intent: "GENERAL_FAQ",
      language: "en",
      complaintSummary: null as string | null,
      leadValid: false as boolean,
      extractedValue: null as string | null,
      nextStep: "inactive",
      complaintValid: false as boolean,
      nextComplaintStep: "inactive"
    };

    try {
      parsedResponse = JSON.parse(responseContent);
    } catch (parseErr) {
      console.error("Failed to parse OpenAI JSON output:", responseContent);
    }

    // Programmatic Validation Overrides
    if (leadStep === "email") {
      const extracted = extractEmail(message);
      if (extracted) {
        parsedResponse.leadValid = true;
        parsedResponse.extractedValue = extracted;
        parsedResponse.nextStep = "phone";
        parsedResponse.response = `Thank you! Got your email: **${extracted}**. What phone number can we reach you at? (This is required to send your rate alerts).`;
        parsedResponse.intent = "BOOKING_IN_PROGRESS";
        
        // Trigger BOOKING_IN_PROGRESS webhook asynchronously
        triggerN8nWebhook({
          event_type: "BOOKING_IN_PROGRESS",
          session_id: sessionId,
          timestamp: new Date().toISOString(),
          guest: {
            email: extracted
          }
        });
      } else {
        parsedResponse.leadValid = false;
        parsedResponse.extractedValue = null;
        parsedResponse.nextStep = "email";
        parsedResponse.response = "That doesn't look like a valid email address. Could you please provide a valid email (e.g., guest@example.com)?";
      }
    } else if (leadStep === "phone") {
      const extracted = extractPhone(message);
      if (extracted) {
        parsedResponse.leadValid = true;
        parsedResponse.extractedValue = extracted;
        parsedResponse.nextStep = "date";
        parsedResponse.response = `Perfect, got it! What is your preferred check-in date? (e.g. June 10, or write 'Not sure yet')`;
      } else {
        parsedResponse.leadValid = false;
        parsedResponse.extractedValue = null;
        parsedResponse.nextStep = "phone";
        parsedResponse.response = "That doesn't look like a valid phone number. Please provide a phone number with at least 7 digits (e.g., 704-482-5666).";
      }
    }

    if (complaintStep === "room") {
      const trimmed = message.trim().toLowerCase();
      const isNa = ["none", "no", "skip", "n/a", "none / n/a", "no room"].includes(trimmed);
      if (isNa) {
        parsedResponse.complaintValid = true;
        parsedResponse.extractedValue = "None";
        parsedResponse.nextComplaintStep = "contact";
        parsedResponse.response = "Thank you. What is a good phone number or email we can reach you at to follow up?";
      } else {
        parsedResponse.complaintValid = true;
        parsedResponse.extractedValue = message.trim();
        parsedResponse.nextComplaintStep = "contact";
        parsedResponse.response = "Thank you. What is a good phone number or email we can reach you at to follow up?";
      }
    } else if (complaintStep === "contact") {
      const trimmed = message.trim().toLowerCase();
      const isSkip = ["none", "no", "skip", "n/a", "none / n/a", "no contact"].includes(trimmed);
      if (isSkip) {
        parsedResponse.complaintValid = true;
        parsedResponse.extractedValue = "None";
        parsedResponse.nextComplaintStep = "details";
        parsedResponse.response = "Thank you. Could you please provide some more details about the complaint? (e.g. what exactly is happening, or any other helpful info).";
      } else {
        const emailExtracted = extractEmail(message);
        const phoneExtracted = extractPhone(message);
        if (emailExtracted || phoneExtracted) {
          parsedResponse.complaintValid = true;
          parsedResponse.extractedValue = emailExtracted || phoneExtracted;
          parsedResponse.nextComplaintStep = "details";
          parsedResponse.response = "Thank you. Could you please provide some more details about the complaint? (e.g. what exactly is happening, or any other helpful info).";
        } else {
          parsedResponse.complaintValid = false;
          parsedResponse.extractedValue = null;
          parsedResponse.nextComplaintStep = "contact";
          parsedResponse.response = "Please provide a valid email address or phone number so we can contact you, or say 'skip' to move to the next step.";
        }
      }
    } else if (complaintStep === "details") {
      const gName = complaintData?.guestName || "";
      if (isValidComplaintDetails(message, gName)) {
        parsedResponse.complaintValid = true;
        parsedResponse.extractedValue = message.trim();
        parsedResponse.nextComplaintStep = "confirming";
        parsedResponse.response = "Perfect! Logging your complaint details and alerting management now...";
      } else {
        parsedResponse.complaintValid = false;
        parsedResponse.extractedValue = null;
        parsedResponse.nextComplaintStep = "details";
        parsedResponse.response = "Could you please describe the actual issue or complaint itself in detail (rather than a name, greeting, or short filler words)? This helps our team address the problem.";
      }
    }


    // 7. Process intents and update DB state
    const currentIntents = JSON.parse(conversation.intentLog || "[]");
    if (!currentIntents.includes(parsedResponse.intent)) {
      currentIntents.push(parsedResponse.intent);
    }

    const updateData: any = {
      intentLog: JSON.stringify(currentIntents),
      language: parsedResponse.language || "en"
    };

    // If complaint intent is detected, flag it
    if (parsedResponse.intent === "COMPLAINT_ESCALATED") {
      updateData.complaintFlagged = true;
    }

    await prisma.conversation.update({
      where: { sessionId },
      data: updateData
    });

    // 8. Save Assistant Message to DB
    await prisma.message.create({
      data: {
        sessionId,
        role: "assistant",
        content: parsedResponse.response,
        intentDetected: parsedResponse.intent,
        timestamp: new Date()
      }
    });

    return NextResponse.json({
      response: parsedResponse.response,
      intent: parsedResponse.intent,
      language: parsedResponse.language,
      leadValid: parsedResponse.leadValid ?? false,
      extractedValue: parsedResponse.extractedValue ?? null,
      nextStep: parsedResponse.nextStep ?? "inactive",
      complaintValid: parsedResponse.complaintValid ?? false,
      nextComplaintStep: parsedResponse.nextComplaintStep ?? "inactive",
      complaintSummary: parsedResponse.complaintSummary ?? null
    });

  } catch (error: any) {
    console.error("Error in /api/chat:", error);
    return NextResponse.json({
      response: "I'm having a brief moment — please call us at 704-482-5666 for immediate help.",
      intent: "GENERAL_FAQ"
    }, { status: 500 });
  }
}
