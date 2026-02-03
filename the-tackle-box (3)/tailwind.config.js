/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                serif: ['Merriweather', 'serif'],
                mono: ['JetBrains Mono', 'monospace'],
            },
            colors: {
                'navigator-glass': 'rgba(255, 255, 255, 0.7)',
            },
            animation: {
                'fade-in': 'fadeIn 0.5s ease-in-out',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
            },
        },
    },
    plugins: [],
}
