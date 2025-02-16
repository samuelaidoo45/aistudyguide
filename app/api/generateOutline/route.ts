// app/api/generateOutline/route.ts
import { NextResponse } from "next/server";

export const maxDuration = 300; // 5 minutes

export async function POST(request: Request) {
  try {
    const input = await request.json();

    // Ensure the action is for generating the main outline in HTML
    if (input.action !== "generateOutlineHTML") {
      return NextResponse.json(
        { error: "Invalid action for generateOutlineHTML endpoint" },
        { status: 400 }
      );
    }

    // Define an HTML example for demonstration.
    const htmlExample = `
<div class="outline-sections">
  <div class="section-card">
    <h3 class="section-title">
      <i data-lucide="chevron-down"></i> Chapter 1
    </h3>
    <div class="subsection-container">
      <div class="subtopic-item">
        <span>Fundamental principles</span>
        <i data-lucide="chevron-right"></i>
      </div>
      <div class="subtopic-item">
        <span>Key terminology</span>
        <i data-lucide="chevron-right"></i>
      </div>
    </div>
  </div>
  <div class="section-card">
    <h3 class="section-title">
      <i data-lucide="chevron-down"></i> Chapter 2
    </h3>
    <div class="subsection-container">
      <div class="subtopic-item">
        <span>Advanced theories</span>
        <i data-lucide="chevron-right"></i>
      </div>
      <div class="subtopic-item">
        <span>Current research</span>
        <i data-lucide="chevron-right"></i>
      </div>
    </div>
  </div>
  <div class="section-card">
    <h3 class="section-title">
      <i data-lucide="chevron-down"></i> Chapter 3
    </h3>
    <div class="subsection-container">
      <div class="subtopic-item">
        <span>Practical applications</span>
        <i data-lucide="chevron-right"></i>
      </div>
      <div class="subtopic-item">
        <span>Future implications</span>
        <i data-lucide="chevron-right"></i>
      </div>
    </div>
  </div>
</div>
`;

    // Set up the system and user messages.
    const messages = [
      {
        role: "system",
        content:
          "You are an AI assistant specialized in creating study guides. " +
          "When given a topic, create a very detailed outline that encompasses all that needs to be known for the topic. " +
          "Generate a very dynamic outline and it should be exactly as the example generate the best outline needed.The outline should cover all needed to known. When asked about a specific subtopic, provide detailed notes. " +
          "Output only a complete HTML snippet that exactly follows the structure below. Do not include any extra commentary or markdown formatting.\n\n" +
          htmlExample +
          "\n\n" +
          "Now, generate the HTML outline for the following topic."
      },
      {
        role: "user",
        content: JSON.stringify(input)
      }
    ];

    const chatData = {
      model: "gpt-4o-mini", // or your preferred model
      stream: true,
      messages
    };

    // Get the OpenAI API key from environment variables.
    const openaiApiKey = process.env.OPENAI_KEY;
    if (!openaiApiKey) {
      return NextResponse.json(
        { error: "OpenAI API key is not configured" },
        { status: 500 }
      );
    }

    const chatUrl = "https://api.openai.com/v1/chat/completions";
    const openaiRes = await fetch(chatUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openaiApiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(chatData)
    });

    if (!openaiRes.ok) {
      const errText = await openaiRes.text();
      return NextResponse.json(
        { error: "OpenAI API request failed", details: errText },
        { status: openaiRes.status }
      );
    }

    // Create a stream to process the OpenAI response and output HTML as it's received.
    const stream = new ReadableStream({
      async start(controller) {
        const reader = openaiRes.body?.getReader();
        if (!reader) {
          controller.close();
          return;
        }
        const decoder = new TextDecoder("utf-8");
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");

          for (let i = 0; i < lines.length - 1; i++) {
            let line = lines[i].trim();
            if (line.startsWith("data:")) {
              line = line.replace(/^data:\s*/, "");
              if (line === "[DONE]") continue;
              try {
                const parsed = JSON.parse(line);
                const delta = parsed.choices?.[0]?.delta?.content;
                if (delta) {
                  controller.enqueue(new TextEncoder().encode(delta));
                }
              } catch (err) {
                console.error("Error parsing chunk:", err);
              }
            }
          }
          buffer = lines[lines.length - 1];
        }
        if (buffer.trim() && !buffer.includes("[DONE]")) {
          try {
            const parsed = JSON.parse(buffer.trim());
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              controller.enqueue(new TextEncoder().encode(delta));
            }
          } catch (err) {
            console.error("Error parsing final buffer:", err);
          }
        }
        controller.close();
      }
    });

    return new NextResponse(stream, {
      headers: {
        "Content-Type": "text/event-stream"
      }
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      return NextResponse.json(
        { error: "Server error", details: error.message },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { error: "Server error", details: "Unknown error" },
      { status: 500 }
    );
  }
}
