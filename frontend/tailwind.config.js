/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        purple: {
          50: '#faf5ff',
          100: '#f3e8ff',
          200: '#e9d5ff',
          300: '#d8b4fe',
          400: '#c084fc',
          500: '#8B5CF6', // Primary purple from design profile
          600: '#7C3AED', // Purple dark from design profile
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
        },
        gray: {
          50: '#F9FAFB',   // Page background
          100: '#F3F4F6',
          200: '#E5E7EB',  // Border color
          300: '#D1D5DB',
          400: '#9CA3AF',
          500: '#6B7280',  // Muted text
          600: '#4B5563',
          700: '#374151',
          800: '#1F2937',
          900: '#111827',  // Dark text
        },
        orange: {
          400: '#fb923c',
          500: '#FB923C', // Accent orange from design profile
          600: '#ea580c',
        },
        red: {
          500: '#EF4444', // Destructive red from design profile
          600: '#DC2626', // Red dark from design profile
        },
        green: {
          600: '#059669', // Success green
        }
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
