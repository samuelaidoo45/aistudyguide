import { NextResponse } from "next/server";

export const maxDuration = 300; // 5 minutes

// Format the quiz content with proper HTML structure for our new styling
function formatQuizContent(content: string): string {
  // Add question numbers to the h3 elements
  let numberedContent = content.replace(/<h3>(.*?)<\/h3>/g, (match, p1, offset, string) => {
    // Count how many h3 tags appear before this one to determine the question number
    const questionNumber = string.substring(0, offset).match(/<h3>/g)?.length || 0;
    return `<h3>Question ${questionNumber + 1}: ${p1}</h3>`;
  });
  
  // Add a submit button at the end
  return `
    ${numberedContent}
    <button class="submit-quiz" onclick="document.dispatchEvent(new CustomEvent('submit-quiz'))">
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-1"><polyline points="20 6 9 17 4 12"></polyline></svg>
      Submit Quiz
    </button>
    <div class="quiz-result" style="display: none;">
      <div class="quiz-score">Score: 0/0 (0%)</div>
      <p class="quiz-feedback"></p>
    </div>
  `;
}

export async function POST(request: Request) {
  try {
    const input = await request.json();

    // Grab details from the Request
    const title = input.title ?? "";
    const sectionTitle = input.sectionTitle ?? "";
    const subtopic = input.subtopic ?? "";

    // Update the system prompt to generate properly structured HTML for our new styling
    const systemPrompt = `You are an educational quiz generator. Create a quiz based on the provided topic.

Generate 5 multiple-choice questions with 4 options each. Format your response as HTML with the following structure:

<div class="question">
  <h3>Question text goes here</h3>
  <div class="options">
    <div class="option" data-correct="true/false">Option A</div>
    <div class="option" data-correct="true/false">Option B</div>
    <div class="option" data-correct="true/false">Option C</div>
    <div class="option" data-correct="true/false">Option D</div>
  </div>
</div>

Make sure to:
1. Mark only ONE option as data-correct="true" per question
2. Make questions challenging but fair
3. Cover different aspects of the topic
4. Use clear, concise language
5. Ensure all questions are factually accurate

Do not include any explanations or additional text outside the HTML structure. DO NOT ADD ${```html ```}`;

    // Create messages to send to the OpenAI API
    const messages = [
      {
        role: "system",
        content: systemPrompt,
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
                  const cleanDelta = delta;
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
        
        // Format the final content before returning
        const formattedContent = formatQuizContent(fullResponse);
        controller.enqueue(new TextEncoder().encode(formattedContent));
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
