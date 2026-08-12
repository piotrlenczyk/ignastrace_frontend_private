/* eslint-disable style/quote-props */
import type { Config } from 'tailwindcss';
import defaultTheme from 'tailwindcss/defaultTheme';
import tailwindAnimate from 'tailwindcss-animate';

export default {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  ignore: [],
  theme: {
    container: {
      center: true,
    },
    screens: {
      'xs': '360px',
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      'md-max': { raw: `(max-width: 1023px )` },
    },
    colors: {
      white: {
        DEFAULT: '#FFFFFF',
      },
      transparent: 'transparent',
      black: {
        DEFAULT: '#000000',
      },
      yellow: {
        DEFAULT: 'hsl(var(--yellow))',
        1000: 'hsl(var(--yellow-transparent-1000))',
        800: 'hsl(var(--yellow-transparent-800))',
        500: 'hsl(var(--yellow-transparent-500))',
        200: 'hsl(var(--yellow-transparent-200))',
        50: 'hsl(var(--yellow-transparent-50))',
      },
      red: {
        DEFAULT: 'hsl(var(--red))',
        1000: 'hsl(var(--red-transparent-1000))',
        800: 'hsl(var(--red-transparent-800))',
        200: 'hsl(var(--red-transparent-200))',
        50: 'hsl(var(--red-transparent-50))',
      },
      amber: {
        DEFAULT: 'hsl(var(--amber))',
        1000: 'hsl(var(--amber-transparent-1000))',
        800: 'hsl(var(--amber-transparent-800))',
        200: 'hsl(var(--amber-transparent-200))',
        50: 'hsl(var(--amber-transparent-50))',
      },
      green: {
        DEFAULT: 'hsl(var(--green))',
        1000: 'hsl(var(--green-transparent-1000))',
        800: 'hsl(var(--green-transparent-800))',
        200: 'hsl(var(--green-transparent-200))',
        100: 'hsl(var(--green-transparent-100))',
        50: 'hsl(var(--green-transparent-50))',
        25: 'hsl(var(--green-transparent-25))',
      },
      teal: {
        DEFAULT: 'hsl(var(--teal))',
        1000: 'hsl(var(--teal-transparent-1000))',
        800: 'hsl(var(--teal-transparent-800))',
        200: 'hsl(var(--teal-transparent-200))',
        50: 'hsl(var(--teal-transparent-50))',
      },
      gray: {
        DEFAULT: 'hsl(var(--gray))',
        1000: 'hsl(var(--gray-transparent-1000))',
        800: 'hsl(var(--gray-transparent-800))',
        700: 'hsl(var(--gray-transparent-700))',
        500: 'hsl(var(--gray-transparent-500))',
        200: 'hsl(var(--gray-transparent-200))',
        100: 'hsl(var(--gray-transparent-100))',
        50: 'hsl(var(--gray-transparent-50))',
        25: 'hsl(var(--gray-transparent-25))',
      },
      neutral: {
        DEFAULT: 'hsl(var(--neutral))',
        10: 'hsl(var(--neutral-10))',
      },
      overlay: {
        light: 'hsl(var(--overlay-light))',
      },
    },
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', ...defaultTheme.fontFamily.sans],
        bebas: ['var(--font-bebas)', ...defaultTheme.fontFamily.sans],
      },
      fontSize: {
        base: ['1rem', { lineHeight: '1.5' }],
        lg: ['1.125rem', { lineHeight: '1.5' }],
        sm: ['0.875rem', { lineHeight: '1.25rem' }],
        xs: ['0.75rem', { lineHeight: '1.5' }],
        caption: ['var(--font-size-caption)', { lineHeight: '1.5' }],
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      colors: {
        background: {
          DEFAULT: 'hsl(var(--background))',
          alternate: '#F5F6FA',
        },
        foreground: 'hsl(var(--foreground))',
        pomegranate: {
          50: 'hsl(var(--pomegranate-50))',
          100: 'hsl(var(--pomegranate-100))',
          200: 'hsl(var(--pomegranate-200))',
          300: 'hsl(var(--pomegranate-300))',
          400: 'hsl(var(--pomegranate-400))',
          500: 'hsl(var(--pomegranate-500))',
          600: 'hsl(var(--pomegranate-600))',
          700: 'hsl(var(--pomegranate-700))',
          800: 'hsl(var(--pomegranate-800))',
          900: 'hsl(var(--pomegranate-900))',
          950: 'hsl(var(--pomegranate-950))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        brand: {
          DEFAULT: 'hsl(var(--brand))',
          foreground: 'hsl(var(--brand-foreground))',
          strong: 'hsl(var(--brand-transparent-1000))',
          1000: 'hsl(var(--brand-transparent-1000))',
          800: 'hsl(var(--brand-transparent-800))',
          200: 'hsl(var(--brand-transparent-200))',
          50: 'hsl(var(--brand-transparent-50))',
          weak: 'hsl(var(--brand-transparent-50))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
          strong: 'hsl(var(--primary-transparent-1000))',
          1000: 'hsl(var(--primary-transparent-1000))',
          800: 'hsl(var(--primary-transparent-800))',
          200: 'hsl(var(--primary-transparent-200))',
          50: 'hsl(var(--primary-transparent-50))',
          weak: 'hsl(var(--primary-transparent-50))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
          strong: 'hsl(var(--secondary-transparent-1000))',
          1000: 'hsl(var(--secondary-transparent-1000))',
          800: 'hsl(var(--secondary-transparent-800))',
          200: 'hsl(var(--secondary-transparent-200))',
          50: 'hsl(var(--secondary-transparent-50))',
          weak: 'hsl(var(--secondary-transparent-50))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        success: {
          DEFAULT: 'hsl(var(--success))',
          foreground: 'hsl(var(--success-foreground))',
        },
        warning: {
          stroke: 'hsl(var(--warning-stroke))',
          'stroke-strong': 'hsl(var(--warning-stroke-strong))',
          fill: 'hsl(var(--warning-fill))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          1: 'hsl(var(--chart-1))',
          2: 'hsl(var(--chart-2))',
          3: 'hsl(var(--chart-3))',
          4: 'hsl(var(--chart-4))',
          5: 'hsl(var(--chart-5))',
        },
        weak: {
          DEFAULT: 'hsl(var(--text-weak))',
        },
        stroke: {
          'primary-weak': 'hsl(var(--primary-transparent-200))',
          'secondary-weak': 'hsl(var(--secondary-transparent-200))',
          weak: 'hsl(var(--gray-transparent-100))',
        },
      },
      backgroundColor: {
        base: 'hsl(var(--background))',
        'base-blur': 'hsl(var(--background-base-blur))',
        alternate: 'hsl(var(--gray-solid-50))',
        weak: 'hsl(var(--fill-weak))',
        strong: 'hsl(var(--gray-transparent-1000))',
      },
      borderColor: {},
      textColor: {
        success: 'hsl(var(--green-transparent-800))',
        'success-foreground': 'hsl(var(--success-foreground))',
        error: 'hsl(var(--red-transparent-800))',
        body: 'hsl(var(--gray-transparent-700))',
        disabled: 'hsl(var(--text-disabled))',
        strong: 'hsl(var(--gray-transparent-1000))',
        'inverse-strong': 'var(--gray-solid-0)',
        information: 'hsl(var(--text-information))',
      },
      keyframes: {
        'accordion-down': {
          from: {
            height: '0',
          },
          to: {
            height: 'var(--radix-accordion-content-height)',
          },
        },
        'accordion-up': {
          from: {
            height: 'var(--radix-accordion-content-height)',
          },
          to: {
            height: '0',
          },
        },
        'loading-bar': {
          '0%': {
            transform: 'translateX(-50px)',
          },
          '100%': {
            transform: 'translateX(calc(100% + 50px))',
          },
        },
        'map-pane': {
          '0%': {
            backgroundPosition: '-99% center',
          },
          '100%': {
            backgroundPosition: '99% center',
          },
        },
        'fade-out': { from: { opacity: '100%' }, to: { opacity: '0' } },
        'fade-in': { from: { opacity: '0' }, to: { opacity: '100%' } },
        'onboarding-step-1': {
          from: { maxHeight: '0', opacity: '0' },
          '40%': { maxHeight: '260px', opacity: '0' },
          to: { maxHeight: '100%', opacity: '1' },
        },
        'pulse': {
          '50%': {
            opacity: '.5',
          },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'loading-bar': 'loading-bar 1s linear infinite',
        'fade-out': 'fade-out 0.2s',
        'fade-in': 'fade-in 0.2s',
        'onboarding-step-1': 'onboarding-step-1 .8s linear',
        'map-pane': 'map-pane 30s linear infinite',
        'pulse': 'pulse 2s cubic-bezier(.4,0,.6,1) infinite',
      },
    },
  },
  plugins: [tailwindAnimate],
} satisfies Config;
