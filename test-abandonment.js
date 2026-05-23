const { PrismaClient } = require("@prisma/client");
const { PrismaBetterSqlite3 } = require("@prisma/adapter-better-sqlite3");

// Initialize Prisma exactly as the app does
const adapter = new PrismaBetterSqlite3({
  url: "file:./dev.db"
});
const prisma = new PrismaClient({ adapter });

const sessionId = "test_abandon_session_" + Math.random().toString(36).substring(2, 7);
const testEmail = "test_abandon_" + Math.random().toString(36).substring(2, 7) + "@example.com";

async function runTest() {
  console.log("Starting Abandoned Booking Feature Test...");
  console.log(`Using Session ID: ${sessionId}`);
  console.log(`Using Test Email: ${testEmail}`);

  try {
    // 1. Create a conversation that looks active 45 minutes ago and has booking intent but leadCaptured = false
    console.log("\nStep 1: Inserting mock conversation into database...");
    await prisma.conversation.create({
      data: {
        sessionId,
        startedAt: new Date(Date.now() - 45 * 60 * 1000), // 45 mins ago
        leadCaptured: false,
        intentLog: JSON.stringify(["BOOKING_INTENT"]),
        language: "en"
      }
    });
    console.log("Mock conversation created in DB.");

    // 2. Insert a user message containing a valid email address
    console.log("\nStep 2: Inserting user message containing email...");
    await prisma.message.create({
      data: {
        sessionId,
        role: "user",
        content: `Hi, I am interested in booking a room. My email is ${testEmail}`,
        timestamp: new Date(Date.now() - 45 * 60 * 1000)
      }
    });
    console.log("Mock message created.");

    // 3. Trigger the abandonment scan endpoint
    console.log("\nStep 3: Triggering abandonment scan endpoint (/api/event?action=scan_abandonment)...");
    console.log("Make sure you click 'Listen for test event' or 'Execute workflow' on your n8n canvas first!");
    
    const scanUrl = "http://localhost:3000/api/event?action=scan_abandonment";
    const res = await fetch(scanUrl, { method: "GET" });
    const data = await res.json();
    console.log("API Response Status:", res.status);
    console.log("API Response Body:", JSON.stringify(data, null, 2));

    // 4. Verify DB changes
    console.log("\nStep 4: Verifying database updates...");
    
    // Check conversation intent log
    const updatedConv = await prisma.conversation.findUnique({
      where: { sessionId }
    });
    const intents = JSON.parse(updatedConv.intentLog || "[]");
    const hasAbandonedIntent = intents.includes("BOOKING_ABANDONED");
    console.log(`- Conversation intentLog has 'BOOKING_ABANDONED': ${hasAbandonedIntent}`);

    // Check if lead was created
    const createdLead = await prisma.lead.findFirst({
      where: { email: testEmail }
    });
    const leadCreatedSuccessfully = !!createdLead;
    console.log(`- Lead record created with email '${testEmail}': ${leadCreatedSuccessfully}`);
    if (leadCreatedSuccessfully) {
      console.log(`  Lead details: Name: "${createdLead.firstName}", Source: "${createdLead.sourcePage}", Created: ${createdLead.createdAt}`);
    }

    if (hasAbandonedIntent && leadCreatedSuccessfully) {
      console.log("\n🎉 SUCCESS: The abandoned booking feature works perfectly!");
    } else {
      console.log("\n❌ FAILURE: Validation checks failed. If n8n webhook returned 404, verify n8n is actively listening.");
    }

    // 5. Cleanup test data
    console.log("\nStep 5: Cleaning up test data from database...");
    await prisma.lead.deleteMany({
      where: { email: testEmail }
    });
    await prisma.conversation.delete({
      where: { sessionId }
    });
    console.log("Database cleaned up successfully.");

  } catch (err) {
    console.error("Test execution failed with error:", err.message);
  } finally {
    await prisma.$disconnect();
  }
}

runTest();
