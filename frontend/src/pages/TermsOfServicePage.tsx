import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function TermsOfServicePage() {
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
            Terms and Conditions
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            Last Updated: 12/02/2025
          </p>

          <div className="prose dark:prose-invert max-w-none">
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              Welcome to Pixel Tales, a mobile application designed to help children create and share stories with the guidance of parents or teachers. Please read these Terms and Conditions carefully before using the app. By accessing or using Pixel Tales, you agree to be bound by these terms.
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-4">
                1. Acceptance of Terms
              </h2>
              <p className="text-gray-700 dark:text-gray-300">
                By downloading or using the app, you agree to follow these Terms and Conditions. If you do not agree with any part of these terms, please discontinue use of the application.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-4">
                2. Purpose of the Application
              </h2>
              <p className="text-gray-700 dark:text-gray-300">
                Pixel Tales is designed for educational and creative purposes. It allows children to write stories, draw illustrations, and collaborate safely with the supervision of parents or teachers.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-4">
                3. User Accounts
              </h2>
              <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                <li>Parents or teachers must create an account to manage and supervise child users.</li>
                <li>Children's profiles are created within the parent or teacher account.</li>
                <li>You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-4">
                4. Acceptable Use
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-3">
                You agree to use Pixel Tales only for lawful, educational, and creative purposes. You may not:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                <li>Upload, post, or share any inappropriate or harmful content.</li>
                <li>Attempt to hack, reverse-engineer, or interfere with the system.</li>
                <li>Use the app to harass, impersonate, or harm others.</li>
              </ul>
              <p className="text-gray-700 dark:text-gray-300 mt-3">
                Violation of these rules may result in account suspension or deletion.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-4">
                5. Intellectual Property
              </h2>
              <p className="text-gray-700 dark:text-gray-300">
                All materials, logos, designs, and features of Pixel Tales are the property of the developers. Users retain ownership of their own stories and illustrations but grant the app permission to display their work within the platform (e.g., in the "Discover" section).
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-4">
                6. Content Responsibility
              </h2>
              <p className="text-gray-700 dark:text-gray-300">
                Parents and teachers are responsible for monitoring the content created by their children or students. The developers are not liable for user-generated content posted or shared through the app.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-4">
                7. Limitation of Liability
              </h2>
              <p className="text-gray-700 dark:text-gray-300">
                The developers are not responsible for data loss, app malfunction, or user misuse. Pixel Tales is provided "as is" without any warranties, either express or implied.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-4">
                8. Modifications to the App
              </h2>
              <p className="text-gray-700 dark:text-gray-300">
                The developers reserve the right to update, modify, or discontinue features of Pixel Tales at any time without prior notice to improve user experience or ensure compliance with privacy standards.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-4">
                9. Termination
              </h2>
              <p className="text-gray-700 dark:text-gray-300">
                You may stop using Pixel Tales at any time. The developers may suspend or terminate your access if you violate these Terms and Conditions.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-4">
                10. Contact Information
              </h2>
              <p className="text-gray-700 dark:text-gray-300">
                For questions or support, please contact:
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
