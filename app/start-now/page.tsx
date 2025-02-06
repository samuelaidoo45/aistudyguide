"use client";

import { useState, useRef } from "react";
import Head from "next/head";
import Script from "next/script";

interface Outline {
  topic: string;
  sections: {
    title: string;
    subsections: { title: string }[];
  }[];
}

type ViewState = "input" | "mainOutline" | "subOutline" | "finalContent";

const Home: React.FC = () => {
  // Light mode is default
  const [topic, setTopic] = useState<string>("");
  const [view, setView] = useState<ViewState>("input");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadCallback, setReloadCallback] = useState<(() => void) | null>(null);
  const [mainOutline, setMainOutline] = useState<Outline | null>(null);
  const [subOutline, setSubOutline] = useState<Outline | null>(null);
  const [finalContent, setFinalContent] = useState<string | null>(null);
  const [selectedSubtopic, setSelectedSubtopic] = useState<string>("");
  const [darkMode, setDarkMode] = useState<boolean>(false);
  // New: Track when streaming is complete.
  const [streamingDone, setStreamingDone] = useState<boolean>(false);

  // Cache generated outlines and notes using useRef
  const outlineCache = useRef<{ [key: string]: Outline }>({});
  const finalContentCache = useRef<{ [key: string]: string }>({});

  // API helper functions
  async function fetchOutline(topic: string): Promise<Outline> {
    const res = await fetch("/api/generateOutline", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic, action: "generateOutline" }),
    });
    if (!res.ok) throw new Error("Failed to fetch outline");
    return res.json();
  }

  async function fetchSubOutline(subtopic: string, mainTopic: string): Promise<Outline> {
    const res = await fetch("/api/generateSubOutline", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        topic: `Based on the main topic "${mainTopic}", generate detailed outline on "${subtopic}"`,
        action: "generateOutline",
      }),
    });
    if (!res.ok) throw new Error("Failed to fetch sub‑outline");
    return res.json();
  }

  // Streaming version for fetching notes.
  // As soon as the first chunk arrives, stop the spinner.
  // Once complete, parse the accumulated JSON and return only the "notes" attribute.
  async function fetchNotesStream(
    subsubTitle: string,
    mainTopic: string,
    parentTopic: string
  ): Promise<string> {
    const res = await fetch("/api/generateNotes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subtopic: `Based on ${mainTopic} and ${parentTopic}, generate detailed notes on "${subsubTitle}"`,
        sectionTitle: parentTopic,
        title: `${parentTopic} (sub)`,
        action: "generateNotes",
      }),
    });
    if (!res.ok) throw new Error("Failed to fetch notes");

    let accumulatedContent = "";
    const reader = res.body?.getReader();
    if (!reader) throw new Error("ReadableStream not supported in this browser");
    const decoder = new TextDecoder("utf-8");
    let firstChunkReceived = false;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      accumulatedContent += chunk;
      // Remove newlines from the accumulated content so JSON artifacts don't show
      const formatted = accumulatedContent.replace(/\n/g, " ");
      setFinalContent(formatted);
      if (!firstChunkReceived) {
        setLoading(false);
        firstChunkReceived = true;
      }
    }
    // When the stream is complete, mark streaming as done.
    setStreamingDone(true);
    try {
      const parsed = JSON.parse(accumulatedContent);
      return parsed.notes.replace(/\n/g, " ");
    } catch (error) {
      console.error( error);
      return accumulatedContent.replace(/\n/g, " ");
    }
  }

  // Handlers for user actions
  async function handleBreakdown(newTopic?: string) {
    const currentTopic = newTopic ?? topic;
    if (!currentTopic.trim()) return;
    setLoading(true);
    setError(null);
    try {
      if (outlineCache.current[currentTopic]) {
        setMainOutline(outlineCache.current[currentTopic]);
        setView("mainOutline");
      } else {
        const outline = await fetchOutline(currentTopic);
        outlineCache.current[currentTopic] = outline;
        setMainOutline(outline);
        setView("mainOutline");
      }
      setTopic(currentTopic);
    } catch (err) {
      setError((err as Error).message);
      setReloadCallback(() => () => handleBreakdown(currentTopic));
    } finally {
      setLoading(false);
    }
  }

  async function handleSelectSubtopic(subtopic: string) {
    if (!topic) return;
    setLoading(true);
    setError(null);
    setSelectedSubtopic(subtopic);
    try {
      if (outlineCache.current[subtopic]) {
        setSubOutline(outlineCache.current[subtopic]);
        setView("subOutline");
      } else {
        const subOutlineData = await fetchSubOutline(subtopic, topic);
        outlineCache.current[subtopic] = subOutlineData;
        setSubOutline(subOutlineData);
        setView("subOutline");
      }
    } catch (err) {
      setError((err as Error).message);
      setReloadCallback(() => () => handleSelectSubtopic(subtopic));
    } finally {
      setLoading(false);
    }
  }
  async function handleSelectFinalContent(subsubTitle: string) {
    if (!topic || !selectedSubtopic) return;
    setLoading(true);
    setError(null);
    // Reset streaming state when starting a new stream.
    setStreamingDone(false);
    try {
      if (finalContentCache.current[subsubTitle]) {
        setFinalContent(finalContentCache.current[subsubTitle]);
        setView("finalContent");
        // If data is already cached, show the back button immediately.
        setStreamingDone(true);
      } else {
        // Clear previous content and switch to final view.
        setFinalContent("");
        setView("finalContent");
        const notes = await fetchNotesStream(subsubTitle, topic, selectedSubtopic);
        finalContentCache.current[subsubTitle] = notes;
        setFinalContent(notes);
      }
    } catch (err) {
      setError((err as Error).message);
      setReloadCallback(() => () => handleSelectFinalContent(subsubTitle));
    } finally {
      setLoading(false);
    }
  }
  

  async function handleAskQuestion(question: string) {
    if (!question.trim() || !selectedSubtopic) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/generateNotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subtopic: `${selectedSubtopic}: ${question}` }),
      });
      if (!res.ok) throw new Error("Failed to fetch answer");
      const data = await res.json();
      setFinalContent((prev) =>
        prev
          ? prev +
            `<br><br><strong>Q:</strong> ${question}<br><strong>A:</strong> ${data.notes}`
          : data.notes
      );
    } catch (err) {
      setError((err as Error).message);
      setReloadCallback(() => () => handleAskQuestion(question));
    } finally {
      setLoading(false);
    }
  }

  function handleBackToMainOutline() {
    setView("mainOutline");
    setSubOutline(null);
    setFinalContent(null);
    setSelectedSubtopic("");
    setStreamingDone(false);
  }

  function handleBackToSubOutline() {
    setView("subOutline");
    setFinalContent(null);
    setStreamingDone(false);
  }

  function handleDownloadWord() {
    if (!finalContent) return;
    const tempEl = document.createElement("div");
    tempEl.innerHTML = finalContent;
    const text = tempEl.textContent || tempEl.innerText || "";
    const blob = new Blob([text], { type: "application/msword" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${selectedSubtopic}.doc`;
    link.click();
    URL.revokeObjectURL(url);
  }

  // Predefined topics for quick selection
  const predefinedTopics = [
    "Cryptocurrency",
    "English Literature",
    "API Development",
    "Algorithmic Trading",
    "UI/UX Design",
    "Blockchain",
    "Cybersecurity",
    "Artificial Intelligence",
    "Mathematics",
    "Economics",
  ];

  return (
    <>
      <Head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>StudyGuide - Simplify Any Topic with AI</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap"
          rel="stylesheet"
        />
      </Head>

      <Script id="firebase-init" type="module">
        {`
          import { initializeApp } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-app.js";
          import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-analytics.js";
          const firebaseConfig = {
            apiKey: "AIzaSyCvbIzN5y8jtF11IStMvb4tSAzflagR5Jg",
            authDomain: "studyguide-9ebf2.firebaseapp.com",
            projectId: "studyguide-9ebf2",
            storageBucket: "studyguide-9ebf2.firebasestorage.app",
            messagingSenderId: "264351112015",
            appId: "1:264351112015:web:2d95cd0899eb4ce08e033a",
            measurementId: "G-W4NYWX6KHG"
          };
          const app = initializeApp(firebaseConfig);
          const analytics = getAnalytics(app);
        `}
      </Script>

      <div className={`container ${darkMode ? "dark" : "light"}`}>
        <header className="header">
          <h1>StudyGuide</h1>
          <p>Your dynamic study guide generator powered by AI</p>
          <button className="theme-toggle" onClick={() => setDarkMode((prev) => !prev)}>
            {darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          </button>
        </header>
        <main className="wrapper">
          {view === "input" && (
            <>
              <div className="predefined-topics">
                {predefinedTopics.map((pre, idx) => (
                  <button key={idx} className="topic-button" onClick={() => handleBreakdown(pre)}>
                    {pre}
                  </button>
                ))}
              </div>
              <div className="card">
                <h2>Study Any Topic</h2>
                <div className="input-group">
                  <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="Enter a topic to understand..."
                    className="input-text"
                  />
                  <button onClick={() => handleBreakdown()} className="btn btn-primary">
                    <i data-lucide="lightbulb"></i> Break It Down
                  </button>
                </div>
                {error && <div className="error">{error}</div>}
              </div>
            </>
          )}

          {view === "mainOutline" && mainOutline && (
            <div className="card card-outline">
              <button className="back-button" onClick={() => setView("input")}>
                ← Back
              </button>
              <h2>{mainOutline.topic}</h2>
              <div className="outline-sections">
                {mainOutline.sections.map((section, i) => (
                  <div key={i} className="section-card">
                    <h3 className="section-title">
                      <i data-lucide="chevron-down"></i> {section.title}
                    </h3>
                    <div className="subsection-container">
                      {section.subsections.map((subsec, j) => (
                        <div
                          key={j}
                          className="subtopic-item"
                          onClick={() => handleSelectSubtopic(subsec.title)}
                        >
                          <span>{subsec.title}</span>
                          <i data-lucide="chevron-right"></i>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {view === "subOutline" && subOutline && (
            <div className="card card-outline">
              <button className="back-button" onClick={handleBackToMainOutline}>
                ← Back
              </button>
              <h2>{selectedSubtopic}</h2>
              <div className="outline-sections">
                {subOutline.sections.map((section, i) => (
                  <div key={i} className="section-card">
                    <h3 className="section-title">
                      <i data-lucide="chevron-down"></i> {section.title}
                    </h3>
                    <div className="subsection-container">
                      {section.subsections.map((subsec, j) => (
                        <div
                          key={j}
                          className="subtopic-item"
                          onClick={() => handleSelectFinalContent(subsec.title)}
                        >
                          <span>{subsec.title}</span>
                          <i data-lucide="chevron-right"></i>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {view === "finalContent" && finalContent && (
            <div className="card card-outline">
              {/* Back button only appears when streaming is complete */}
              {streamingDone && (
                <button className="back-button" onClick={handleBackToSubOutline}>
                  ← Back
                </button>
              )}
              <h2>{selectedSubtopic}</h2>
              <div className="final-content-card">
                <div
                  className="final-content-html"
                  dangerouslySetInnerHTML={{ __html: finalContent }}
                ></div>
              </div>
              <div className="dive-deeper-container">
                <h3>Dive Deeper</h3>
                <div className="dive-deeper-input">
                  <input
                    type="text"
                    placeholder="Ask a follow-up question..."
                    className="input-text"
                    id="questionInput"
                  />
                  <button
                    onClick={() => {
                      const input = document.getElementById("questionInput") as HTMLInputElement;
                      if (input) {
                        handleAskQuestion(input.value);
                        input.value = "";
                      }
                    }}
                    className="btn btn-primary"
                  >
                    <i data-lucide="message-square"></i> Ask AI
                  </button>
                </div>
              </div>
              <div
                className="download-read-container"
                style={{ display: "flex", gap: "1rem", marginTop: "1rem", justifyContent: "center" }}
              >
                <button onClick={handleDownloadWord} className="btn btn-primary">
                  Download Word
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="error-state">
              <p className="error-message">{error}</p>
              <div className="error-buttons">
                <button
                  className="error-button reload"
                  onClick={() => {
                    if (reloadCallback) {
                      reloadCallback();
                      setError(null);
                    }
                  }}
                >
                  Reload
                </button>
                <button className="error-button close" onClick={() => setError(null)}>
                  Close
                </button>
              </div>
            </div>
          )}
        </main>
        {loading && (
          <div className="loading-overlay">
            <div className="spinner"></div>
          </div>
        )}
      </div>
      <style jsx global>{`
        /* =====================================
           Final Content Streaming Styles (Dynamic)
        ===================================== */
        .final-content-card {
          /* No fixed height or scrolling – expands dynamically */
          padding: 1rem;
          background-color: var(--white);
          border-radius: 0.75rem;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05);
          margin-bottom: 1rem;
        }
        .final-content-html {
          white-space: pre-wrap;
          transition: all 0.3s ease;
          font-family: 'Poppins', sans-serif;
          font-size: 1rem;
          line-height: 1.5;
          padding: 0.5rem;
        }
        /* =====================================
           (Other existing styles unchanged)
        ===================================== */
      `}</style>
          <style jsx global>{`
        /* =====================================
           1. Root Variables
        ===================================== */
        :root {
          --indigo-50: #eef2ff;
          --indigo-100: #e0e7ff;
          --indigo-200: #c7d2fe;
          --indigo-300: #a5b4fc;
          --indigo-400: #818cf8;
          --indigo-500: #6366f1;
          --indigo-600: #4f46e5;
          --indigo-700: #4338ca;
          --indigo-800: #3730a3;
          --indigo-900: #312e81;
          --blue-100: #dbeafe;
          --blue-500: #3b82f6;
          --white: #ffffff;
          --gray-50: #f9fafb;
          --gray-100: #f3f4f6;
          --gray-200: #e5e7eb;
          --gray-300: #d1d5db;
          --gray-700: #374151;
          --gray-900: #111827;
          /* Additional variables for error text */
          --red-600: #e3342f;
        }

        /* =====================================
           2. Basic Resets & Base Styles
        ===================================== */
        *,
        *::before,
        *::after {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        html,
        body {
          font-family: 'Inter', 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          background-color: var(--gray-50);
          color: var(--gray-900);
          line-height: 1.5;
          height: 100%;
        }

        /* =====================================
           3. Layout Containers
        ===================================== */
        .container {
          width: 100%;
          min-height: 100vh;
          padding: 0;
          margin: 0;
          position: relative;
          transition: background 0.3s ease, color 0.3s ease;
        }
        /* Dark mode overrides */
        .container.dark {
          background-color: #1f2937; /* Gray-800 */
          color: #f7fafc; /* Near white */
        }
        .container.light {
          background-color: var(--gray-50);
          color: var(--gray-900);
        }
        .wrapper {
          max-width: 800px;
          margin: 0 auto;
          padding: 1rem;
        }

        /* =====================================
           4. Header & Theme Toggle
        ===================================== */
        .header {
          text-align: center;
          position: relative;
          padding: 2rem 1rem;
          margin-bottom: 2rem;
        }
        .header h1 {
          font-size: 3rem;
          margin-bottom: 0.5rem;
        }
        .header p {
          font-size: 1.5rem;
        }
        .theme-toggle {
          position: absolute;
          top: 20px;
          right: 20px;
          background: transparent;
          border: 1px solid currentColor;
          padding: 0.5rem 1rem;
          border-radius: 4px;
          cursor: pointer;
          transition: background 0.3s ease;
          font-size: 0.9rem;
        }
        @media (max-width: 768px) {
          .theme-toggle {
            position: static;
            margin-top: 1rem;
            align-self: center;
          }
        }
        .theme-toggle:hover {
          background: rgba(0, 0, 0, 0.1);
        }

        /* =====================================
           5. Card & Component Styles
        ===================================== */
        .card {
          background-color: var(--white);
          border-radius: 1rem;
          padding: 2rem;
          margin-bottom: 2rem;
          box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1),
                      0 4px 6px -2px rgba(0,0,0,0.05);
          position: relative;
          transition: transform 0.3s ease;
        }
        .card:hover {
          transform: translateY(-5px);
        }
        /* Dark mode card styles */
        .container.dark .card {
          background-color: #2d3748; /* A slightly lighter dark for cards */
          box-shadow: 0 4px 12px rgba(0,0,0,0.6);
        }
        .container.dark .card h2,
        .container.dark .card h3 {
          color: #f7fafc;
        }
        .container.light .card {
          background-color: var(--white);
          box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        }
        .card h2,
        .card h3 {
          text-align: center;
          margin-bottom: 1rem;
        }

        /* -------------------------------------
           Input & Button Groups
        ------------------------------------- */
        .input-group {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
          justify-content: center;
          margin-bottom: 1.5rem;
        }
        .input-text {
          flex-grow: 1;
          padding: 1rem;
          border: 2px solid var(--indigo-300);
          border-radius: 0.5rem;
          font-size: 1rem;
          width: 100%;
          transition: all 0.3s ease;
          outline: none;
        }
        .input-text:focus {
          border-color: var(--indigo-400);
          box-shadow: 0 0 0 3px rgba(99,102,241,0.2);
        }
        .btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          padding: 0.75rem 1.5rem;
          border-radius: 0.5rem;
          border: none;
          cursor: pointer;
          transition: transform 0.3s ease;
          font-size: 1rem;
          gap: 0.4rem;
        }
        .btn:hover:not(:disabled) {
          transform: translateY(-2px);
        }
        .btn.btn-primary {
          background-color: var(--indigo-600);
          color: var(--white);
        }
        .btn-primary:hover {
          background-color: var(--indigo-700);
        }
        .btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* =====================================
           6. Predefined Topics
        ===================================== */
        .predefined-topics {
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
          justify-content: center;
          margin-bottom: 1.5rem;
        }
        .topic-button {
          background-color: var(--indigo-600);
          color: var(--white);
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 50px;
          cursor: pointer;
          transition: transform 0.3s ease, background 0.3s ease;
        }
        .topic-button:hover {
          background-color: var(--indigo-700);
          transform: translateY(-3px);
        }

        /* =====================================
           7. Outline Sections & Items
        ===================================== */
        .outline-sections {
          margin-top: 1rem;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        .section-card {
          background-color: var(--white);
          border: 1px solid var(--indigo-200);
          border-radius: 0.75rem;
          padding: 1rem;
          margin-bottom: 1rem;
          transition: box-shadow 0.3s ease;
        }
        .section-card:hover {
          box-shadow: 0 4px 8px rgba(0,0,0,0.05);
        }
        .section-title {
          display: flex;
          align-items: center;
          font-size: 1.125rem;
          font-weight: 600;
          color: var(--indigo-800);
          margin-bottom: 0.5rem;
        }
        .section-title i {
          margin-right: 0.5rem;
        }
        .subsection-container {
          margin-left: 1rem;
          /* No border added */
        }
        .subtopic-item {
          background-color: var(--indigo-50);
          padding: 1rem;
          border-radius: 0.5rem;
          margin-bottom: 1rem;
          transition: background-color 0.2s ease, box-shadow 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: space-between;
          cursor: pointer;
        }
        .subtopic-item:hover {
          background-color: var(--indigo-100);
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }
        .subtopic-item.active-subtopic {
          background-color: var(--indigo-200) !important;
          box-shadow: 0 2px 6px rgba(0,0,0,0.1);
        }

        /* =====================================
           8. Back Button (Inside Card)
        ===================================== */
        .card-outline {
          position: relative;
          padding-top: 3rem; /* Reserve space for back button */
        }
        .back-button {
          position: absolute;
          top: 8px;
          left: 8px;
          background: transparent;
          border: 1px solid var(--indigo-600);
          color: var(--indigo-600);
          padding: 0.5rem 1rem;
          border-radius: 4px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.3s ease, transform 0.2s ease, color 0.3s ease;
        }
        .back-button:hover {
          background-color: var(--indigo-600);
          color: var(--white);
          transform: translateY(-2px);
        }

        /* =====================================
           9. Final Content & Dive Deeper
        ===================================== */
        .final-content-card {
          background-color: var(--white);
          border: 2px solid var(--indigo-200);
          border-radius: 0.75rem;
          padding: 1rem;
          margin-top: 1rem;
          box-shadow: 0 4px 8px rgba(0,0,0,0.05);
          width: 100%;
          max-width: 100%;
        }
        .final-content-card p {
          color: var(--indigo-800);
          margin-bottom: 1rem;
          line-height: 1.5;
          word-wrap: break-word;
        }
        .final-content-html {
          width: 100%;
          max-width: 100%;
          overflow-x: auto;
          word-wrap: break-word;
          line-height: 1.5;
        }
        .final-content-html img,
        .final-content-html video,
        .final-content-html iframe {
          max-width: 100%;
          height: auto;
        }
        .dive-deeper-container {
          background-color: var(--indigo-50);
          border: 2px solid var(--indigo-200);
          border-radius: 0.75rem;
          padding: 1rem;
          margin-top: 2rem;
          transition: box-shadow 0.3s ease;
        }
        .dive-deeper-container:hover {
          box-shadow: 0 4px 8px rgba(0,0,0,0.05);
        }
        .dive-deeper-title {
          font-size: 1.125rem;
          font-weight: 600;
          color: var(--indigo-900);
          margin-bottom: 1rem;
          display: flex;
          align-items: center;
        }
        .dive-deeper-input {
          display: flex;
          gap: 0.5rem;
          align-items: center;
        }
        .dive-deeper-input input {
          flex-grow: 1;
          padding: 0.75rem 1rem;
          border: 2px solid var(--indigo-300);
          border-radius: 0.5rem;
          font-size: 0.95rem;
          transition: all 0.3s ease;
          outline: none;
          width: 100%;
        }
        .dive-deeper-input input:focus {
          border-color: var(--indigo-400);
          box-shadow: 0 0 0 3px rgba(99,102,241,0.2);
        }
        .dive-deeper-input button {
          background-color: var(--indigo-600);
          color: var(--white);
          font-weight: 600;
          padding: 0.75rem 1.25rem;
          border-radius: 0.5rem;
          border: none;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1),
                      0 2px 4px -1px rgba(0,0,0,0.06);
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
        }
        .dive-deeper-input button:hover:not(:disabled) {
          background-color: var(--indigo-700);
          transform: translateY(-2px);
          box-shadow: 0 6px 8px -2px rgba(0,0,0,0.15),
                      0 4px 6px -2px rgba(0,0,0,0.1);
        }
        .dive-deeper-input button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* =====================================
           10. Loading Overlay
        ===================================== */
        .loading-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0,0,0,0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
        }
        .spinner {
          border: 4px solid #ccc;
          border-top: 4px solid var(--indigo-600);
          border-radius: 50%;
          width: 3rem;
          height: 3rem;
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        /* =====================================
           11. Error Modal
        ===================================== */
        .error-state {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: var(--white);
          color: var(--gray-900);
          padding: 2rem;
          border-radius: 1rem;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          text-align: center;
          z-index: 10001;
          max-width: 90%;
        }
        .error-message {
          color: var(--red-600);
          font-size: 1.25rem;
          font-weight: 500;
          margin-bottom: 1.5rem;
        }
        .error-buttons {
          display: flex;
          gap: 1rem;
          justify-content: center;
        }
        .error-button {
          padding: 0.75rem 1.5rem;
          border-radius: 0.75rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          border: none;
        }
        .error-button.reload {
          background: var(--indigo-600);
          color: var(--white);
        }
        .error-button.reload:hover {
          background: var(--indigo-700);
        }
        .error-button.close {
          background: var(--gray-100);
          color: var(--gray-700);
        }
        .error-button.close:hover {
          background: var(--gray-200);
        }

        /* =====================================
           12. Responsive Adjustments
        ===================================== */
        @media (max-width: 768px) {
          .wrapper {
            padding: 1rem;
          }
          .card {
            padding: 1.5rem 1rem;
          }
          .header h1 {
            font-size: 2.5rem;
          }
          .header p {
            font-size: 1.2rem;
          }
          .input-text {
            padding: 0.5rem;
            font-size: 0.9rem;
          }
          .btn,
          .back-button,
          .topic-button {
            padding: 0.5rem 1rem;
            font-size: 0.9rem;
          }
          .spinner {
            width: 2.5rem;
            height: 2.5rem;
            border-width: 3px;
          }
          /* For small devices, make back button static (above content) */
          .card-outline .back-button {
            position: static;
            margin-bottom: 1rem;
          }
        }

        /* =====================================
           13. Light Mode Overrides
        ===================================== */
        .container.light {
          background-color: var(--gray-50);
          color: var(--gray-900);
        }
        .container.light .header h1 {
          color: var(--gray-900);
        }
        .container.light .header p {
          color: var(--gray-700);
        }
        .container.light .card {
          background-color: var(--white);
          color: var(--gray-900);
          box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        }
        .container.light .section-card {
          background-color: var(--white);
        }
        .container.light .input-text {
          background-color: var(--white);
          border: 2px solid var(--indigo-300);
          color: var(--gray-900);
        }
        .container.light .input-text::placeholder {
          color: var(--gray-500);
        }
          /* =====================================
   Dark Mode Overrides
===================================== */
.container.dark {
  background-color: #111827; /* Gray-900 */
  color: #f3f4f6; /* Gray-100 */
}

.container.dark .card {
  background-color: #1f2937; /* Gray-800 */
  border-color: #374151; /* Gray-700 */
}

.container.dark .input-text {
  background-color: #1f2937; /* Gray-800 */
  border-color: #4b5563; /* Gray-600 */
  color: #f3f4f6; /* Gray-100 */
}

.container.dark .input-text:focus {
  border-color: #6366f1; /* Indigo-500 */
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.3);
}

