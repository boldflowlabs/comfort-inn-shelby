import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sessionId, firstName, email, phone, checkinDate, roomPreference, sourcePage } = body;

    if (!firstName || !email || !phone) {
      return NextResponse.json({ error: "Missing required fields: firstName, email, phone" }, { status: 400 });
    }

    // 1. Save Lead to DB
    const lead = await prisma.lead.create({
      data: {
        sessionId,
        firstName,
        email,
        phone,
        checkinDate,
        roomPreference,
        sourcePage: sourcePage || "Direct Chat",
        createdAt: new Date()
      }
    });

    // 2. Update Conversation state if sessionId exists
    if (sessionId) {
      const conversation = await prisma.conversation.findUnique({
        where: { sessionId }
      });

      if (conversation) {
        const currentIntents = JSON.parse(conversation.intentLog || "[]");
        if (!currentIntents.includes("LEAD_CAPTURE")) {
          currentIntents.push("LEAD_CAPTURE");
        }

        await prisma.conversation.update({
          where: { sessionId },
          data: {
            leadCaptured: true,
            intentLog: JSON.stringify(currentIntents)
          }
        });
      }
    }

    // 3. Trigger n8n webhook with LEAD_CAPTURED event (Branch A)
    await triggerN8nWebhook({
      event_type: "LEAD_CAPTURED",
      session_id: sessionId || "none",
      timestamp: new Date().toISOString(),
      guest: {
        name: firstName,
        email,
        phone,
        checkin_date: checkinDate || "Not provided",
        room_preference: roomPreference || "King"
      }
    });

    return NextResponse.json({ success: true, leadId: lead.id });

  } catch (error: any) {
    console.error("Error in /api/lead:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
