"use client";

import { useState, useRef } from "react";
import Head from "next/head";

interface Outline {
  topic: string;
  sections: {
    title: string;
    subsections: { title: string }[];
  }[];
}

type ViewState = "input" | "mainOutline" | "subOutline" | "finalContent";

const Home: React.FC = () => {
  // React state variables
  const [topic, setTopic] = useState<string>("");
  const [view, setView] = useState<ViewState>("input");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [mainOutline, setMainOutline] = useState<Outline | null>(null);
  const [subOutline, setSubOutline] = useState<Outline | null>(null);
  const [finalContent, setFinalContent] = useState<string | null>(null);
  const [selectedSubtopic, setSelectedSubtopic] = useState<string>("");
  const [darkMode, setDarkMode] = useState<boolean>(true);

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
    const res = await fetch("/api/generateOutline", {
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

  async function fetchNotes(
    subsubTitle: string,
    mainTopic: string,
    parentTopic: string
  ): Promise<string> {
    const res = await fetch("/api/generateNotes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subtopic: `Based on the main topic ${mainTopic} and ${parentTopic}, generate detailed notes on "${subsubTitle}"`,
        sectionTitle: parentTopic,
        title: `${parentTopic} (sub)`,
        action: "generateNotes",
      }),
    });
    if (!res.ok) throw new Error("Failed to fetch notes");
    const data = await res.json();
    return data.notes;
  }

  // Handlers for user actions
  async function handleBreakdown() {
    if (!topic.trim()) return;
    setLoading(true);
    setError(null);
    try {
      if (outlineCache.current[topic]) {
        setMainOutline(outlineCache.current[topic]);
        setView("mainOutline");
      } else {
        const outline = await fetchOutline(topic);
        outlineCache.current[topic] = outline;
        setMainOutline(outline);
        setView("mainOutline");
      }
    } catch (err) {
      setError((err as Error).message);
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
    } finally {
      setLoading(false);
    }
  }

  async function handleSelectFinalContent(subsubTitle: string) {
    if (!topic || !selectedSubtopic) return;
    setLoading(true);
    setError(null);
    try {
      if (finalContentCache.current[subsubTitle]) {
        setFinalContent(finalContentCache.current[subsubTitle]);
        setView("finalContent");
      } else {
        const notes = await fetchNotes(subsubTitle, topic, selectedSubtopic);
        finalContentCache.current[subsubTitle] = notes;
        setFinalContent(notes);
        setView("finalContent");
      }
    } catch (err) {
      setError((err as Error).message);
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
    } finally {
      setLoading(false);
    }
  }

  function handleBackToMainOutline() {
    setView("mainOutline");
    setSubOutline(null);
    setFinalContent(null);
    setSelectedSubtopic("");
  }

  function handleBackToSubOutline() {
    setView("subOutline");
    setFinalContent(null);
  }

  // Predefined topics for quick selection
  const predefinedTopics = [
    "Mathematics",
    "Physics",
    "API Development",
    "Programming",
    "Biology",
    "UI/UX Design",
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
      <div className={`container ${darkMode ? "dark" : "light"}`}>
        <header className="header">
          <h1>StudyGuide</h1>
          <p>Your dynamic study guide generator powered by AI</p>
          {/* <button
            className="theme-toggle"
            onClick={() => setDarkMode((prev) => !prev)}
          >
            {darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          </button> */}
        </header>
        <main className="wrapper">
          {/* Predefined Topics Section */}
          {view === "input" && (
            <div className="predefined-topics">
              {predefinedTopics.map((pre, idx) => (
                <button
                  key={idx}
                  className="topic-button"
                  onClick={() => {
                    setTopic(pre);
                    handleBreakdown();
                  }}
                >
                  {pre}
                </button>
              ))}
            </div>
          )}

          {view === "input" && (
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
                <button onClick={handleBreakdown} className="btn btn-primary">
                  <i data-lucide="lightbulb"></i> Break It Down
                </button>
              </div>
              {error && <div className="error">{error}</div>}
            </div>
          )}

          {view === "mainOutline" && mainOutline && (
            <div className="card card-outline">
              <button
                className="back-button"
                onClick={() => setView("input")}
              >
                ← Back
              </button>
              <h2>Understanding {mainOutline.topic}</h2>
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
              <h2>Understanding {selectedSubtopic}</h2>
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
                          onClick={() =>
                            handleSelectFinalContent(subsec.title)
                          }
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
              <button className="back-button" onClick={handleBackToSubOutline}>
                ← Back
              </button>
              <h2>Understanding {selectedSubtopic}</h2>
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
                      const input = document.getElementById(
                        "questionInput"
                      ) as HTMLInputElement;
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
            </div>
          )}

          {error && (
            <div className="error-state">
              <p className="error-message">{error}</p>
              <div className="error-buttons">
                <button
                  className="error-button reload"
                  onClick={() => {
                    setError(null);
                    setView("input");
                  }}
                >
                  Reload
                </button>
                <button
                  className="error-button back"
                  onClick={() => {
                    setError(null);
                    setView("input");
                  }}
                >
                  Back
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
          min-height: 100vh;
          padding: 2rem;
          position: relative;
          transition: background 0.3s ease, color 0.3s ease;
        }
        /* Dark mode: background dark, text light */
        .container.dark {
          background-color: var(--gray-900);
          color: var(--gray-50);
        }
        /* Light mode: use default (light) colors */
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
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05);
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
          /* Removed vertical line: no border-left or extra padding */
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
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        }
        .subtopic-item.active-subtopic {
          background-color: var(--indigo-200) !important;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
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
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05);
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
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05);
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
        .error-button.back {
          background: var(--gray-100);
          color: var(--gray-700);
        }
        .error-button.back:hover {
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
      `}</style>
    </>
  );
};

export default Home;
