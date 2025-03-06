import { NextResponse } from "next/server";

export const maxDuration = 300; // 5 minutes

export async function POST(request: Request) {
  try {
    const input = await request.json();

    // Grab details from the Request, with defaults.
    const title = input.title ?? "Unknown Title";
    const sectionTitle = input.sectionTitle ?? "Unknown Section";
    const subtopic = input.subtopic ?? "Unknown Subtopic";


    const messages = [
      {
        role: "system",
        content:
          "You are an AI assistant specialized in creating study guides. " +
          "Write a very detailed note on the subsection " +
          subtopic +
          " on the subject " +
          title +
          " and subtitle " +
          sectionTitle +
          ". " +
          "The notes should be a string of very very comprehensive text with all the explanation, examples, etc. formatted with HTML and it should be responsive for each screen size and the font size consistent,professional, readable and same for all the texts and also DON'T EVER style the body element and the font size and spacing should make the text readable on even small devices. MAKE THE FONT SIZE AND FAMILY UNIFORM AND CONSISTANT THROUGHOUT DON'T INCLUDE  body {font-family: Arial, sans-serif line-height: 1.6; margin: 20px;padding: 10px;} AND REMOVE ANYTHINK LIKE ```html   " 
      },
      {
        role: "user", 
        content: JSON.stringify(input)
      }
    ];

    // Enable streaming
    const chatData = {
      model: "gpt-4o-mini", // or your chosen model
      stream: true,
      messages,
    };

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

    // Create a stream that extracts only the "delta.content" from each JSON chunk.
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

    // Return the stream with event stream headers so that the client receives plain text.
    return new NextResponse(stream, {
      headers: { "Content-Type": "text/event-stream" }
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
