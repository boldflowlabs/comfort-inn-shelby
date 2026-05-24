import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyJwt } from "@/lib/jwt";

// Auth check for protected endpoints
function isAuthenticated(req: NextRequest): boolean {
  const token = req.cookies.get("elara_admin_token")?.value;
  if (!token) return false;
  const decoded = verifyJwt(token, process.env.JWT_SECRET || "");
  return !!decoded;
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
    const intents = JSON.parse(conv.intentLog || "[]");
    
    // Check if they showed booking intent and haven't already been marked abandoned
    const hasBookingIntent = intents.includes("BOOKING_INTENT");
    const alreadyAbandoned = intents.includes("BOOKING_ABANDONED");

    if (hasBookingIntent && !alreadyAbandoned) {
      // Look for an email in message content
      let email: string | null = null;
      let firstName: string = "Valued Guest";
      const roomPreference: string = "King";
      const checkinDate: string = "Not selected";

      // Simple regex for email detection
      const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;

      for (const msg of conv.messages) {
        if (msg.role === "user") {
          const match = msg.content.match(emailRegex);
          if (match) {
            email = match[0];
          }
        }
      }

      // If an email was found, this is a candidate for booking abandonment re-engagement!
      if (email) {
        // Try to guess first name from user messages
        // (Simple check for "my name is X" or similar, or just default to Guest)
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

        // Send BOOKING_ABANDONED event to n8n (Branch C)
        const success = await triggerN8nWebhook({
          event_type: "BOOKING_ABANDONED",
          session_id: conv.sessionId,
          timestamp: new Date().toISOString(),
          guest: {
            name: firstName,
            email,
            phone: "Not provided",
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
              phone: "Abandoned (Email only)",
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
