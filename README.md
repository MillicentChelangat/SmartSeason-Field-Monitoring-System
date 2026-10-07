# SmartSeason Field Monitoring System

A web app I built to track crop fields during a growing season. Admins manage fields and agents. Field agents monitor and update the fields assigned to them. There is also an AI assistant you can ask about your fields.

**Live:** https://smart-season-field-monitoring-syste-liard.vercel.app
(The backend is on a free Render plan, so the first load can take a minute.)

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@test.com | admin123 |
| Agent | agent@test.com | agent123 |

## Stack

Django, Django REST Framework, SimpleJWT, PostgreSQL (Render) · React, TypeScript, Tailwind CSS, Axios (Vercel) · Groq for the AI assistant

## How it works

On login the app checks your role and opens the right dashboard.

- **Admin:** creates and deletes fields, assigns them to agents, sees all updates, and reviews issues (in progress or resolved).
- **Agent:** sees only their own fields, updates the stage (Planted, Growing, Ready, Harvested), adds notes, and reports issues.

Field status is not stored. The backend works it out from the latest update:
Critical if the note mentions "disease", At Risk for "pest", Monitor if there are no updates or none in 14 days, Healthy otherwise.

## AI assistant

The **Ask AI** button opens a chat where you can ask things like "Which fields haven't been updated in two weeks?" or "Mark Plot 7 as ready to harvest".

The model never touches the database. It can only call a small set of tools I wrote in `backend/apps/assistant/tools.py`. Django runs each tool as the logged-in user, so an agent only ever gets their own fields. Anything that changes data shows a confirm card first, and the confirmation is signed, single-use and expires after 10 minutes.

## Run locally

```bash
git clone https://github.com/MillicentChelangat/SmartSeason-Field-Monitoring-System.git

cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements/base.txt
python manage.py migrate
python manage.py runserver
```

Set `SECRET_KEY` and `DATABASE_URL` first, plus `GROQ_API_KEY` if you want the assistant (free key at console.groq.com). See `backend/.env.example`.

```bash
cd frontend
npm install
npm run dev
```

Backend runs on http://127.0.0.1:8000 and the frontend on http://localhost:5173.

## Tests

```bash
cd backend
SECRET_KEY=test DJANGO_SETTINGS_MODULE=smartseason.settings.test python manage.py test
```

The assistant tests use a fake model, so they need no API key.