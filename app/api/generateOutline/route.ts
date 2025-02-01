// app/api/generateOutline/route.ts
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const input = await request.json();
    
    // Make sure the action is for generating an outline
    if (input.action !== "generateOutline") {
      return NextResponse.json(
        { error: "Invalid action for generateOutline endpoint" },
        { status: 400 }
      );
    }

    // Create an example outline (as in your Laravel code)
    const outlineExample = {
      topic: input.topic,
      sections: [
        {
          title: "Section 1",
          subsections: [
            {
              title: "Fundamental principles",
              explanation: "The basic ideas that form the foundation of this topic."
            },
            {
              title: "Key terminology",
              explanation: "Essential terms and definitions you need to know."
            }
          ]
        },
        {
          title: "Section 2",
          subsections: [
            {
              title: "Advanced theories",
              explanation: "More complex ideas building on the core concepts."
            },
            {
              title: "Current research",
              explanation: "Recent developments and ongoing studies in this field."
            }
          ]
        },
        {
          title: "Section 3",
          subsections: [
            {
              title: "Practical applications",
              explanation: "How this topic is used in everyday life or industry."
            },
            {
              title: "Future implications",
              explanation: "Potential future developments and their impact."
            }
          ]
        },
        {
          title: "Section 4",
          subsections: [
            {
              title: "Practical applications",
              explanation: "How this topic is used in everyday life or industry."
            },
            {
              title: "Future implications",
              explanation: "Potential future developments and their impact."
            }
          ]
        }
      ]
    };

    const exampleOutlineJson = JSON.stringify(outlineExample, null, 2);

    const messages = [
      {
        role: "system",
        content:
          "You are an AI assistant specialized in creating study guides. " +
          "When given a topic, create a very detailed outline that encompasses all that needs to be known for the topic. " +
          "Generate a very dynamic outline. When asked about a specific subtopic, provide detailed notes. " +
          "THE OUTPUT SHOULD ALWAYS BE JSON. For example: " +
          exampleOutlineJson
      },
      {
        role: "user",
        content: JSON.stringify(input)
      }
    ];

    const chatData = {
      model: "gpt-4o-mini", // or your chosen model
      messages
    };

    // Get the OpenAI API key from environment variables
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

    const responseData = await openaiRes.json();

    // Check that the response contains the expected content.
    if (
      !responseData.choices ||
      !responseData.choices[0] ||
      !responseData.choices[0].message ||
      !responseData.choices[0].message.content
    ) {
      return NextResponse.json(
        { error: "Invalid response structure from OpenAI API" },
        { status: 500 }
      );
    }

    // Remove any triple backticks or formatting wrappers.
    let openaiRawContent = responseData.choices[0].message.content;
    openaiRawContent = openaiRawContent.replace(/```(json)?/g, "").trim();

    let openaiResponse;
    try {
      openaiResponse = JSON.parse(openaiRawContent);
    } catch (e) {
      return NextResponse.json(
        {
          error: "Invalid JSON content in OpenAI response",
          raw_content: openaiRawContent
        },
        { status: 500 }
      );
    }

    return NextResponse.json(openaiResponse);
  } catch (error: any) {
    return NextResponse.json(
      { error: "Server error", details: error.message },
      { status: 500 }
    );
  }
}
