export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef2ff',
          100: '#e0e7ff',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          900: '#1e1b4b',
          950: '#0f172a',
        },
        accent: {
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
        },
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(255,255,255,0.08), 0 20px 60px rgba(79,70,229,0.22)',
      },
      backgroundImage: {
        'hero-radial': 'radial-gradient(circle at top, rgba(99,102,241,0.32), rgba(15,23,42,0.92) 45%, rgba(2,6,23,1) 75%)',
      },
    },
  },
  plugins: [],
};
