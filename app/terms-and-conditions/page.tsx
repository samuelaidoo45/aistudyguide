import type { NextPage } from 'next';
import Head from 'next/head';

const Terms: NextPage = () => {
  return (
    <>
      <Head>
        <title>Terms and Conditions | StudyGuide</title>
        <meta name="description" content="Terms and Conditions for StudyGuide" />
      </Head>
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-3xl mx-auto bg-white shadow-md p-8 rounded-lg">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-6">
            Terms and Conditions
          </h1>
          <p className="text-gray-700 mb-4">
            <strong>Effective Date:</strong> January 24, 2025
          </p>

          {/* 1. Introduction */}
          <section className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              1. Introduction
            </h2>
            <p className="text-gray-700 mb-4">
              Welcome to StudyGuide (&ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;). These Terms and Conditions (&ldquo;Terms&rdquo;) govern your access to and use of our website located at{' '}
              <a
                href="https://www.aistudyguide.xyz/"
                className="text-primary-600 hover:underline"
              >
                https://www.aistudyguide.xyz/
              </a>{' '}
              (the &ldquo;Site&rdquo;) and the services provided therein, including AI-powered
              study outlines, interactive learning features, smart summaries, and any related
              content (collectively, the &ldquo;Services&rdquo;). By accessing or using our Site,
              you agree to be bound by these Terms. If you do not agree to these Terms, please do not
              use our Site.
            </p>
          </section>

          {/* 2. Acceptance of Terms */}
          <section className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              2. Acceptance of Terms
            </h2>
            <p className="text-gray-700 mb-4">
              By using this Site, you represent that you are at least 18 years of age and that you agree to these Terms and all applicable laws and regulations. If you do not agree
              with any part of these Terms, you must cease using the Site immediately.
            </p>
          </section>

          {/* 3. Modifications to Terms */}
          <section className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              3. Modifications to Terms
            </h2>
            <p className="text-gray-700 mb-4">
              We reserve the right to modify or update these Terms at any time, and such changes will be effective upon posting on the Site. Your continued use of the Site after any modifications
              constitutes your acceptance of the revised Terms. It is your responsibility to review these Terms periodically for any updates.
            </p>
          </section>

          {/* 4. Use of the Site and Services */}
          <section className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              4. Use of the Site and Services
            </h2>
            <div className="mb-4">
              <h3 className="text-2xl font-semibold text-gray-800 mb-2">
                4.1. Eligibility and Account Responsibility
              </h3>
              <ul className="list-disc list-inside text-gray-700">
                <li>
                  You agree to use the Site only for lawful purposes and in accordance with these Terms.
                </li>
                <li>
                  You are responsible for maintaining the confidentiality of any account information and for all activities that occur under your account (if applicable).
                </li>
              </ul>
            </div>
            <div className="mb-4">
              <h3 className="text-2xl font-semibold text-gray-800 mb-2">
                4.2. Permitted Use
              </h3>
              <ul className="list-disc list-inside text-gray-700">
                <li>
                  You are granted a limited, non-exclusive, non-transferable, revocable license to access and use the Site for personal, non-commercial purposes.
                </li>
                <li>
                  You may not use the Site or Services in any manner that could damage, disable, overburden, or impair our servers or networks.
                </li>
              </ul>
            </div>
            <div className="mb-4">
              <h3 className="text-2xl font-semibold text-gray-800 mb-2">
                4.3. Prohibited Activities
              </h3>
              <ul className="list-disc list-inside text-gray-700">
                <li>
                  You agree not to engage in any activities that may violate any laws or infringe upon the rights of others.
                </li>
                <li>
                  Prohibited activities include, but are not limited to, unauthorized access, reverse engineering, or attempts to interfere with the proper functioning of the Site.
                </li>
              </ul>
            </div>
          </section>

          {/* 5. Intellectual Property */}
          <section className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              5. Intellectual Property
            </h2>
            <div className="mb-4">
              <h3 className="text-2xl font-semibold text-gray-800 mb-2">
                5.1. Ownership
              </h3>
              <p className="text-gray-700 mb-4">
                All content provided on the Site, including text, graphics, logos, images, and software, is the property of StudyGuide or its content suppliers and is protected by international
                copyright laws. The design and layout of the Site, including any AI-generated content, is the exclusive property of StudyGuide.
              </p>
            </div>
            <div className="mb-4">
              <h3 className="text-2xl font-semibold text-gray-800 mb-2">
                5.2. Use of Content
              </h3>
              <p className="text-gray-700 mb-4">
                You may view, download, and print content from the Site for personal, non-commercial use only, provided that you retain all copyright and other proprietary notices contained therein. Any redistribution, reproduction, modification, or use of the Site&apos;s content for commercial purposes without explicit written permission is strictly prohibited.
              </p>
            </div>
          </section>

          {/* 6. AI-Generated Content Disclaimer */}
          <section className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              6. AI-Generated Content Disclaimer
            </h2>
            <p className="text-gray-700 mb-4">
              The Site leverages artificial intelligence to generate study outlines, interactive Q&amp;A, summaries, and other content. While we strive for accuracy and clarity, the AI-generated content is provided &ldquo;as is&rdquo; and may contain inaccuracies or errors. You agree that your use of such content is at your sole risk and that we shall not be liable for any losses or damages arising from your reliance on the AI-generated information.
            </p>
          </section>

          {/* 7. Privacy */}
          <section className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">7. Privacy</h2>
            <p className="text-gray-700 mb-4">
              Your privacy is important to us. Please review our{' '}
              <a href="/privacy-policy" className="text-primary-600 hover:underline">
                Privacy Policy
              </a>{' '}
              to understand how we collect, use, and protect your personal information. By using the Site, you consent to our collection and use of information in accordance with our Privacy Policy.
            </p>
          </section>

          {/* 8. Disclaimers and Limitation of Liability */}
          <section className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              8. Disclaimers and Limitation of Liability
            </h2>
            <div className="mb-4">
              <h3 className="text-2xl font-semibold text-gray-800 mb-2">
                8.1. Disclaimer of Warranties
              </h3>
              <p className="text-gray-700 mb-4">
                The Site and all content and services provided are delivered on an &ldquo;as is&rdquo; and &ldquo;as available&rdquo; basis without any warranties, express or implied. We do not
                warrant that the Site will be uninterrupted, error-free, or free of viruses or other harmful components.
              </p>
            </div>
            <div className="mb-4">
              <h3 className="text-2xl font-semibold text-gray-800 mb-2">
                8.2. Limitation of Liability
              </h3>
              <p className="text-gray-700 mb-4">
                In no event shall StudyGuide, its officers, directors, employees, or affiliates be liable for any indirect, incidental, special, consequential, or punitive damages arising out of or in
                connection with your use of or inability to use the Site or any content provided therein. Your sole remedy for dissatisfaction with the Site is to stop using the Site.
              </p>
            </div>
          </section>

          {/* 9. Indemnification */}
          <section className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">9. Indemnification</h2>
            <p className="text-gray-700 mb-4">
              You agree to indemnify, defend, and hold harmless StudyGuide and its affiliates, officers, agents, and employees from any claims, liabilities, damages, losses, or expenses (including reasonable attorneys&apos; fees) arising out of or in any way connected with your use of the Site, violation of these Terms, or infringement of any third-party rights.
            </p>
          </section>

          {/* 10. Governing Law and Jurisdiction */}
          <section className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              10. Governing Law and Jurisdiction
            </h2>
            <p className="text-gray-700 mb-4">
              These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in which StudyGuide operates, without regard to its conflict of law provisions. Any disputes arising under or in connection with these Terms shall be subject to the exclusive jurisdiction of the courts located in that jurisdiction.
            </p>
          </section>

          {/* 11. Termination */}
          <section className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">11. Termination</h2>
            <p className="text-gray-700 mb-4">
              We reserve the right to terminate or suspend your access to the Site, without notice, for conduct that we believe violates these Terms or is harmful to other users of the Site, StudyGuide, or third parties, or for any other reason in our sole discretion.
            </p>
          </section>

          {/* 12. Contact Information */}
          <section className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              12. Contact Information
            </h2>
            <p className="text-gray-700 mb-4">
              If you have any questions or concerns about these Terms, please contact us at:
            </p>
            <ul className="list-disc list-inside text-gray-700 mb-4">
              <li>
                <strong>Email:</strong>{' '}
                <a
                  href="mailto:samuelaidoo45@gmail.com"
                  className="text-primary-600 hover:underline"
                >
                  samuelaidoo45@gmail.com
                </a>
              </li>
            </ul>
          
          </section>
        </div>
      </div>
    </>
  );
};

export default Terms;