.container.dark .subtopic-item {
  background-color: #1a2332;
  color: #e5e7eb; /* Gray-200 */
}

.container.dark .subtopic-item:hover {
  background-color: #2d3748; /* Gray-700 */
}

.container.dark .section-card {
  border-color: #374151; /* Gray-700 */
}

.container.dark .btn-primary {
  background-color: #6366f1; /* Indigo-500 */
}

.container.dark .btn-primary:hover {
  background-color: #4f46e5; /* Indigo-600 */
}

.container.dark .back-button {
  border-color: #6366f1; /* Indigo-500 */
  color: #6366f1;
}

.container.dark .back-button:hover {
  background-color: #6366f1;
  color: #f3f4f6;
}

.container.dark .dive-deeper-container {
  background-color: #1a2332;
  border-color: #374151;
}

.container.dark .final-content-card {
  background-color: #1f2937;
  border-color: #374151;
}

.container.dark .error-state {
  background: #1f2937;
  color: #f3f4f6;
  border: 1px solid #374151;
}

.container.dark .error-button.close {
  background: #374151;
  color: #f3f4f6;
}

.container.dark .error-button.close:hover {
  background: #4b5563;
}
  /* =====================================
   3. Layout Containers - UPDATED
===================================== */
.container {
  width: 100%;
  min-height: 100vh;
  margin: 0;
  padding: 0;
  position: relative;
  transition: background 0.3s ease, color 0.3s ease;
}

