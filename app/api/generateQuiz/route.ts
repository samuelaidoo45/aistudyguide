import { NextResponse } from "next/server";

export const maxDuration = 300; // 5 minutes

export async function POST(request: Request) {
  try {
    const input = await request.json();

    // Grab details from the Request
    const title = input.title ?? "";
    const sectionTitle = input.sectionTitle ?? "";
    const subtopic = input.subtopic ?? "";

    // Build the system prompt
    const systemContent =
      "You are an AI assistant specialized in creating educational quizzes. " +
      "Based on the following topic hierarchy: " +
      "Main Topic: '" + title + "', " +
      "Section: '" + sectionTitle + "', " +
      "Subtopic: '" + subtopic + "', " +
      "create a quiz with 5 questions to test the user's understanding. " +
      "For each question, provide 4 multiple-choice options with only one correct answer. " +
      "Format the quiz in HTML with the following structure: " +
      "1. Each question should be in a div with class 'quiz-question' " +
      "2. Each option should be in a div with class 'quiz-option' and have a data attribute 'data-correct' set to 'true' for the correct answer and 'false' for incorrect answers " +
      "3. Include a button with class 'quiz-check-btn' after each question that says 'Check Answer' " +
      "4. Include a div with class 'quiz-feedback' after the button in each question " +
      "5. At the end, include a div with class 'quiz-score' to show the final score " +
      "IMPORTANT REQUIREMENTS: " +
      "- Do NOT wrap your response in ```html``` or any code block formatting " +
      "- Do NOT include any <style> tags or inline styles " +
      "- Do NOT add any margins, paddings, or any other CSS to the body or container elements " +
      "- Do NOT use any colors or background colors " +
      "- Do NOT wrap your response in <html>, <body>, or any container div tags " +
      "- Start directly with your quiz questions " +
      "- Make sure each option is clickable and the 'data-correct' attribute is properly set " +
      "- Keep your HTML clean and semantic, focusing only on the content structure";

    // Create messages to send to the OpenAI API
    const messages = [
      {
        role: "system",
        content: systemContent,
      },
      {
        role: "user",
        content: JSON.stringify(input),
      },
    ];

    // Prepare the chat data with streaming enabled
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

    // Create a ReadableStream to extract only the delta.content from each JSON chunk
    const stream = new ReadableStream({
      async start(controller) {
        const reader = openaiRes.body?.getReader();
        if (!reader) {
          controller.close();
          return;
        }
        const decoder = new TextDecoder("utf-8");
        let buffer = "";
        let fullResponse = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          // Decode the chunk and accumulate
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
                  // Remove any ```html and ``` markers from the content
                  let cleanDelta = delta;
                  fullResponse += delta;
                  
                  // Enqueue the content delta as a UTF-8 encoded chunk
                  controller.enqueue(new TextEncoder().encode(cleanDelta));
                }
              } catch (err) {
                console.error("Error parsing chunk:", err);
              }
            }
          }
          // Keep any incomplete line for the next iteration
          buffer = lines[lines.length - 1];
        }
        
        // Process any remaining buffered data
        if (buffer.trim() && !buffer.includes("[DONE]")) {
          try {
            const parsed = JSON.parse(buffer.trim());
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              fullResponse += delta;
              controller.enqueue(new TextEncoder().encode(delta));
            }
          } catch (err) {
            console.error("Error parsing final buffer:", err);
          }
        }
        
        // Clean up the full response if needed
        if (fullResponse.startsWith("```html")) {
          const cleanedResponse = fullResponse.replace(/^```html\n/, "").replace(/```$/, "");
          // Reset the stream and send the cleaned response
          controller.close();
          return new NextResponse(cleanedResponse, {
            headers: { "Content-Type": "text/html" },
          });
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