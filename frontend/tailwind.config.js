/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Spotify風のカラーパレット
        'spotify-black': '#000000',
        'spotify-dark': '#121212',
        'spotify-dark-gray': '#181818',
        'spotify-gray': '#282828',
        'spotify-light-gray': '#b3b3b3',
        'spotify-white': '#ffffff',
        'spotify-green': '#1ed760',
        'spotify-green-hover': '#1fdf64',
        'spotify-green-active': '#1db954',
        
        // メール関連のカラー
        'unread-blue': '#3b82f6',
        'read-gray': '#6b7280',
        'important-red': '#ef4444',
        'draft-yellow': '#f59e0b',
      },
      fontFamily: {
        'spotify': ['Circular', 'ui-sans-serif', 'system-ui'],
      },
      boxShadow: {
        'spotify': '0 2px 4px 0 rgba(0, 0, 0, 0.2)',
        'spotify-hover': '0 8px 24px rgba(0, 0, 0, 0.5)',
      },
      borderRadius: {
        'spotify': '8px',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
}; 