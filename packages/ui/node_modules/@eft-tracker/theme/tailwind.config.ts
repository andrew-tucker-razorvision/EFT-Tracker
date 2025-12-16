import type { Config } from 'tailwindcss';
import { colors, spacing, typography, borderRadius, shadows, animation } from './src/index';

export default {
  theme: {
    colors,
    spacing,
    fontFamily: typography.fontFamily,
    fontSize: typography.fontSize,
    fontWeight: typography.fontWeight,
    borderRadius,
    boxShadow: shadows,
    transitionDuration: animation.duration,
    transitionTimingFunction: animation.easing,
    extend: {
      animation: {
        fade: 'fadeInOut 0.3s ease-in-out',
        slideIn: 'slideIn 0.2s ease-out',
        slideOut: 'slideOut 0.2s ease-in',
      },
      keyframes: {
        fadeInOut: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        slideOut: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(100%)' },
        },
      },
    },
  },
} satisfies Config;
