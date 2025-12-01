# Notes App

App de notițe pentru studenți ASE. Îți ține notițele de la cursuri organizate și le poți partaja cu colegii.

## Features

- Notițe cu markdown formatting
- Organizare pe materii și tag-uri
- Upload poze și PDF-uri
- Grupuri de studiu
- Login doar cu email de ASE (@stud.ase.ro)

## Tech stack

Node.js, Express, PostgreSQL (Supabase), Prisma, Cloudinary, JWT

## Setup local

### Install
```bash
npm install
```

### .env file

Fisierul `.env` :

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


### Run
```bash
npm start
```


## API endpoints

```
/api/auth          - login/register
/api/notes         - notițe
/api/subjects      - materii
/api/tags          - tag-uri  
/api/attachments   - fișiere
/api/groups        - grupuri
```