/* =====================================
   4. Dark Mode Overrides - UPDATED
===================================== */
.container.dark {
  background-color: #111827;
  color: #f3f4f6;
}

.container.dark .card {
  background-color: #1f2937;
  border: 1px solid #374151;
}

.container.dark .section-card {
  background-color: #1a2332 !important;  /* Darker blue-gray for sections */
  border: 1px solid #2d3748 !important;  /* Dark border */
  color: #e5e7eb !important;  /* Light text */
}

.container.dark .subtopic-item {
  background-color: #1f2937;
  border: 1px solid #374151;
  color: #e5e7eb;
}

.container.dark .subtopic-item:hover {
  background-color: #2d3748;
}

/* Add this to fix body background */
body {
  margin: 0;
  padding: 0;
  background-color: inherit; /* Inherits from container */
}
  /* =====================================
   0. Root Element Fix
===================================== */
html {
  margin: 0;
  padding: 0;
  background-color: #111827; /* Dark mode background */
}

/* =====================================
   1. Layout Containers (Updated)
===================================== */
body {
  margin: 0;
  padding: 0;
  background-color: inherit;
}

.container.dark {
  background-color: #111827;
  color: #e5e7eb;
  min-height: 100vh;
}

.container.light {
  background-color: #f9fafb;
  color: #111827;
}

