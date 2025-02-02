import type { NextPage } from 'next';
import Head from 'next/head';

const Privacy: NextPage = () => {
  return (
    <>
      <Head>
        <title>Privacy Policy | StudyGuide</title>
        <meta name="description" content="Privacy Policy for StudyGuide" />
      </Head>
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-3xl mx-auto bg-white shadow-md p-8 rounded-lg">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-6">Privacy Policy</h1>
          <p className="text-gray-700 mb-4">
            <strong>Effective Date:</strong> January 24, 2025
          </p>

          {/* 1. Introduction */}
          <section className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">1. Introduction</h2>
            <p className="text-gray-700 mb-4">
              Welcome to StudyGuide (&ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;). This Privacy Policy describes how we collect, use, disclose, and safeguard your information when you visit{' '}
              <a href="https://www.aistudyguide.xyz/" className="text-primary-600 hover:underline">
                https://www.aistudyguide.xyz/
              </a> (the &ldquo;Site&rdquo;). By accessing or using our Site, you agree to the practices described in this Privacy Policy.
            </p>
          </section>

          {/* 2. Information We Collect */}
          <section className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">2. Information We Collect</h2>
            <p className="text-gray-700 mb-4">
              We may collect both personally identifiable information (&ldquo;PII&rdquo;) and non-personally identifiable information from you when you visit our Site. This includes:
            </p>
            <ul className="list-disc list-inside text-gray-700">
              <li>
                <strong>Personal Information:</strong> Such as your name, email address, and other details you provide when signing up or contacting us.
              </li>
              <li>
                <strong>Usage Data:</strong> Information automatically collected when you interact with our Site, such as your IP address, browser type, pages visited, and the dates/times of your visits.
              </li>
              <li>
                <strong>Cookies and Tracking Data:</strong> We use cookies and similar tracking technologies to track activity on our Site and store certain information.
              </li>
            </ul>
          </section>

          {/* 3. How We Use Your Information */}
          <section className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">3. How We Use Your Information</h2>
            <p className="text-gray-700 mb-4">
              We use the information we collect to:
            </p>
            <ul className="list-disc list-inside text-gray-700">
              <li>Provide, maintain, and improve our Site and services.</li>
              <li>Personalize your experience and deliver content tailored to your interests.</li>
              <li>Communicate with you regarding updates, promotions, and important information.</li>
              <li>Analyze usage trends and diagnose technical issues.</li>
            </ul>
          </section>

          {/* 4. Disclosure of Your Information */}
          <section className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">4. Disclosure of Your Information</h2>
            <p className="text-gray-700 mb-4">
              We may share your information in the following situations:
            </p>
            <ul className="list-disc list-inside text-gray-700">
              <li>
                <strong>Service Providers:</strong> With third-party vendors who perform services on our behalf.
              </li>
              <li>
                <strong>Legal Requirements:</strong> When required to do so by law or in response to valid requests by public authorities.
              </li>
              <li>
                <strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets, your information may be transferred as part of that transaction.
              </li>
            </ul>
          </section>

          {/* 5. Cookies and Tracking Technologies */}
          <section className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">5. Cookies and Tracking Technologies</h2>
            <p className="text-gray-700 mb-4">
              We use cookies and similar tracking technologies to enhance your experience on our Site. You can control the use of cookies at the individual browser level. If you choose to disable cookies, some features of our Site may not work as intended.
            </p>
          </section>

          {/* 6. Data Security */}
          <section className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">6. Data Security</h2>
            <p className="text-gray-700 mb-4">
              We implement reasonable security measures to protect your information from unauthorized access, alteration, disclosure, or destruction. However, no internet transmission or electronic storage method is 100% secure.
            </p>
          </section>

          {/* 7. Your Rights and Choices */}
          <section className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">7. Your Rights and Choices</h2>
            <p className="text-gray-700 mb-4">
              Depending on your jurisdiction, you may have the right to access, correct, or delete your personal information, as well as the right to object to or restrict certain processing of your information. To exercise these rights, please contact us using the information provided below.
            </p>
          </section>

          {/* 8. Third Party Links */}
          <section className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">8. Third Party Links</h2>
            <p className="text-gray-700 mb-4">
              Our Site may contain links to third-party websites. We are not responsible for the privacy practices of these other sites. We encourage you to review the privacy policies of any third-party sites you visit.
            </p>
          </section>

          {/* 9. Children's Privacy */}
          <section className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">9. Children&apos;s Privacy</h2>
            <p className="text-gray-700 mb-4">
              Our Site is not intended for children under the age of 13. We do not knowingly collect personal information from children under 13. If we become aware that a child under 13 has provided us with personal information, we will take steps to delete such information.
            </p>
          </section>

          {/* 10. Changes to This Privacy Policy */}
          <section className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">10. Changes to This Privacy Policy</h2>
            <p className="text-gray-700 mb-4">
              We may update this Privacy Policy from time to time. Any changes will be posted on this page with an updated effective date. Your continued use of our Site after any changes indicates your acceptance of the updated Privacy Policy.
            </p>
          </section>

          {/* 11. Contact Information */}
          <section className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">11. Contact Information</h2>
            <p className="text-gray-700 mb-4">
              If you have any questions or concerns about this Privacy Policy, please contact us at:
            </p>
            <ul className="list-disc list-inside text-gray-700">
              <li>
                <strong>Email:</strong>{' '}
                <a href="mailto:samuelaidoo45@gmail.com" className="text-primary-600 hover:underline">
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

export default Privacy;
