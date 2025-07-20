# YouTube Companion Dashboard

## Features
- View YouTube video details
- Add/Edit/Delete comments
- Edit title/description
- Notes section
- Event logging

## API Endpoints

| Method | Endpoint    | Description       |
|--------|-------------|-------------------|
| GET    | /api/ping   | Test API          |
| GET    | /api/notes  | Fetch notes       |
| POST   | /api/notes  | Add a note        |
| POST   | /api/logs   | Add a log         |

## Database Schema

### notes
- `id`: INTEGER
- `content`: TEXT

### logs
- `id`: INTEGER
- `event`: TEXT
- `timestamp`: DATETIME