/* =====================================
   2. Card Colors Fix (Including Notes Section)
===================================== */
.container.dark .card {
  background-color: #1f2937;
  border: 1px solid #374151;
}


.container.dark .section-card {
  background-color: #1a2332 !important;
  border: 1px solid #2d3748 !important;
}

/* Notes content specific styling */
.container.dark .final-content-card {
  background-color: #1a2332;
  border: 1px solid #2d3748;
  color: #e5e7eb;
}

.container.dark .final-content-html {
  color: #e5e7eb;
}

/* Style HTML content inside notes */
.container.dark .final-content-html h1,
.container.dark .final-content-html h2,
.container.dark .final-content-html h3 {
  color: #e5e7eb;
}

.container.dark .final-content-html a {
  color: #818cf8;
}

.container.dark .final-content-html code {
  background-color: #111827;
  color: #f3f4f6;
  padding: 2px 4px;
  border-radius: 4px;
}

.container.dark .final-content-html pre {
  background-color: #111827 !important;
  padding: 1rem;
  border-radius: 8px;
  border: 1px solid #374151;
}

.container.dark .final-content-html strong {
  color: #f3f4f6;
}

// Light
.container.light {
  background-color: #f9fafb;
  color: #111827;
}

.container.light .card {
  background-color: #fff;
  border: 1px solid #e5e7eb;
}

