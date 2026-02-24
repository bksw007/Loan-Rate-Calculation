# Flat Rate Calculation (Next.js + TypeScript)

เว็บแอพคำนวณค่างวดรถยนต์แบบ Flat Rate (responsive, dark/light toggle, export infographic PNG) พัฒนาเป็น Next.js App Router ด้วย React + TypeScript เต็มรูปแบบ

## Run local

```bash
npm install
npm run dev
```

เปิด [http://localhost:3000](http://localhost:3000)

## Lint + Build

```bash
npm run lint
npm run build
npm run start
```

## Deploy with GitHub + Vercel

1. Push โค้ดขึ้น GitHub
2. เข้า Vercel แล้วเลือก **Add New Project**
3. เลือก repository นี้
4. Vercel จะตรวจจับเป็น **Next.js** อัตโนมัติ
5. กด Deploy

## Project structure

- `app/layout.tsx` - root layout + font + global css
- `app/globals.css` - global styles + dark mode tokens
- `app/page.tsx` - loan calculator React component (client)
- `tsconfig.json` - TypeScript config
- `.eslintrc.json` - ESLint config มาตรฐาน Next.js
