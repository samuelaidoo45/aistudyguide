import { NextResponse } from "next/server";

export const maxDuration = 300; // 5 minutes

export async function POST(request: Request) {
  try {
    const input = await request.json();

    // Ensure the action is for generating an outline
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
      <i data-lucide="chevron-down"></i> Section 1
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
      <i data-lucide="chevron-down"></i> Section 2
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
      <i data-lucide="chevron-down"></i> Section 3
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

    const messages = [
      {
        role: "system",
        content:
          "You are an AI assistant specialized in creating study guides. " +
          "When given an outline is clicked, create a very detailed sub-outline that encompasses all that needs to be known for the outline, output only a complete HTML snippet " +
          "that exactly follows the structure below. Do not include any extra text, commentary, or markdown formatting. " +
          "The HTML should be a set of nested elements that looks like this:\n\n" +
          htmlExample +
          "\n\n" +
          "Now, generate the HTML for the sub‑outline based on the user's input. The sub outline should not be realistic as if it a book" +
          "Replace the section titles and subsection titles as appropriate, but keep the overall structure intact."
      },
      {
        role: "user",
        content: JSON.stringify(input)
      }
    ];

    // Prepare chat data with streaming enabled.
    const chatData = {
      model: "gpt-4o-mini", // or your preferred model
      stream: true,
      messages
    };

    // Check for OpenAI key.
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
        Authorization: `Bearer ${openaiApiKey}`,
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

    // Create a stream that outputs HTML directly as it is received.
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
          // Decode and accumulate
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          // Process each complete line
          for (let i = 0; i < lines.length - 1; i++) {
            let line = lines[i].trim();
            if (line.startsWith("data:")) {
              line = line.replace(/^data:\s*/, "");
              if (line === "[DONE]") continue;
              try {
                const parsed = JSON.parse(line);
                const delta = parsed.choices?.[0]?.delta?.content;
                if (delta) {
                  // Enqueue only the notes text delta.
                  controller.enqueue(new TextEncoder().encode(delta));
                }
              } catch (err) {
                console.error("Error parsing chunk:", err);
              }
            }
          }
          // Keep the last incomplete line in buffer
          buffer = lines[lines.length - 1];
        }
        // Process any remaining buffered data.
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

    // Return the streamed HTML with a Content-Type header that encourages streaming.
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