.container.light .section-card {
  background-color: #fff;
  border: 1px solid #e5e7eb;
}

.container.light .final-content-card {
  background-color: #fff;
  border: 1px solid #e5e7eb;
}

.container.light .final-content-html {
  color: #111827;
}


/* =====================================
   3. Full-width Background Fix
===================================== */
@media (min-width: 1600px) {
  .container.dark {
    background-color: #111827;
  }

  .container.light {
    background-color: #f9fafb;
  }

  .wrapper {
    max-width: 1200px;
  }
}

/* Add to your existing styles */
.final-content-card {
  margin: 1rem auto;
  max-width: calc(100% - 2rem);
}

.container.light .final-content-card {
  background-color: var(--white);
  border: 1px solid var(--indigo-100);
}

.container.dark .final-content-card {
  background-color: #1a2332;
  border: 1px solid #2d3748;
}

.container {
  max-width: none;
  width: 100%;
  height: 100%;
  overflow: hidden auto;
}



/* Light mode: set text color to black */
.container.light .final-content-card p,
.container.light .final-content-html {
  color: #000000 !important;
}

/* Dark mode: set text color to white */
.container.dark .final-content-card p,
.container.dark .final-content-html {
  color: #ffffff !important;
}

/* Mobile Adjustments */
@media (max-width: 768px) {
  .final-content-card {
    padding: 0.5rem !important;
  }
  .final-content-card p,
  .final-content-html {
    font-size: 0.75rem !important;
    line-height: 1.2 !important;
  }
}

