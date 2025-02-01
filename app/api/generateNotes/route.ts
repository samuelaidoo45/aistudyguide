// app/api/generateNotes/route.ts
import { NextResponse } from "next/server";

export const maxDuration = 300; // 5 minutes

export async function POST(request: Request) {
  try {
    const input = await request.json();

    // Grab details from the Request, with defaults.
    const title = input.title ?? "Unknown Title";
    const sectionTitle = input.sectionTitle ?? "Unknown Section";
    const subtopic = input.subtopic ?? "Unknown Subtopic";

    const exampleNotes = {
      subtopic: "some subtopic",
      notes: "some notes"
    };
    const exampleNotesJson = JSON.stringify(exampleNotes, null, 2);

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
          "The notes JSON attribute should be a string of comprehensive text with all the explanation, examples, etc. formatted with HTML and it should be responsive for each screen size and the font size consistent and readable. " +
          "THE OUTPUT SHOULD ALWAYS BE JSON. For example: " +
          exampleNotesJson
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

    // Remove triple backticks or other formatting.
    let openaiRawContent = responseData.choices[0].message.content;
    openaiRawContent = openaiRawContent.replace(/```(json)?/g, "").trim();

    let openaiResponse;
    try {
      openaiResponse = JSON.parse(openaiRawContent);
    } catch {
      return NextResponse.json(
        {
          error: "Invalid JSON content in OpenAI response",
          raw_content: openaiRawContent
        },
        { status: 500 }
      );
    }

    return NextResponse.json(openaiResponse);
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
