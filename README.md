# Microdata Store

E-commerce platform untuk penjualan produk IT. Dibangun dengan Next.js 16, Prisma, PostgreSQL, dan Tailwind CSS 4.

## Prasyarat

- **Node.js** ≥ 20
- **PostgreSQL** ≥ 14 (running & bisa diakses)
- **Git**

## Cara Setup

### 1. Clone & Install

```bash
git clone https://github.com/apridiansaputra/microdata-store.git
cd microdata-store
npm install
```

### 2. Konfigurasi Environment

Taruh file `.env` (dikirim terpisah via WA) ke root folder project.

Setelah itu, sesuaikan variabel berikut di `.env` sesuai environment lokal:

| Variabel | Yang perlu disesuaikan |
|----------|----------------------|
| `DATABASE_URL` | Ganti user, password, host, dan nama database sesuai PostgreSQL lokal |
| `AUTH_URL` | Ganti ke alamat server jika bukan `http://localhost:3000` |
| `GOOGLE_REDIRECT_URI` | Samakan domain-nya dengan `AUTH_URL` (contoh: `http://localhost:3000/api/auth/google/callback`) |
| `XENDIT_SUCCESS_REDIRECT_URL` | Samakan domain-nya dengan `AUTH_URL` |
| `XENDIT_FAILURE_REDIRECT_URL` | Samakan domain-nya dengan `AUTH_URL` |

> Variabel lain (API key, secret, SMTP) tidak perlu diubah — sudah terisi di file `.env` yang dikirim.

### 3. Setup Database

Pastikan PostgreSQL sudah running, lalu jalankan:

```bash
npx prisma generate
npx prisma migrate dev
npm run prisma:seed
```

> Setelah seed, catat email dan password super admin yang muncul di terminal.

### 4. Jalankan

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser.

Login admin di [http://localhost:3000/admin](http://localhost:3000/admin) menggunakan akun super admin dari hasil seed.
