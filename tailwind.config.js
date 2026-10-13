/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/views/**/*.ejs', './public/js/**/*.js'],
  theme: {
    extend: {
      colors: {
        // สีแบรนด์ Shift-High PC (ส้ม-ดำ ตามโลโก้) - 500 คือส้มของโลโก้
        brand: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f5821f',
          600: '#e26d0c',
          700: '#bb540a',
          800: '#94420f',
          900: '#78380f',
        },
        // ดำของ header / hero / footer และพื้นหลังหน้าเว็บสีกระดาษอุ่นๆ
        carbon: '#000000',
        graphite: '#141414',
        titanium: '#8c8c88',
        bone: '#f6f5f2',
      },
      fontFamily: {
        // ตัวหนังสือเนื้อหา/ฟอร์ม อ่านง่ายทั้งไทยและอังกฤษ
        sans: ['"IBM Plex Sans Thai"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        // ตัวหัวข้อ เส้นบางเรียบ ให้ความรู้สึกเทคโนโลยีระดับพรีเมียม (ใช้น้ำหนัก 300-500 เป็นหลัก)
        display: ['"Bai Jamjuree"', '"IBM Plex Sans Thai"', 'ui-sans-serif', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 0 0 rgb(0 0 0 / 0.03)',
      },
      keyframes: {
        // หน้าแรก: เคสคอมค่อยๆ โผล่ขึ้นจากความมืด (เล่นครั้งเดียวตอนเปิดหน้า)
        reveal: {
          '0%': { opacity: '0', transform: 'translateY(28px) scale(0.97)', filter: 'blur(10px) brightness(0.4)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)', filter: 'blur(0) brightness(1)' },
        },
        // แสงส้มด้านหลังเคสค่อยๆ สว่างขึ้นตามหลังเคส
        glow: {
          '0%': { opacity: '0', transform: 'scale(0.7)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        // แสงสะท้อนกวาดผ่านเคสหนึ่งครั้ง
        sweep: {
          '0%': { transform: 'translateX(-120%) skewX(-18deg)', opacity: '0' },
          '20%': { opacity: '1' },
          '100%': { transform: 'translateX(220%) skewX(-18deg)', opacity: '0' },
        },
        fadein: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        reveal: 'reveal 1.6s cubic-bezier(0.16, 1, 0.3, 1) 0.1s both',
        glow: 'glow 2.2s cubic-bezier(0.16, 1, 0.3, 1) 0.3s both',
        sweep: 'sweep 1.4s ease-in-out 1.1s both',
        fadein: 'fadein 0.9s cubic-bezier(0.16, 1, 0.3, 1) 0.6s both',
      },
    },
  },
  plugins: [],
};
