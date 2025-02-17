"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Head from "next/head";
import Script from "next/script";

type ViewState = "input" | "mainOutline" | "subOutline" | "finalContent";

const Home: React.FC = () => {
  // Topic and view states.
  const [topic, setTopic] = useState<string>("");
  const [view, setView] = useState<ViewState>("input");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  // Caches for already streamed HTML.
  const mainOutlineCache = useRef<{ [key: string]: string }>({});
  const subOutlineCache = useRef<{ [key: string]: string }>({});
  const finalContentCache = useRef<{ [key: string]: string }>({});

  // State for streamed HTML.
  const [mainOutlineHTML, setMainOutlineHTML] = useState("");
  const [subOutlineHTML, setSubOutlineHTML] = useState("");
  const [finalContent, setFinalContent] = useState<string | null>(null);

  const [selectedSubtopic, setSelectedSubtopic] = useState<string>("");
  const [selectedSubSubtopic, setSelectedSubSubtopic] = useState<string>("");

  // Streaming completion states.
  const [streamingDone, setStreamingDone] = useState<boolean>(false);
  const [subOutlineStreamingDone, setSubOutlineStreamingDone] = useState<boolean>(false);

  const [darkMode, setDarkMode] = useState<boolean>(false);
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

  const handleSelectFinalContent = useCallback(async (subsubTitle: string) => {
    if (!topic || !selectedSubtopic) return;
    setLoading(true);
    setError(null);
    setStreamingDone(false);
    try {
      if (finalContentCache.current[subsubTitle]) {
        setFinalContent(finalContentCache.current[subsubTitle]);
        setView("finalContent");
        setStreamingDone(true);
      } else {
        setFinalContent("");
        setView("finalContent");
        setSelectedSubSubtopic(subsubTitle);
        const notes = await fetchNotesStream(subsubTitle, topic, selectedSubtopic);
        finalContentCache.current[subsubTitle] = notes;
        setFinalContent(notes);
      }
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "An unknown error occurred";
      setError(errorMessage);
      setReloadCallback(() => () => handleSelectFinalContent(subsubTitle));
    } finally {
      setLoading(false);
    }
  }, [topic, selectedSubtopic]);

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
      const formatted = accumulatedContent.replace(/\n/g, " ");
      setFinalContent(formatted);
      if (!firstChunkReceived) {
        setLoading(false);
        firstChunkReceived = true;
      }
    }
    setStreamingDone(true);
    return accumulatedContent;
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
            handleSelectFinalContent(span.textContent);
          }
        }
      };
      container.addEventListener("click", clickHandler as EventListener);
      return () => container.removeEventListener("click", clickHandler as EventListener);
    }
  }, [view, subOutlineHTML, handleSelectFinalContent]);

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
    if (!selectedSubtopic || !selectedSubSubtopic || !topic) return;
    
    if (!question.trim()) {
      setError("Please ask a follow-up question.");
      return;
    }
  
    setLoading(true);
    setError(null);
  
    const topicChain = `<h3>${topic} &gt; ${selectedSubtopic} &gt; ${selectedSubSubtopic}</h3>`;
    const payload = {
      selectedSubtopic,
      selectedSubSubtopic,
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
  
      const reader = res.body?.getReader();
      if (!reader) throw new Error("ReadableStream not supported in this browser.");
  
      const decoder = new TextDecoder("utf-8");
      let done = false;
      let firstChunkReceived = false;
  
      setFinalContent((prev) =>
        prev
          ? prev + `<br><br><strong>Q:</strong> ${question}<br><strong>A:</strong> `
          : `<strong>Q:</strong> ${question}<br><strong>A:</strong> `
      );
  
      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        const chunk = decoder.decode(value, { stream: !done });
  
        if (!firstChunkReceived && chunk.trim() !== "") {
          setLoading(false);
          firstChunkReceived = true;
        }
  
        setFinalContent((prev) => (prev ? prev + chunk : chunk));
      }
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
    setFinalContent(null);
    setSelectedSubtopic("");
    setStreamingDone(false);
    setSubOutlineStreamingDone(false);
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
    "Overcoming Life’s Obstacles",
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

      <div className={`container ${darkMode ? "dark" : "light"}`}>
        <header className="header">
          <h1>TopicSimplify</h1>
          <p>Reduce Your Study Time with TopicSimplify</p>
          <button className="theme-toggle" onClick={() => setDarkMode((prev) => !prev)}>
            {darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          </button>
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

          {view === "finalContent" && finalContent && (
            <div className="card card-outline">
              {streamingDone && (
                <button className="back-button" onClick={handleBackToSubOutline}>
                  ← Back
                </button>
              )}
              <h3>{topic} &gt; {selectedSubtopic} &gt; {selectedSubSubtopic}</h3>
              <div className="final-content-card">
                <div className="final-content-html" dangerouslySetInnerHTML={{ __html: finalContent }}></div>
              </div>
              {streamingDone && (
                <button className="back-button" onClick={handleBackToSubOutline}>
                  ← Back
                </button>
              )}
              <div className="dive-deeper-container">
                <h3>Dive Deeper</h3>
                <div className="dive-deeper-input">
                <input
          type="text"
          placeholder="Ask a follow-up question..."
          className="input-text"
          id="questionInput"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              const input = e.target as HTMLInputElement;
              handleAskQuestion(input.value);
              input.value = "";
            }
          }}
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
              <div className="download-read-container" style={{ display: "flex", gap: "1rem", marginTop: "1rem", justifyContent: "center" }}>
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
           Final Content Streaming Styles (Dynamic)
        ===================================== */
        .final-content-card {
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
        .dive-deeper-container {
          margin: 1rem 0;
        }
        .dive-deeper-input {
          display: flex;
          gap: 0.5rem;
          align-items: center;
        }
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

