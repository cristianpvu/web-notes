# Notes App - Backend

Aplicație web pentru gestionarea notițelor de la cursuri, făcută pentru studenții ASE.

## Ce face

- Creezi și organizezi notițe cu materii și tag-uri
- Poți formata textul (bold, italic, culori etc)
- Adaugi fișiere la notițe (poze, PDF-uri)
- Partajezi notițe cu alți colegi
- Creezi grupuri de studiu și adaugi notițe în ele
- Doar cu email ASE (@stud.ase.ro) poți intra

## Tehnologii

- Node.js + Express
- PostgreSQL (Supabase)
- Prisma ORM
- Cloudinary pentru fișiere
- JWT pentru autentificare

## Setup

### 1. Instalează dependencies

```bash
npm install
```

### 2. Configurează .env

Creează fișierul `.env` și adaugă:

```
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

SUPABASE_URL=https://...
SUPABASE_ANON_KEY=...

CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

JWT_SECRET=...
PORT=3000
NODE_ENV=development
```

### 3. Generează baza de date

```bash
npx prisma generate
npx prisma db push
```

### 4. Pornește serverul

```bash
npm start
```

Sau pentru development cu hot reload:

```bash
npm run dev
```

Server-ul rulează pe `http://localhost:3000`

## API Routes

- `/api/auth` - autentificare
- `/api/notes` - CRUD notițe
- `/api/subjects` - materii
- `/api/tags` - tag-uri
- `/api/attachments` - fișiere atașate
- `/api/groups` - grupuri de studiu

## Structură

```
src/
├── config/          # configurări DB, Cloudinary
├── controllers/     # logica pentru fiecare endpoint
├── middleware/      # auth, error handling
├── routes/          # definirea rutelor
├── services/        # markdown, upload
└── utils/           # validări
```

## Note

- Doar emailuri @stud.ase.ro sunt acceptate
- Fișierele se încarcă pe Cloudinary
- Database-ul e pe Supabase (PostgreSQL)
- Magic link pentru login prin email
