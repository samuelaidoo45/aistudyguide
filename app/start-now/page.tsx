"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Head from "next/head";
import Script from "next/script";
import { createClient } from '@/app/lib/supabase';

type ViewState = "input" | "mainOutline" | "subOutline";

const Home: React.FC = () => {
  const supabase = createClient();
  
  // Topic and view states.
  const [topic, setTopic] = useState<string>("");
  const [view, setView] = useState<ViewState>("input");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  // Caches for already streamed HTML.
  const mainOutlineCache = useRef<{ [key: string]: string }>({});
  const subOutlineCache = useRef<{ [key: string]: string }>({});

  // State for streamed HTML.
  const [mainOutlineHTML, setMainOutlineHTML] = useState("");
  const [subOutlineHTML, setSubOutlineHTML] = useState("");

  const [selectedSubtopic, setSelectedSubtopic] = useState<string>("");

  // Streaming completion states.
  const [subOutlineStreamingDone, setSubOutlineStreamingDone] = useState<boolean>(false);

  const [reloadCallback, setReloadCallback] = useState<(() => void) | null>(null);

  // --- Callback Handlers ---
  const handleSelectSubtopic = useCallback(async (subtopic: string) => {
    if (!topic) return;
    setLoading(true);
    setError(null);
    setSelectedSubtopic(subtopic);
    setSubOutlineStreamingDone(false);
    setSubOutlineHTML(""); // Clear previous sub‑outline if any.
    setView("subOutline");
    try {
      if (subOutlineCache.current[subtopic]) {
        setSubOutlineHTML(subOutlineCache.current[subtopic]);
        setSubOutlineStreamingDone(true);
        setLoading(false);
      } else {
        const html = await fetchSubOutlineHTMLStream(subtopic, topic);
        subOutlineCache.current[subtopic] = html;
        setSubOutlineHTML(html);
        setSubOutlineStreamingDone(true);
      }
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "An unknown error occurred";
      setError(errorMessage);
      setReloadCallback(() => () => handleSelectSubtopic(subtopic));
    } finally {
      setLoading(false);
    }
  }, [topic]);

  // --- Helper functions ---
  async function fetchMainOutlineHTMLStream(topic: string): Promise<string> {
    const res = await fetch("/api/generateOutline", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic, action: "generateOutlineHTML" }),
    });
    if (!res.ok) throw new Error("Failed to fetch main outline");

    const reader = res.body?.getReader();
    if (!reader) throw new Error("ReadableStream not supported in this browser");

    const decoder = new TextDecoder("utf-8");
    let accumulatedHTML = "";
    let firstChunkReceived = false;
    let lastUpdate = Date.now();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      let chunk = decoder.decode(value, { stream: true });
      chunk = chunk.replace(/```html/g, "").replace(/```/g, "");
      accumulatedHTML += chunk;
      const now = Date.now();
      if (now - lastUpdate > 50 || chunk.includes("</div>")) {
        setMainOutlineHTML(accumulatedHTML);
        if (!firstChunkReceived && accumulatedHTML.trim().length > 0) {
          setLoading(false);
          firstChunkReceived = true;
        }
        lastUpdate = now;
      }
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
    const cleanHTML = accumulatedHTML
      .replace(/(\r\n|\n|\r)/gm, "")
      .replace(/<\/div>\s*<div/g, "</div><div");
    setMainOutlineHTML(cleanHTML);
    return cleanHTML;
  }

  async function fetchSubOutlineHTMLStream(subtopic: string, mainTopic: string): Promise<string> {
    const res = await fetch("/api/generateSubOutline", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        topic: `Generate the sub-outline HTML for "${subtopic}" based on the main topic "${mainTopic}"`,
        action: "generateOutlineHTML",
      }),
    });
    if (!res.ok) throw new Error("Failed to fetch sub‑outline");

    const reader = res.body?.getReader();
    if (!reader) throw new Error("ReadableStream not supported in this browser");

    const decoder = new TextDecoder("utf-8");
    let accumulatedHTML = "";
    let firstChunkReceived = false;
    let lastUpdate = Date.now();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      let chunk = decoder.decode(value, { stream: true });
      chunk = chunk.replace(/```html/g, "").replace(/```/g, "");
      accumulatedHTML += chunk;
      const now = Date.now();
      if (now - lastUpdate > 50 || chunk.includes("</div>")) {
        setSubOutlineHTML(accumulatedHTML);
        if (!firstChunkReceived && accumulatedHTML.trim().length > 0) {
          setLoading(false);
          firstChunkReceived = true;
        }
        lastUpdate = now;
      }
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
    const cleanHTML = accumulatedHTML
      .replace(/(\r\n|\n|\r)/gm, "")
      .replace(/<\/div>\s*<div/g, "</div><div");
    setSubOutlineHTML(cleanHTML);
    setSubOutlineStreamingDone(true);
    return cleanHTML;
  }

  // --- useEffect hooks using the callbacks ---
  useEffect(() => {
    if (view === "mainOutline" && mainOutlineHTML.trim().length > 0) {
      const container = document.querySelector(".outline-sections");
      if (!container) return;
      const clickHandler = (e: MouseEvent) => {
        const target = (e.target as HTMLElement).closest(".subtopic-item");
        if (target) {
          const span = target.querySelector("span");
          if (span && span.textContent) {
            handleSelectSubtopic(span.textContent);
          }
        }
      };
      container.addEventListener("click", clickHandler as EventListener);
      return () => container.removeEventListener("click", clickHandler as EventListener);
    }
  }, [view, mainOutlineHTML, handleSelectSubtopic]);

  useEffect(() => {
    if (view === "subOutline" && subOutlineHTML.trim().length > 0) {
      const container = document.querySelector(".outline-sections");
      if (!container) return;
      const clickHandler = (e: MouseEvent) => {
        const target = (e.target as HTMLElement).closest(".subtopic-item");
        if (target) {
          const span = target.querySelector("span");
          if (span && span.textContent) {
            // We're removing the note fetching functionality
            // No action needed when clicking on sub-subtopics
          }
        }
      };
      container.addEventListener("click", clickHandler as EventListener);
      return () => container.removeEventListener("click", clickHandler as EventListener);
    }
  }, [view, subOutlineHTML]);

  // --- Other Handlers & Functions ---
  async function handleBreakdown(newTopic?: string) {
    const currentTopic = newTopic ?? topic;
    if (!currentTopic.trim()) return;
    setLoading(true);
    setError(null);
    setMainOutlineHTML("");
    setView("mainOutline");
    try {
      if (mainOutlineCache.current[currentTopic]) {
        setMainOutlineHTML(mainOutlineCache.current[currentTopic]);
        setView("mainOutline");
      } else {
        const html = await fetchMainOutlineHTMLStream(currentTopic);
        mainOutlineCache.current[currentTopic] = html;
        setMainOutlineHTML(html);
        setView("mainOutline");
      }
      setTopic(currentTopic);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "An unknown error occurred";
      setError(errorMessage);
      setReloadCallback(() => () => handleBreakdown(currentTopic));
    } finally {
      setLoading(false);
    }
  }

  async function handleAskQuestion(question: string) {
    if (!selectedSubtopic || !topic) return;
    
    if (!question.trim()) {
      setError("Please ask a follow-up question.");
      return;
    }
  
    setLoading(true);
    setError(null);
  
    const topicChain = `<h3>${topic} &gt; ${selectedSubtopic}</h3>`;
    const payload = {
      selectedSubtopic,
      topicChain,
      followUpQuestion: question,
      title: topic,
      sectionTitle: selectedSubtopic,
    };
  
    try {
      const res = await fetch("/api/diveDeeper", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to fetch answer");
  
      // Process response as needed
      setLoading(false);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "An unknown error occurred";
      setError(errorMessage);
      setReloadCallback(() => () => handleAskQuestion(question));
    } finally {
      setLoading(false);
    }
  }
  
  function handleBackToMainOutline() {
    setView("mainOutline");
    setSubOutlineHTML("");
    setSelectedSubtopic("");
    setSubOutlineStreamingDone(false);
  }

  function handleBackToSubOutline() {
    setView("subOutline");
    setSelectedSubtopic("");
    setSubOutlineStreamingDone(false);
  }

  function handleDownloadWord() {
    if (!subOutlineHTML) return;
    const tempEl = document.createElement("div");
    tempEl.innerHTML = subOutlineHTML;
    const text = tempEl.textContent || tempEl.innerText || "";
    const blob = new Blob([text], { type: "application/msword" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${selectedSubtopic}.doc`;
    link.click();
    URL.revokeObjectURL(url);
  }
  const allPredefinedTopics = [
    // Your original 100 topics:
    "Time Management for Busy Lives",
    "Effective Communication in Relationships",
    "Budgeting and Personal Finance",
    "Healthy Eating on a Budget",
    "Career Advancement Strategies",
    "Stress Management Techniques",
    "Mindfulness and Meditation",
    "Work-Life Balance",
    "Effective Study Habits",
    "Home Organization and Decluttering",
    "DIY Home Repairs",
    "Travel Planning on a Budget",
    "Sustainable Living Tips",
    "Digital Detox Strategies",
    "Remote Work Best Practices",
    "Fitness Routines for Beginners",
    "Meal Planning and Cooking",
    "Parenting Tips and Hacks",
    "Self-Care and Mental Health",
    "Building and Maintaining Friendships",
    "Time-Saving Productivity Hacks",
    "Personal Branding and Networking",
    "Entrepreneurship in the Gig Economy",
    "Small Business Management",
    "Navigating Job Interviews",
    "Creating a Winning Resume",
    "Personal Development and Growth",
    "Public Speaking and Presentation Skills",
    "Negotiation and Conflict Resolution",
    "Investing Basics for Beginners",
    "Home Gardening and Indoor Plants",
    "Sustainable Fashion Choices",
    "Personal Safety and Self-Defense",
    "Cultivating a Positive Mindset",
    "Coping with Change and Uncertainty",
    "Understanding Personal Health",
    "Balancing Screen Time",
    "Cultural Awareness and Diversity",
    "Ethical Consumerism",
    "Building a Support Network",
    "Volunteering and Community Involvement",
    "Navigating Social Media",
    "Building Emotional Intelligence",
    "Daily Routines for Success",
    "Sleep Hygiene and Restful Sleep",
    "Overcoming Stress and Anxiety",
    "Minimalism and Simple Living",
    "Career Change and Transition",
    "Dealing with Burnout",
    "Relationship Building in the Digital Age",
    "Effective Goal Setting",
    "Managing Personal Relationships",
    "Workplace Communication",
    "Navigating Office Politics",
    "Creating a Healthy Work Environment",
    "Sustainable Travel Tips",
    "Managing Personal Debt",
    "Overcoming Procrastination",
    "Meditation for Beginners",
    "Personal Productivity Tools",
    "Managing Family Finances",
    "Home Safety and Security",
    "Effective Parenting in the Digital Age",
    "Modern Etiquette for Everyday Life",
    "Balancing Hobbies and Responsibilities",
    "Coping with Life Transitions",
    "Self-Motivation and Discipline",
    "Time Management for Students",
    "Online Learning Tips",
    "Overcoming Social Anxiety",
    "Building Self-Confidence",
    "Workplace Stress Management",
    "Coping with Grief and Loss",
    "Finding Work You Love",
    "Sustainable Home Living",
    "Practical Mindfulness in Daily Life",
    "Self-Improvement Techniques",
    "Building Healthy Habits",
    "Effective Decision Making",
    "Learning New Skills",
    "Setting Personal Boundaries",
    "Cultivating Gratitude",
    "Journaling for Personal Growth",
    "Mindful Parenting Strategies",
    "Enhancing Daily Social Interactions",
    "Improving Focus and Concentration",
    "Managing Digital Distractions",
    "Creating a Productive Home Office",
    "Community Building at Home",
    "Navigating Life Transitions",
    "Coping with Constant Change",
    "Managing Emotions Effectively",
    "Investing in Your Future",
    "Practical Self-Care Routines",
    "Building a Positive Daily Mindset",
    "Finding Balance in a Hectic World",
    "Planning for Retirement Early",
    "Mindful Spending Habits",
    "Family Communication Strategies",
    "Coping with Uncertainty in Life",
    "Building Resilience in Tough Times",
    "Developing a Growth Mindset",
    "Practical Leadership Skills",
    "Managing Expectations in Relationships",
    "Living a Purposeful Life",
    "Navigating Social Challenges",
    "Effective Home Management",
    "Balancing Work, Study, and Life",
    "Personal Organization Strategies",
    "Real-World Networking Techniques",
    "Staying Motivated Through Adversity",
    "Overcoming Perfectionism",
    "Building a Supportive Community",
    "Practicing Empathy Daily",
    "Healthy Conflict Resolution Strategies",
    "Dealing with Peer Pressure",
    "Discovering Your Passion",
    "Real-Life Financial Planning",
    "Improving Everyday Relationships",
    "Managing Daily Stress Effectively",
    "Positive Parenting Techniques",
    "Creating a Routine for Success",
    "Taking Charge of Your Life",
    "Self-Reflection for Growth",
    "Overcoming Life's Obstacles",
    "Realistic Goal Setting",
    "Enhancing Daily Productivity",
    "Practical Problem Solving",
    "Creating a Personal Action Plan",
    "Finding Balance in a Busy World",
  
    // Additional 100 specific, real-life relatable topics:
    "Improving Your Morning Routine",
    "Maximizing Productivity with Time Blocking",
    "Effective Meal Prepping for a Busy Week",
    "Navigating Remote Work Challenges",
    "Home Office Ergonomics for Better Health",
    "Financial Planning for Unexpected Expenses",
    "Developing a Sustainable Fitness Plan",
    "Meal Planning for Weight Loss",
    "Budgeting for a Family Vacation",
    "Mastering Online Grocery Shopping",
    "Building a Capsule Wardrobe on a Budget",
    "Sustainable Home Cleaning Practices",
    "DIY Natural Cleaning Products",
    "Creating a Minimalist Home Environment",
    "Improving Sleep Quality with Better Routines",
    "Effective Techniques for Reducing Anxiety",
    "Strategies for Mindful Eating",
    "Managing Social Media Usage for Wellbeing",
    "Balancing Screen Time and Outdoor Activities",
    "Tips for Remote Learning Success",
    "Managing Work Interruptions in a Home Office",
    "Navigating Difficult Conversations at Work",
    "Stress-Reduction Techniques for Daily Life",
    "Creating a Personal Development Plan",
    "Learning a New Language Effectively",
    "Building a Professional Online Presence",
    "Networking Strategies for Introverts",
    "Using Digital Tools for Personal Growth",
    "Developing Emotional Resilience in Tough Times",
    "Creating a Productive Daily Schedule",
    "Time Management for Creative Professionals",
    "Improving Communication Skills at Work",
    "Everyday Negotiation Tactics",
    "Planning a Successful Staycation",
    "Eco-Friendly Practices for Everyday Living",
    "Creating a Backyard Garden on a Budget",
    "Learning Basic Home Repair Skills",
    "Improving Family Dinner Time Togetherness",
    "Planning a Sustainable Wedding",
    "Coping with Career Transitions",
    "Leveraging Online Courses for Career Growth",
    "Using Meditation Apps for Daily Mindfulness",
    "Strategies for Effective Remote Collaboration",
    "Building a Side Hustle While Employed",
    "Time Management Tips for Busy Parents",
    "Managing Household Chores with Family Routines",
    "Staying Fit Without a Gym Membership",
    "DIY Home Décor on a Budget",
    "Creating an Emergency Fund for Financial Security",
    "Building Healthy Boundaries in Relationships",
    "Managing Freelance Work and Personal Life",
    "Adapting to Changing Work Environments",
    "Developing Self-Discipline for Success",
    "Coping with Social Isolation",
    "Using Journaling to Process Emotions",
    "Starting a Community Garden",
    "Tips for Downsizing Your Home",
    "Creating a Cozy and Inviting Living Space",
    "Improving Your Digital Literacy",
    "Learning to Cook Quick and Healthy Meals",
    "Navigating the Gig Economy with Confidence",
    "Mindful Parenting: Staying Present with Your Kids",
    "Techniques for Managing Distractions",
    "Building an Online Professional Portfolio",
    "Setting and Achieving Realistic Fitness Goals",
    "Finding Affordable Local Hobbies",
    "Managing Remote Teams Effectively",
    "Transitioning to a Plant-Based Diet",
    "Establishing a Consistent Self-Care Routine",
    "Practicing Daily Gratitude",
    "Building a Personalized Budgeting System",
    "Navigating the Challenges of Urban Living",
    "Effective Ways to Reduce Household Waste",
    "Finding Work-Life Harmony in a Digital Age",
    "Learning the Basics of Home Brewing",
    "Creating a Relaxing Evening Routine",
    "Strategies for Resolving Family Conflicts",
    "Mastering Online Public Speaking",
    "Boosting Work Efficiency with Automation Tools",
    "Starting a Local Book Club",
    "Building a Healthy Remote Work Culture",
    "Creating a Long-Term Career Vision",
    "Developing a Sustainable Personal Wardrobe",
    "Tips for Stress-Free Travel",
    "Planning a Zero-Waste Event",
    "Building a Daily Meditation Practice",
    "Overcoming Procrastination with Action Plans",
    "Using Social Media for Professional Networking",
    "Customizing a Home Fitness Routine",
    "Budgeting Strategies for College Students",
    "Organizing Your Digital Life Effectively",
    "Planning a Fun Family Game Night",
    "Learning to Cook International Cuisines",
    "Managing Seasonal Allergies Naturally",
    "Building a DIY Home Gym",
    "Maintaining a Healthy Sleep Schedule",
    "Creating a Routine for Creative Expression",
    "Practicing Effective Self-Reflection",
    "Establishing a Daily Exercise Habit",
    "Tips for a Stress-Free Morning",
    "Clean Coding",
    "Rich Dad, Poor Dad",
    "Practical Coding Practices in JavaScript",
    "Clean Code Principles and Best Practices",
    "Effective Debugging Techniques for Developers",
    "Mastering Data Structures and Algorithms in Practice",
    "Building Scalable Web Applications Step-by-Step",
    "Introduction to System Design and Architecture",
    "Real-World DevOps and CI/CD Pipelines",
    "Test-Driven Development: A Hands-On Approach",
    "Applying Design Patterns in Real Projects",
    "Git and Version Control Best Practices",
    "Optimizing Database Design and Performance",
    "Introduction to Microservices Architecture in Practice",
    "Practical Cybersecurity Essentials for Developers",
    "Mobile App Development: Best Practices and Pitfalls",
    "Cloud Computing and Deployment Strategies Simplified",
    "Building and Securing RESTful APIs",
    "Conducting Effective Code Reviews in Teams",
    "Agile Methodologies: Practical Implementation in Projects",
    "Hands-On Machine Learning and Data Science Projects",
    "Implementing Clean Architecture in Software Development",
  
    // Business & Finance
    "Real-World Business Strategy and Market Analysis",
    "Practical Financial Modeling for Startups",
    "Effective Supply Chain Management Techniques",
    "Digital Marketing Strategies for Modern Businesses",
    "Customer Relationship Management in Action",
    "Building a Data-Driven Business Culture",
  
    // Healthcare & Life Sciences
    "Practical Approaches to Public Health Management",
    "Healthcare Administration: Best Practices",
    "Implementing Patient-Centered Care Models",
    "Managing a Modern Medical Practice",
    "Data Analytics for Healthcare Professionals",
  
    // Arts, Design & Media
    "Creative Problem-Solving for Designers",
    "Practical Photography and Visual Storytelling",
    "Video Production Techniques for Beginners",
    "Digital Illustration and Graphic Design Workflows",
    "Content Creation Strategies for Social Media",
  
    // Education & Personal Development
    "Effective Classroom Management and Lesson Planning",
    "Practical Tips for Online Teaching and Learning",
    "Developing Critical Thinking Skills in Students",
    "Implementing Experiential Learning in Education",
  
    // Law & Public Policy
    "Practical Legal Research and Case Analysis",
    "Understanding Public Policy Through Real Cases",
    "Negotiation and Mediation in Legal Practice",
  
    // Environmental & Sustainability
    "Practical Approaches to Environmental Conservation",
    "Sustainable Business Practices and Green Innovations",
    "Renewable Energy Solutions: A Practical Guide"
  ];
    

  const [displayedTopics, setDisplayedTopics] = useState<string[]>([]);

  useEffect(() => {
    // Randomly shuffle and select 10 topics after the component mounts on the client.
    const shuffled = [...allPredefinedTopics].sort(() => 0.5 - Math.random());
    setDisplayedTopics(shuffled.slice(0, 5));
  }, []);
  

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

      <div className="container">
        <header className="header">
          <h1>TopicSimplify</h1>
          <p>Reduce Your Study Time with TopicSimplify</p>
        </header>
        <main className="wrapper">
          {view === "input" && (
            <>
               <div className="predefined-topics">
                {displayedTopics.map((pre, idx) => (
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

          {view === "mainOutline" && mainOutlineHTML && (
            <div className="card card-outline">
              
              <button className="back-button" onClick={() => setView("input")}>
                ← Back
              </button>

              <h3>{topic}</h3>
              {/* Render streamed main outline HTML */}
              <div className="outline-sections" dangerouslySetInnerHTML={{ __html: mainOutlineHTML }}></div>
            </div>
          )}

          {view === "subOutline" && (
            <div className="card card-outline">
              {subOutlineStreamingDone && (
                <button className="back-button" onClick={handleBackToMainOutline}>
                  ← Back
                </button>
              )}
              <h3>{topic} &gt; {selectedSubtopic}</h3>
              <div className="outline-sections" dangerouslySetInnerHTML={{ __html: subOutlineHTML }}></div>
              {subOutlineStreamingDone && (
                <button className="back-button" onClick={handleBackToMainOutline}>
                  ← Back
                </button>
              )}
            </div>
          )}

          {error && (
            <div className="error-state">
              <p className="error-message">{error}</p>
              <div className="error-buttons">
                <button className="error-button reload" onClick={() => { if (reloadCallback) { reloadCallback(); setError(null); } }}>
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
           Streaming Indicator
        ===================================== */
        .streaming-indicator {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-weight: bold;
          justify-content: center;
          padding: 1rem;
          flex-direction: column;
        }
        .streaming-text {
          max-width: 90%;
          white-space: pre-wrap;
          font-family: monospace;
          font-size: 0.9rem;
          background: #f0f0f0;
          padding: 0.5rem;
          border-radius: 4px;
          overflow-x: auto;
        }
        .spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(0,0,0,0.2);
          border-top-color: rgba(0,0,0,0.8);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        /* Add to global styles */
.subtopic-item.streaming {
  animation: pulse 1.5s infinite;
  position: relative;
}

@keyframes pulse {
  0% { opacity: 0.8; }
  50% { opacity: 0.4; }
  100% { opacity: 0.8; }
}

.subtopic-item.streaming::after {
  content: "🔄 Streaming...";
  position: absolute;
  right: 40px;
  color: var(--indigo-500);
  font-size: 0.8em;
}
      `}</style>
       <style jsx>{`
        .input-text {
          flex: 1;
          padding: 0.5rem;
          font-size: 1rem;
          border: 1px solid #ccc;
          border-radius: 4px;
        }
        .enhanced-btn {
          background-color: #007bff;
          border: none;
          color: #fff;
          padding: 0.5rem 1rem;
          border-radius: 4px;
          font-weight: bold;
          cursor: pointer;
          transition: background-color 0.2s ease-in-out, transform 0.1s;
        }
        .enhanced-btn:hover {
          background-color: #0056b3;
        }
        .enhanced-btn:active {
          transform: scale(0.98);
        }
      `}</style>
    <style jsx global>{`
          /* =====================================
   Base Styles
===================================== */
          :root {
            --white: #ffffff;
            --black: #000000;
            --gray-50: #f9fafb;
            --gray-100: #f3f4f6;
            --gray-200: #e5e7eb;
            --gray-300: #d1d5db;
            --gray-400: #9ca3af;
            --gray-500: #6b7280;
            --gray-600: #4b5563;
            --gray-700: #374151;
            --gray-800: #1f2937;
            --gray-900: #111827;
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
            --red-500: #ef4444;
            --green-500: #10b981;
            --space-xs: 0.25rem;
            --space-sm: 0.5rem;
            --space-md: 1rem;
            --space-lg: 1.5rem;
            --space-xl: 2rem;
            --space-2xl: 3rem;
            --space-3xl: 4rem;
            --radius-sm: 0.25rem;
            --radius-md: 0.5rem;
            --radius-lg: 0.75rem;
            --radius-xl: 1rem;
            --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
            --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
            --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
            --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
            --font-sans: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif;
            --font-serif: ui-serif, Georgia, Cambria, "Times New Roman", Times, serif;
            --font-mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
          }

          /* =====================================
   Reset & Base Styles
===================================== */
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }

          html,
          body {
            font-family: var(--font-sans);
            font-size: 16px;
            line-height: 1.5;
            background-color: var(--gray-50);
            color: var(--gray-900);
          }

          /* =====================================
   Layout & Container Styles
===================================== */
          .container {
            width: 100%;
            min-height: 100vh;
            background-color: var(--gray-50);
            color: var(--gray-900);
          }

          .wrapper {
            max-width: 1200px;
            margin: 0 auto;
            padding: var(--space-md);
          }

          /* =====================================
   Header Styles
===================================== */
          .header {
            text-align: center;
            padding: var(--space-xl) var(--space-md);
            background-color: var(--indigo-600);
            color: var(--white);
            margin-bottom: var(--space-xl);
          }

          .header h1 {
            font-size: 2.5rem;
            margin-bottom: var(--space-sm);
          }

          .header p {
            font-size: 1.25rem;
            opacity: 0.9;
          }

          /* =====================================
   Card & Input Styles
===================================== */
          .card {
            background-color: var(--white);
            border-radius: var(--radius-lg);
            box-shadow: var(--shadow-md);
            padding: var(--space-xl);
            margin-bottom: var(--space-xl);
            border: 1px solid var(--gray-200);
          }

          .input-container {
            margin-bottom: var(--space-lg);
          }

          .input-label {
            display: block;
            font-weight: 600;
            margin-bottom: var(--space-sm);
            color: var(--gray-700);
          }

          .input-text {
            width: 100%;
            padding: var(--space-md);
            border: 2px solid var(--gray-300);
            border-radius: var(--radius-md);
            font-size: 1rem;
            transition: border-color 0.3s, box-shadow 0.3s;
            background-color: var(--white);
            color: var(--gray-900);
          }

          .input-text:focus {
            outline: none;
            border-color: var(--indigo-500);
            box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.3);
          }

          .input-text::placeholder {
            color: var(--gray-500);
          }
        `}</style>
    </>
  );
};

export default Home;

