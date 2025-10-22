import Head from 'next/head';
import Script from 'next/script';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Features from './components/Features';
import HowItWorks from './components/HowItWorks';
import Testimonials from './components/Testimonials';
import CTA from './components/CTA';
import Footer from './components/Footer';

export default function Home() {
  return (
    <>
      <Head>
        <title>TopicSimplify - AI-Powered Learning Assistant</title>
        <meta
          name="description"
          content="Harness the power of AI to break down any subject into digestible, structured knowledge. Master new concepts faster than ever before."
        />
        
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </Head>

      <Script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3715172247216449" crossOrigin="anonymous"></Script>

      {/* Firebase Initialization Script using Next.js Script component */}
      <Script id="firebase-init" type="module">
        {`
          // Import the functions you need from the SDKs you need
          import { initializeApp } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-app.js";
          import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-analytics.js";

          // Your web app's Firebase configuration
          const firebaseConfig = {
            apiKey: "AIzaSyCvbIzN5y8jtF11IStMvb4tSAzflagR5Jg",
            authDomain: "studyguide-9ebf2.firebaseapp.com",
            projectId: "studyguide-9ebf2",
            storageBucket: "studyguide-9ebf2.firebasestorage.app",
            messagingSenderId: "264351112015",
            appId: "1:264351112015:web:2d95cd0899eb4ce08e033a",
            measurementId: "G-W4NYWX6KHG"
          };

          // Initialize Firebase
          const app = initializeApp(firebaseConfig);
          const analytics = getAnalytics(app);
        `}
      </Script>

      <Navbar />
      <main>
        <Hero />
        <svg
          className="wave wave-bottom"
          viewBox="0 0 1440 220"
          preserveAspectRatio="none"
        >
          <path
            fill="#fff"
            fillOpacity="1"
            d="M0,96L48,106.7C96,117,192,139,288,160C384,181,480,203,576,202.7C672,203,768,181,864,154.7C960,128,1056,96,1152,112C1248,128,1344,192,1392,224L1440,256L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z"
          ></path>
        </svg>
        <Features />
        <svg
          className="wave wave-top"
          viewBox="0 0 1440 220"
          preserveAspectRatio="none"
        >
          <path
            fill="#fff"
            fillOpacity="1"
            d="M0,96L48,106.7C96,117,192,139,288,160C384,181,480,203,576,202.7C672,203,768,181,864,154.7C960,128,1056,96,1152,112C1248,128,1344,192,1392,224L1440,256L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z"
          ></path>
        </svg>
        <HowItWorks />
        <svg
          className="wave wave-bottom"
          viewBox="0 0 1440 220"
          preserveAspectRatio="none"
        >
          <path
            fill="#fff"
            fillOpacity="1"
            d="M0,96L48,106.7C96,117,192,139,288,160C384,181,480,203,576,202.7C672,203,768,181,864,154.7C960,128,1056,96,1152,112C1248,128,1344,192,1392,224L1440,256L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z"
          ></path>
        </svg>
        <Testimonials />
        <svg
          className="wave wave-top"
          viewBox="0 0 1440 220"
          preserveAspectRatio="none"
        >
          <path
            fill="#fff"
            fillOpacity="1"
            d="M0,96L48,106.7C96,117,192,139,288,160C384,181,480,203,576,202.7C672,203,768,181,864,154.7C960,128,1056,96,1152,112C1248,128,1344,192,1392,224L1440,256L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z"
          ></path>
        </svg>
        <CTA />
        <svg
          className="wave wave-bottom"
          viewBox="0 0 1440 220"
          preserveAspectRatio="none"
        >
          <path
            fill="#312e81"
            fillOpacity="1"
            d="M0,192L48,208C96,224,192,256,288,256C384,256,480,224,576,213.3C672,203,768,213,864,192C960,171,1056,117,1152,117.3C1248,117,1344,171,1392,197.3L1440,224L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
          ></path>
        </svg>
      </main>
      <Footer />
    </>
  );
}
