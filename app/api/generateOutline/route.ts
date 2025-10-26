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
      <i data-lucide="chevron-down"></i> Chapter 1: Foundations and Core Concepts
    </h3>
    <p class="section-description" style="margin: 8px 0; padding: 0 12px; color: #64748b; font-size: 14px; line-height: 1.6;">
      This chapter establishes the fundamental principles and introduces essential terminology needed to understand the topic. 
      Students will learn the historical context, key definitions, and core theories that form the foundation of this subject.
    </p>
    <div class="subsection-container">
      <div class="subtopic-item">
        <span>1.1 Historical Background and Evolution</span>
        <i data-lucide="chevron-right"></i>
      </div>
      <div class="subtopic-item">
        <span>1.2 Fundamental Principles and Laws</span>
        <i data-lucide="chevron-right"></i>
      </div>
      <div class="subtopic-item">
        <span>1.3 Key Terminology and Definitions</span>
        <i data-lucide="chevron-right"></i>
      </div>
      <div class="subtopic-item">
        <span>1.4 Core Concepts and Frameworks</span>
        <i data-lucide="chevron-right"></i>
      </div>
    </div>
  </div>
  <div class="section-card">
    <h3 class="section-title">
      <i data-lucide="chevron-down"></i> Chapter 2: Advanced Theory and Methods
    </h3>
    <p class="section-description" style="margin: 8px 0; padding: 0 12px; color: #64748b; font-size: 14px; line-height: 1.6;">
      Building on foundational knowledge, this chapter explores advanced theoretical frameworks and methodologies. 
      Learn about cutting-edge research, analytical techniques, and how experts approach complex problems in this field.
    </p>
    <div class="subsection-container">
      <div class="subtopic-item">
        <span>2.1 Advanced Theoretical Frameworks</span>
        <i data-lucide="chevron-right"></i>
      </div>
      <div class="subtopic-item">
        <span>2.2 Research Methodologies</span>
        <i data-lucide="chevron-right"></i>
      </div>
      <div class="subtopic-item">
        <span>2.3 Analytical Tools and Techniques</span>
        <i data-lucide="chevron-right"></i>
      </div>
      <div class="subtopic-item">
        <span>2.4 Current Research and Innovations</span>
        <i data-lucide="chevron-right"></i>
      </div>
    </div>
  </div>
  <div class="section-card">
    <h3 class="section-title">
      <i data-lucide="chevron-down"></i> Chapter 3: Practical Applications and Case Studies
    </h3>
    <p class="section-description" style="margin: 8px 0; padding: 0 12px; color: #64748b; font-size: 14px; line-height: 1.6;">
      This chapter demonstrates real-world applications through case studies and practical examples. 
      Discover how theoretical concepts translate into practice, explore industry applications, and learn best practices from successful implementations.
    </p>
    <div class="subsection-container">
      <div class="subtopic-item">
        <span>3.1 Real-World Case Studies</span>
        <i data-lucide="chevron-right"></i>
      </div>
      <div class="subtopic-item">
        <span>3.2 Industry Applications</span>
        <i data-lucide="chevron-right"></i>
      </div>
      <div class="subtopic-item">
        <span>3.3 Best Practices and Guidelines</span>
        <i data-lucide="chevron-right"></i>
      </div>
      <div class="subtopic-item">
        <span>3.4 Problem-Solving Strategies</span>
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
          "You are an expert curriculum designer and professional textbook author specialized in creating comprehensive study guides. " +
          "Your task is to create a detailed, professional book-like outline that covers the topic comprehensively, similar to how a university textbook or professional course would be structured.\n\n" +
          
          "GUIDELINES FOR CREATING THE OUTLINE:\n" +
          "1. Create 6-10 well-organized chapters that progress logically from foundational to advanced concepts\n" +
          "2. Each chapter should have:\n" +
          "   - A descriptive title that clearly indicates what will be covered\n" +
          "   - A 2-3 sentence description explaining the chapter's focus and learning objectives\n" +
          "   - 4-6 detailed subtopics with numbered sections (e.g., 1.1, 1.2, etc.)\n" +
          "3. Subtopic names should be specific and descriptive, not generic\n" +
          "4. Structure the outline to follow a logical progression:\n" +
          "   - Start with foundations, history, and basic concepts\n" +
          "   - Progress to intermediate theories and methodologies\n" +
          "   - Include advanced applications and specialized topics\n" +
          "   - End with practical applications, case studies, and future directions\n" +
          "5. Ensure comprehensive coverage - include theoretical, practical, and contemporary aspects\n" +
          "6. Make it academically rigorous yet accessible\n\n" +
          
          "OUTPUT FORMAT:\n" +
          "Output ONLY a complete HTML snippet that exactly follows the structure below. " +
          "Do not include any extra commentary, explanations, or markdown formatting. " +
          "Start directly with the <div> tag and ensure all HTML is properly formatted.\n\n" +
          
          "EXAMPLE STRUCTURE:\n" +
          htmlExample +
          "\n\n" +
          "Now, create a comprehensive, professional book-like outline for the following topic. " +
          "Think like a university professor designing a complete course curriculum."
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
