import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './contexts/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1B5E20',
          50: '#E8F5E9',
          100: '#C8E6C9',
          200: '#A5D6A7',
          300: '#81C784',
          400: '#66BB6A',
          500: '#4CAF50',
          600: '#43A047',
          700: '#388E3C',
          800: '#2E7D32',
          900: '#1B5E20',
        },
        secondary: {
          DEFAULT: '#436182',
          50: '#EDF3FF',
          100: '#D6E5FF',
          200: '#B9D7FD',
          300: '#8DB8F5',
          400: '#6498E8',
          500: '#436182',
          600: '#3A5574',
          700: '#2E4560',
          800: '#24374D',
          900: '#1A2939',
        },
        tertiary: {
          DEFAULT: '#004BC0',
          50: '#E6F0FF',
          100: '#B3D4FF',
          200: '#80B8FF',
          300: '#4D9CFF',
          400: '#1A80FF',
          500: '#004BC0',
          600: '#0061F3',
          700: '#003A96',
          800: '#00296D',
          900: '#001944',
        },
        surface: {
          DEFAULT: '#F8F9FF',
          'container-lowest': '#FFFFFF',
          'container-low': '#EFF4FF',
          'container': '#E5EEFF',
          'container-high': '#DCE9FF',
          'container-highest': '#D3E4FE',
          tint: '#006D37',
        },
        on: {
          surface: '#0B1C30',
          'surface-variant': '#3F4940',
          primary: '#FFFFFF',
          'primary-container': '#B6FFC5',
          secondary: '#FFFFFF',
          'secondary-container': '#405E7E',
        },
        outline: {
          DEFAULT: '#6F7A6F',
          variant: '#BECABD',
        },
        status: {
          'grade-a': '#006130',
          'grade-b': '#436182',
          'grade-c': '#6F7A6F',
          verified: '#E5EEFF',
          'active-listing': 'rgba(0, 97, 48, 0.1)',
          'sold-out': 'rgba(63, 73, 64, 0.1)',
          pending: 'rgba(0, 75, 192, 0.1)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Hanken Grotesk', 'Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        sm: '4px',
        md: '8px',
        lg: '12px',
        xl: '16px',
        full: '9999px',
      },
      maxWidth: {
        layout: '1280px',
      },
      boxShadow: {
        'card': '0 2px 8px rgba(0,0,0,0.06)',
        'card-hover': '0 4px 12px rgba(0,0,0,0.08)',
      },
      spacing: {
        'stack-sm': '8px',
        'stack-md': '16px',
        'stack-lg': '32px',
        'gutter': '24px',
      },
      animation: {
        shimmer: 'shimmer 2s infinite linear',
        'slide-in': 'slideIn 0.3s ease-out',
        'fade-in': 'fadeIn 0.2s ease-out',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        slideIn: {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
