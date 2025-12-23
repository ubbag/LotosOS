const colors = require('tailwindcss/colors');

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          light: '#60a5fa', // blue-400
          DEFAULT: '#3b82f6', // blue-500
          dark: '#2563eb',  // blue-600
        },
        secondary: {
          light: '#a78bfa', // violet-400
          DEFAULT: '#8b5cf6', // violet-500
          dark: '#7c3aed',  // violet-600
        },
        background: {
          light: '#f9fafb', // gray-50
          DEFAULT: '#f3f4f6', // gray-100
          dark: '#e5e7eb',   // gray-200
        },
        surface: {
          light: '#ffffff',
          DEFAULT: '#ffffff',
          dark: '#f9fafb', // gray-50
        },
        text: {
          DEFAULT: '#1f2937', // gray-800
          secondary: '#6b7280', // gray-500
          disabled: '#9ca3af', // gray-400
        },
        success: {
          DEFAULT: '#10b981', // emerald-500
          light: '#6ee7b7', // emerald-300
        },
        danger: {
          DEFAULT: '#ef4444', // red-500
          light: '#fca5a5', // red-300
        },
        warning: {
          DEFAULT: '#f59e0b', // amber-500
          light: '#fcd34d', // amber-300
        },
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        'card-hover': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}