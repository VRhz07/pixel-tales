import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function PrivacyPolicyPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-purple-900">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors"
          >
            <ArrowLeft size={24} />
            <span>Back</span>
          </button>
        </div>

        {/* Content */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          <h1 className="text-4xl font-bold text-purple-600 dark:text-purple-400 mb-2">
            Privacy Policy
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            Last Updated: 12/02/2025
          </p>

          <div className="prose dark:prose-invert max-w-none">
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              This Privacy Policy explains how Pixel Tales collects, uses, and protects your information. By using this app, you agree to the collection and use of information as described below.
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-4">
                1. Information We Collect
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-3">
                Pixel Tales collects the following information:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                <li><strong>Parent/Teacher Account Information:</strong> Name, email address, and password for login and account management.</li>
                <li><strong>Child User Information:</strong> Display name, username, and optional date of birth (used only for age-based personalization).</li>
                <li><strong>Story Data:</strong> User-generated stories, illustrations, and preferences stored securely in our database.</li>
                <li><strong>Usage Information:</strong> Device type, app activity, and performance data used to improve app functionality.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-4">
                2. How We Use Your Information
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-3">
                Collected data is used to:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                <li>Provide personalized story and illustration features.</li>
                <li>Allow parents and teachers to monitor children's progress.</li>
                <li>Maintain system security and improve user experience.</li>
                <li>Store and manage stories within the user's account.</li>
              </ul>
              <p className="text-gray-700 dark:text-gray-300 mt-4 font-semibold">
                We do not sell, trade, or share personal information with third parties.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-4">
                3. Parental and Teacher Supervision
              </h2>
              <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                <li>All child users must be registered and supervised by a parent or teacher account.</li>
                <li>Pixel Tales does not allow direct communication or account creation by unsupervised minors.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-4">
                4. Data Security
              </h2>
              <p className="text-gray-700 dark:text-gray-300">
                We implement appropriate technical and organizational measures to protect user data against unauthorized access, alteration, or deletion. Passwords are encrypted, and data transmission is secured.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-4">
                5. Data Retention
              </h2>
              <p className="text-gray-700 dark:text-gray-300">
                User data is stored only as long as the account remains active. When an account is deleted, all associated stories and child profiles are permanently removed from the system.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-4">
                6. User Rights
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-3">
                Users have the right to:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                <li>Access and review their stored information.</li>
                <li>Request correction or deletion of inaccurate data.</li>
                <li>Withdraw consent or delete their account at any time.</li>
              </ul>
              <p className="text-gray-700 dark:text-gray-300 mt-3">
                Requests may be made through the app or by contacting the developers directly.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-4">
                7. Updates to This Policy
              </h2>
              <p className="text-gray-700 dark:text-gray-300">
                We may revise this Privacy Policy from time to time. Any updates will be posted within the app, and continued use of the app means acceptance of the revised terms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-4">
                8. Contact Us
              </h2>
              <p className="text-gray-700 dark:text-gray-300">
                If you have any concerns or questions regarding your privacy, contact us at:
              </p>
              <p className="text-purple-600 dark:text-purple-400 font-semibold mt-2">
                📧 werpixeltales@gmail.com
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
