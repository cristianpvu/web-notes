Note-taking application for students with text editing, sharing, and collaboration features.

## Features

- **Text Editor** - Format notes with bold, italic, headings, lists, code blocks, and quotes
- **Subject Organization** - Organize notes by subject/course
- **Tags & Keywords** - Add tags and keywords for easy searching
- **File Attachments** - Upload images, PDFs, and documents to your notes
- **Note Sharing** - Share notes with classmates (read-only or edit permissions)
- **Study Groups** - Create groups and share notes with all members
- **Public Notes** - Make notes public via shareable link

## How to run

1. Navigate to frontend directory
```bash
cd frontend
```

2. Install dependencies
```bash
npm install
```

3. Start the development server
```bash
npm start
```

4. Open http://localhost:3000

## API Endpoints

### Authentication
- `POST /api/auth/request-magic-link` - Request login email
- `POST /api/auth/verify-magic-link` - Verify and login

### Notes
- `GET /api/notes` - Get all user notes
- `POST /api/notes` - Create new note
- `GET /api/notes/:id` - Get specific note
- `PUT /api/notes/:id` - Update note
- `DELETE /api/notes/:id` - Delete note

### Sharing
- `POST /api/notes/:id/share` - Share note with user
- `GET /api/notes/shared` - Get notes shared with you

### Groups
- `POST /api/groups` - Create study group
- `GET /api/groups` - Get user's groups
- `POST /api/groups/join` - Join group by ID
- `POST /api/groups/:id/notes` - Add note to group