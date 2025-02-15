import { NextResponse } from "next/server";

export const maxDuration = 300; // 5 minutes

export async function POST(request: Request) {
  try {
    const input = await request.json();

    // Grab details from the Request, with defaults.
    const topicChain = input.topicChain ?? "";
    const followUpQuestion = input.followUpQuestion || ""; // if provided

    // Build the system prompt based on whether this is a follow-up request.
    let systemContent = "";
    if (followUpQuestion.trim() !== "") {
      // Dive deeper (follow-up) prompt using the provided selectedSubtopic and selectedSubSubtopic.
      systemContent =
        "You are an AI assistant specialized in creating study guides. " +
        "This is a follow-up (dive deeper) request. " +
        "Based on the topic context provided " +
        topicChain +
        "', please provide additional response to address the following follow-up question: " +
        followUpQuestion +
        ". " +
        "Your answer should be formatted in HTML, be responsive for all screen sizes, and use consistent, readable font sizes without any colors or background colors." +
        "Avoid using any colors or background-colors, and remove any markdown or code block formatting and styling for body (e.g., ```html).";

        ;
    } else {
      // Standard note generation.
      systemContent =
        "You are an AI assistant specialized in creating study guides. " +
        "Ask the user to ask a question '" +
       
        "'. " +
        "Ensure the content is responsive for all screen sizes with a consistent, readable font size. " +
        "Avoid using any colors or background-colors, and remove any markdown or code block formatting and styling for body (e.g., ```html).";
    }

    // Create messages to send to the OpenAI API.
    const messages = [
      {
        role: "system",
        content: systemContent,
      },
      {
        role: "user",
        // We pass the entire input for context if needed.
        content: JSON.stringify(input),
      },
    ];

    // Prepare the chat data with streaming enabled.
    const chatData = {
      model: "gpt-4o-mini", // replace with your chosen model if necessary
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
        "Content-Type": "application/json",
      },
      body: JSON.stringify(chatData),
    });

    if (!openaiRes.ok) {
      const errText = await openaiRes.text();
      return NextResponse.json(
        { error: "OpenAI API request failed", details: errText },
        { status: openaiRes.status }
      );
    }

    // Create a ReadableStream to extract only the delta.content from each JSON chunk.
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
          // Decode the chunk and accumulate.
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          // Process each complete line.
          for (let i = 0; i < lines.length - 1; i++) {
            let line = lines[i].trim();
            if (line.startsWith("data:")) {
              line = line.replace(/^data:\s*/, "");
              if (line === "[DONE]") continue;
              try {
                const parsed = JSON.parse(line);
                const delta = parsed.choices?.[0]?.delta?.content;
                if (delta) {
                  // Enqueue the content delta as a UTF-8 encoded chunk.
                  controller.enqueue(new TextEncoder().encode(delta));
                }
              } catch (err) {
                console.error("Error parsing chunk:", err);
              }
            }
          }
          // Keep any incomplete line for the next iteration.
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
      },
    });

    // Return the streaming response with the appropriate event stream header.
    return new NextResponse(stream, {
      headers: { "Content-Type": "text/event-stream" },
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
