/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: 'hsl(var(--primary))',
        'primary-foreground': 'hsl(var(--primary-foreground))',
        secondary: 'hsl(var(--secondary))',
        'secondary-foreground': 'hsl(var(--secondary-foreground))',
        destructive: 'hsl(var(--destructive))',
        'destructive-foreground': 'hsl(var(--destructive-foreground))',
        muted: 'hsl(var(--muted))',
        'muted-foreground': 'hsl(var(--muted-foreground))',
        accent: 'hsl(var(--accent))',
        'accent-foreground': 'hsl(var(--accent-foreground))',
        abyss: {
          950: '#020610',
          900: '#050d1f',
          800: '#0a1a38',
        },
        cian: {
          DEFAULT: '#33d6ff',
          hi: '#e0faff',
        },
        oro: {
          DEFAULT: '#e8b64c',
          hi: '#ffedbb',
          med: '#c9962e',
        },
      },
      borderRadius: {
        lg: 'var(--radius-lg)',
        md: 'var(--radius-md)',
        sm: 'var(--radius-sm)',
      },
      keyframes: {
        accorddown: {
          from: { height: '0px' },
          to: { height: 'var(--accordion-height)' },
        },
        accordup: {
          from: { height: 'var(--accordion-height)' },
          to: { height: '0px' },
        },
      },
      animation: {
        accorddown: 'accordion-down 0.2s ease-out',
        accordup: 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [],
}