/* =====================================
   Reduce Headings Size in Generated Notes
===================================== */
.final-content-html h1,
.final-content-html h2,
.final-content-html h3 {
  font-size: 1rem !important;       /* Adjust this value as needed */
  line-height: 1.2 !important;
  margin-bottom: 0.5rem !important;
}

/* For extra-small devices, further reduce heading size if desired */
@media (max-width: 768px) {
  .final-content-html h1,
  .final-content-html h2,
  .final-content-html h3 {
    font-size: 0.9rem !important;
  }
}

/* =====================================
   Responsive Headings in Generated Notes
===================================== */
.final-content-html h1,
.final-content-html h2,
.final-content-html h3 {
  /* Ensure headings are a little smaller */
  font-size: clamp(1rem, 2vw, 1.4rem);
  line-height: 1.3;
  margin-bottom: 0.5rem;
}

/* =====================================
   Responsive Paragraph Text in Generated Notes
   (Increased slightly for better readability)
===================================== */
.final-content-html p {
  font-size: clamp(1.1rem, 2.2vw, 1.6rem);
  line-height: 1.5;
  margin-bottom: 0.5rem;
  text-align: justify;  /* Justify the text for neat alignment */
}

/* =====================================
   Mobile Adjustments (Optional Fallback)
===================================== */
@media (max-width: 768px) {
  .final-content-html h1,
  .final-content-html h2,
  .final-content-html h3 {
    font-size: 1.5rem;
  }
  .final-content-html p {
    font-size: 1.5rem;
  }
}
      `}</style>
    </>
  );
};

export default Home;


