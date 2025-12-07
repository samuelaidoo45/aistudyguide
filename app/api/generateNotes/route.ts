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
          "You are an expert textbook author and professor specializing in creating comprehensive, high-quality educational content. " +
          "Your task is to write detailed, professional study notes on the subsection '" + subtopic + "' " +
          "within the context of '" + title + "' under the section '" + sectionTitle + "'.\n\n" +
          
          "CONTENT REQUIREMENTS - Write like a professional textbook:\n" +
          "1. START WITH A CLEAR INTRODUCTION\n" +
          "   - Begin with an engaging overview paragraph explaining what this topic is and why it matters\n" +
          "   - Provide context and relevance to the broader subject\n\n" +
          
          "2. COMPREHENSIVE COVERAGE - Include these elements:\n" +
          "   - Detailed explanations of key concepts with clear definitions\n" +
          "   - Multiple concrete, real-world examples to illustrate points\n" +
          "   - Step-by-step breakdowns of processes or procedures where applicable\n" +
          "   - Important formulas, principles, or frameworks (if relevant)\n" +
          "   - Visual descriptions or diagrams explanations when helpful\n" +
          "   - Historical context or development of ideas (where relevant)\n" +
          "   - Current applications and modern perspectives\n" +
          "   - Common misconceptions and clarifications\n" +
          "   - Practical tips and best practices\n\n" +
          
          "3. STRUCTURE AND ORGANIZATION:\n" +
          "   - Use clear headings (h2, h3) to organize major subsections\n" +
          "   - Break content into digestible paragraphs (3-5 sentences each)\n" +
          "   - Use bullet points for lists of key points or features\n" +
          "   - Use numbered lists for sequential steps or procedures\n" +
          "   - Include 'Key Takeaways' or summary boxes for important points\n" +
          "   - Add 'Example' sections with real-world scenarios\n" +
          "   - Consider including 'Common Pitfalls' or 'Things to Remember' sections\n\n" +
          
          "4. DEPTH AND RIGOR:\n" +
          "   - Write at university/professional textbook level\n" +
          "   - Be thorough - aim for 1500-2500 words minimum\n" +
          "   - Explain not just 'what' but also 'why' and 'how'\n" +
          "   - Connect concepts to related topics\n" +
          "   - Provide both theoretical foundations and practical applications\n\n" +
          
          "5. HTML FORMATTING RULES:\n" +
          "   - DO NOT include any ```html tags or code block markers\n" +
          "   - DO NOT style the body element or include body { } CSS\n" +
          "   - Use semantic HTML: <h2>, <h3>, <p>, <ul>, <ol>, <strong>, <em>\n" +
          "   - Use <div class='note-box'> for highlighted tips or key points\n" +
          "   - Use <div class='example-box'> for examples\n" +
          "   - Use inline styles sparingly and only for special emphasis boxes\n" +
          "   - Keep font sizes consistent and readable on all devices\n" +
          "   - Use proper spacing: margin-bottom for paragraphs and sections\n\n" +
          
          "6. WRITING STYLE:\n" +
          "   - Write in clear, professional academic tone\n" +
          "   - Be engaging but authoritative\n" +
          "   - Use active voice where possible\n" +
          "   - Define technical terms when first introduced\n" +
          "   - Use transition words to connect ideas smoothly\n\n" +
          
          "EXAMPLE STRUCTURE:\n" +
          "<h2>Introduction to [Topic]</h2>\n" +
          "<p>[Engaging opening paragraph explaining the topic and its importance...]</p>\n\n" +
          
          "<h3>Core Concepts and Definitions</h3>\n" +
          "<p>[Detailed explanation of fundamental concepts...]</p>\n" +
          "<ul>\n  <li><strong>Term 1:</strong> Definition and explanation</li>\n  <li><strong>Term 2:</strong> Definition and explanation</li>\n</ul>\n\n" +
          
          "<h3>Detailed Explanation</h3>\n" +
          "<p>[In-depth explanation of the main content...]</p>\n\n" +
          
          "<div class='example-box'>\n" +
          "  <h4>Example: Real-World Application</h4>\n" +
          "  <p>[Concrete example with details...]</p>\n" +
          "</div>\n\n" +
          
          "<h3>Key Principles and Methods</h3>\n" +
          "<p>[Explanation of how things work...]</p>\n\n" +
          
          "<div class='note-box'>\n" +
          "  <h4>💡 Key Takeaway</h4>\n" +
          "  <p>[Important point to remember...]</p>\n" +
          "</div>\n\n" +
          
          "<h3>Practical Applications</h3>\n" +
          "<p>[How this is used in practice...]</p>\n\n" +
          
          "<h3>Summary</h3>\n" +
          "<p>[Concise summary wrapping up the main points...]</p>\n\n" +
          
          "Now write comprehensive, textbook-quality notes on this topic. Make it thorough, professional, and educational."
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
