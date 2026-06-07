import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyJwt } from "@/lib/jwt";

// Auth check for protected endpoints
function isAuthenticated(req: NextRequest): boolean {
  // 1. Check admin login session token from cookie
  const token = req.cookies.get("elara_admin_token")?.value;
  if (token) {
    const decoded = verifyJwt(token, process.env.JWT_SECRET || "");
    if (decoded) return true;
  }

  // 2. Check custom header secret for external/automated triggers (like n8n cron scans)
  const secretHeader = req.headers.get("x-elara-secret");
  const secret = process.env.JWT_SECRET || "";
  if (secretHeader && secretHeader === secret) {
    return true;
  }

  return false;
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
    return res.ok;
  } catch (e) {
    console.error("Failed to send webhook to n8n:", e);
    return false;
  }
}

// Function to scan for abandoned bookings (can be run periodically)
async function scanAndProcessAbandonment() {
  const abandonmentTimeThreshold = new Date(Date.now() - 30 * 60 * 1000); // 30 minutes of inactivity

  // Find conversations that started earlier than 30 mins ago, aren't marked as lead captured,
  // and haven't already fired a booking abandoned event.
  const activeConversations = await prisma.conversation.findMany({
    where: {
      leadCaptured: false,
      startedAt: {
        lt: abandonmentTimeThreshold
      }
    },
    include: {
      messages: {
        orderBy: {
          timestamp: "asc"
        }
      }
    }
  });

  let processedCount = 0;

  for (const conv of activeConversations) {
    // 1. Evaluate inactivity threshold based on the last message in the thread
    const lastMessage = conv.messages[conv.messages.length - 1];
    const lastActivity = lastMessage ? lastMessage.timestamp : conv.startedAt;
    if (lastActivity >= abandonmentTimeThreshold) {
      // The guest had activity within the 30-minute threshold. Skip (not abandoned yet).
      continue;
    }

    const intents = JSON.parse(conv.intentLog || "[]");
    
    // Check if they showed booking intent or entered the lead capture flow, and haven't already been marked abandoned
    const hasBookingIntent = intents.includes("BOOKING_INTENT") || intents.includes("LEAD_CAPTURE");
    const alreadyAbandoned = intents.includes("BOOKING_ABANDONED");

    if (hasBookingIntent && !alreadyAbandoned) {
      // Initialize guest detail fields
      let email: string | null = null;
      let phone: string = "Not provided";
      let firstName: string = "Valued Guest";
      let roomPreference: string = "King";
      let checkinDate: string = "Not selected";

      // 2. Sequential extraction from message flow (highly accurate reconstruct of form entries)
      for (let i = 0; i < conv.messages.length; i++) {
        const msg = conv.messages[i];
        if (msg.role === "assistant") {
          const contentLower = msg.content.toLowerCase();
          const nextMsg = conv.messages[i + 1];
          if (nextMsg && nextMsg.role === "user") {
            const val = nextMsg.content.trim();
            if (contentLower.includes("first name?")) {
              const match = val.match(/^([a-zA-Z]+)/);
              if (match) {
                firstName = match[1];
              } else {
                firstName = val;
              }
            } else if (contentLower.includes("email address?")) {
              const match = val.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
              if (match) {
                email = match[0];
              }
            } else if (contentLower.includes("phone number")) {
              phone = val;
            } else if (contentLower.includes("check-in date?")) {
              checkinDate = val;
            } else if (contentLower.includes("room preference?")) {
              roomPreference = val;
            }
          }
        }
      }

      // 3. Fallbacks if sequential extraction didn't capture the fields
      if (!email) {
        const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
        for (const msg of conv.messages) {
          if (msg.role === "user") {
            const match = msg.content.match(emailRegex);
            if (match) {
              email = match[0];
              break;
            }
          }
        }
      }

      if (firstName === "Valued Guest") {
        for (const msg of conv.messages) {
          if (msg.role === "user") {
            const nameMatch = msg.content.match(/my name is ([a-zA-Z]+)/i) || 
                              msg.content.match(/i'm ([a-zA-Z]+)/i) ||
                              msg.content.match(/i am ([a-zA-Z]+)/i);
            if (nameMatch && nameMatch[1]) {
              firstName = nameMatch[1];
              break;
            }
          }
        }
      }

      // If an email was found, this is a candidate for booking abandonment re-engagement!
      if (email) {
        // Send BOOKING_ABANDONED event to n8n (Branch C)
        const success = await triggerN8nWebhook({
          event_type: "BOOKING_ABANDONED",
          session_id: conv.sessionId,
          timestamp: new Date().toISOString(),
          guest: {
            name: firstName,
            email,
            phone,
            checkin_date: checkinDate,
            room_preference: roomPreference
          }
        });

        if (success) {
          // Log in database
          intents.push("BOOKING_ABANDONED");
          await prisma.conversation.update({
            where: { id: conv.id },
            data: {
              intentLog: JSON.stringify(intents)
            }
          });

          // Log in Lead table as a "partial/abandoned" lead so it appears in the dashboard!
          await prisma.lead.create({
            data: {
              sessionId: conv.sessionId,
              firstName,
              email,
              phone: phone && phone !== "Not provided" ? phone : "Abandoned (Email only)",
              checkinDate,
              roomPreference,
              sourcePage: "Abandoned Chat Flow",
              createdAt: new Date(),
              followupSentAt: new Date() // Marked as follow-up sent
            }
          });

          processedCount++;
        }
      }
    }
  }

  return processedCount;
}

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action");

    if (action === "scan_abandonment") {
      if (!isAuthenticated(req)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      const count = await scanAndProcessAbandonment();
      return NextResponse.json({ success: true, message: `Scanned and processed ${count} abandoned booking(s).` });
    }

    // Standard event proxying
    const body = await req.json();
    const { event_type, session_id, payload = {} } = body;

    if (!event_type) {
      return NextResponse.json({ error: "Missing event_type" }, { status: 400 });
    }

    const success = await triggerN8nWebhook({
      event_type,
      session_id: session_id || "direct",
      timestamp: new Date().toISOString(),
      ...payload
    });

    return NextResponse.json({ success });

  } catch (error: any) {
    console.error("Error in /api/event:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action");

    if (action === "scan_abandonment") {
      if (!isAuthenticated(req)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      const count = await scanAndProcessAbandonment();
      return NextResponse.json({ success: true, message: `Scanned and processed ${count} abandoned booking(s).` });
    }

    return NextResponse.json({ message: "API is active. Use POST to trigger events or ?action=scan_abandonment to scan." });
  } catch (error) {
    console.error("Error in /api/event GET:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Auto-run abandonment scan periodically in persistent/dev environments
const globalForScheduler = global as unknown as { abandonmentIntervalId?: NodeJS.Timeout };

if (process.env.NODE_ENV !== "production" || !process.env.VERCEL) {
  if (!globalForScheduler.abandonmentIntervalId) {
    globalForScheduler.abandonmentIntervalId = setInterval(async () => {
      try {
        console.log("[Auto-Scheduler] Scanning for abandoned bookings...");
        const count = await scanAndProcessAbandonment();
        if (count > 0) {
          console.log(`[Auto-Scheduler] Successfully processed ${count} abandoned booking(s).`);
        }
      } catch (err) {
        console.error("[Auto-Scheduler] Failed to run automated abandonment scan:", err);
      }
    }, 10 * 60 * 1000); // Scan every 10 minutes
  }
}
