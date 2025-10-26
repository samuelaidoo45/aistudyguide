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
      <i data-lucide="chevron-down"></i> Section 1: Introduction and Foundational Concepts
    </h3>
    <p class="section-description" style="margin: 8px 0; padding: 0 12px; color: #64748b; font-size: 14px; line-height: 1.6;">
      This section introduces the fundamental concepts and establishes the groundwork for understanding this topic. 
      You'll learn the essential definitions, historical context, and key principles that form the foundation for deeper study.
    </p>
    <div class="subsection-container">
      <div class="subtopic-item">
        <span>1.1 Overview and Introduction</span>
        <i data-lucide="chevron-right"></i>
      </div>
      <div class="subtopic-item">
        <span>1.2 Historical Development and Context</span>
        <i data-lucide="chevron-right"></i>
      </div>
      <div class="subtopic-item">
        <span>1.3 Key Definitions and Terminology</span>
        <i data-lucide="chevron-right"></i>
      </div>
      <div class="subtopic-item">
        <span>1.4 Core Principles and Concepts</span>
        <i data-lucide="chevron-right"></i>
      </div>
      <div class="subtopic-item">
        <span>1.5 Foundational Theories and Models</span>
        <i data-lucide="chevron-right"></i>
      </div>
    </div>
  </div>
  <div class="section-card">
    <h3 class="section-title">
      <i data-lucide="chevron-down"></i> Section 2: Core Mechanisms and Processes
    </h3>
    <p class="section-description" style="margin: 8px 0; padding: 0 12px; color: #64748b; font-size: 14px; line-height: 1.6;">
      Explore the detailed mechanisms and processes that drive this topic. 
      This section examines how things work, the underlying systems, and the step-by-step procedures involved in understanding the subject matter.
    </p>
    <div class="subsection-container">
      <div class="subtopic-item">
        <span>2.1 Primary Mechanisms and Systems</span>
        <i data-lucide="chevron-right"></i>
      </div>
      <div class="subtopic-item">
        <span>2.2 Process Analysis and Workflows</span>
        <i data-lucide="chevron-right"></i>
      </div>
      <div class="subtopic-item">
        <span>2.3 Interaction and Dependencies</span>
        <i data-lucide="chevron-right"></i>
      </div>
      <div class="subtopic-item">
        <span>2.4 Technical Specifications and Details</span>
        <i data-lucide="chevron-right"></i>
      </div>
      <div class="subtopic-item">
        <span>2.5 Operational Principles</span>
        <i data-lucide="chevron-right"></i>
      </div>
    </div>
  </div>
  <div class="section-card">
    <h3 class="section-title">
      <i data-lucide="chevron-down"></i> Section 3: Advanced Topics and Specialized Areas
    </h3>
    <p class="section-description" style="margin: 8px 0; padding: 0 12px; color: #64748b; font-size: 14px; line-height: 1.6;">
      Delve into advanced topics and specialized areas that require deeper understanding. 
      This section covers complex theories, cutting-edge research, and sophisticated concepts that build upon the fundamentals.
    </p>
    <div class="subsection-container">
      <div class="subtopic-item">
        <span>3.1 Advanced Theoretical Frameworks</span>
        <i data-lucide="chevron-right"></i>
      </div>
      <div class="subtopic-item">
        <span>3.2 Specialized Methodologies</span>
        <i data-lucide="chevron-right"></i>
      </div>
      <div class="subtopic-item">
        <span>3.3 Complex Problem-Solving Approaches</span>
        <i data-lucide="chevron-right"></i>
      </div>
      <div class="subtopic-item">
        <span>3.4 Current Research and Developments</span>
        <i data-lucide="chevron-right"></i>
      </div>
      <div class="subtopic-item">
        <span>3.5 Emerging Trends and Innovations</span>
        <i data-lucide="chevron-right"></i>
      </div>
    </div>
  </div>
  <div class="section-card">
    <h3 class="section-title">
      <i data-lucide="chevron-down"></i> Section 4: Practical Applications and Implementation
    </h3>
    <p class="section-description" style="margin: 8px 0; padding: 0 12px; color: #64748b; font-size: 14px; line-height: 1.6;">
      Learn how to apply theoretical knowledge in real-world scenarios. 
      This section provides practical examples, case studies, implementation strategies, and hands-on approaches to using what you've learned.
    </p>
    <div class="subsection-container">
      <div class="subtopic-item">
        <span>4.1 Real-World Case Studies</span>
        <i data-lucide="chevron-right"></i>
      </div>
      <div class="subtopic-item">
        <span>4.2 Implementation Strategies</span>
        <i data-lucide="chevron-right"></i>
      </div>
      <div class="subtopic-item">
        <span>4.3 Best Practices and Guidelines</span>
        <i data-lucide="chevron-right"></i>
      </div>
      <div class="subtopic-item">
        <span>4.4 Common Challenges and Solutions</span>
        <i data-lucide="chevron-right"></i>
      </div>
      <div class="subtopic-item">
        <span>4.5 Tools and Resources</span>
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
          "You are an expert textbook author and curriculum designer specializing in creating comprehensive, detailed study materials. " +
          "Your task is to create an in-depth sub-outline that breaks down a specific chapter or topic into detailed, professional sections, " +
          "similar to how a university textbook chapter would be structured with multiple sections and subsections.\n\n" +
          
          "GUIDELINES FOR CREATING THE SUB-OUTLINE:\n" +
          "1. Create 5-8 well-organized sections that comprehensively cover the chapter/topic\n" +
          "2. Each section should have:\n" +
          "   - A clear, descriptive title that indicates the specific content covered\n" +
          "   - A 2-3 sentence description explaining what students will learn and why it's important\n" +
          "   - 4-6 detailed subsections with numbered sections (e.g., 1.1, 1.2, 2.1, 2.2, etc.)\n" +
          "3. Subsection names must be specific and detailed, not generic\n" +
          "4. Structure the sub-outline with a logical learning progression:\n" +
          "   - Start with introduction and foundational concepts\n" +
          "   - Progress to core mechanisms, processes, and systems\n" +
          "   - Include advanced topics and specialized areas\n" +
          "   - Cover practical applications and implementation\n" +
          "   - End with challenges, solutions, and future perspectives\n" +
          "5. Go deep - this is a detailed breakdown of a single chapter, so be thorough\n" +
          "6. Make it academically rigorous with textbook-level depth\n" +
          "7. Think of this as creating a detailed table of contents for one chapter of a professional textbook\n\n" +
          
          "OUTPUT FORMAT:\n" +
          "Output ONLY a complete HTML snippet that exactly follows the structure below. " +
          "Do not include any extra commentary, explanations, or markdown formatting. " +
          "Start directly with the <div> tag and ensure all HTML is properly formatted.\n\n" +
          
          "EXAMPLE STRUCTURE:\n" +
          htmlExample +
          "\n\n" +
          "Now, create a comprehensive, detailed sub-outline for the given chapter/topic. " +
          "Think like a textbook author breaking down a single chapter into multiple detailed sections with clear learning objectives. " +
          "Make it realistic, thorough, and structured like a professional academic book chapter."
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