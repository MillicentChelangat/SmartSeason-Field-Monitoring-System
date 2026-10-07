##### &#x20;                    **SmartSeason Field Monitoring System**

SmartSeason is a simple web app I built to help track crop fields during a growing season. It supports two types of users — an admin who manages fields and agents, and field agents who monitor and update their assigned fields.

1. &#x20;**Getting Started**
You'll need Python 3.12 and Node.js installed before running this locally.

&#x20;Clone the repo

**git clone https://github.com/MillicentChelangat/SmartSeason-Field-Monitoring-System.git**

**cd SmartSeason-Field-Monitoring-System**

Running the backend
cd backend

pip install django djangorestframework djangorestframework-simplejwt django-cors-headers
py -3.12 manage.py migrate
py -3.12 manage.py runserver

The backend runs on http://127.0.0.1:8000.

To set up demo users, open the Django shell:
py -3.12 manage.py shell

Then run:
from django.contrib.auth.models import User
from fields.models import Profile
u1 = User.objects.create\_user(username='admin@test.com', password='admin123')
Profile.objects.create(user=u1, full\_name='Admin User', role='admin')
u2 = User.objects.create\_user(username='agent@test.com', password='agent123')
Profile.objects.create(user=u2, full\_name='Agent User', role='field\_agent')
exit()

**Running the frontend**
Open a second terminal:
cd frontend
npm install
npm run dev
Frontend runs on http://localhost:5173.

&#x20;**Demo Credentials**

Role: Admin
Email:admin@test.com
Password: admin123

Role: Agent
Email:agent@test.com
Password: agent123

**How it works**
When you log in, the app checks your role and takes you to the right dashboard. Admins see an overview of all fields, agents, and recent activity. Agents only see the fields assigned to them.

**Admin can:**
* Create and delete fields
* Assign fields to specific agents
* See all field updates across agents
* View registered agents and their details

**Field agents can:**
* See their assigned fields
* Update the stage of a field as it progresses
* Add notes or observations when submitting an update

**Field stages**
Fields move through four stages, updated by the agent managing that field:
1. Planted
2. Growing
3. Ready
4. Harvested

**Field status logic**
Status is not stored in the database. The backend computes it from the field's latest update (`compute_field_status`):
\- **Critical** if the latest note mentions "disease"
\- **At Risk** if the latest note mentions "pest"
\- **Monitor** if there are no updates yet, or none in over 14 days
\- **Healthy** otherwise

This keeps the data model simple and means status is always fresh without extra database fields.

A few decisions I made along the way

I used Django's built-in User model and extended it with a Profile model to store the role, full name, phone, and residence. This felt cleaner than modifying the User model directly.

For authentication I went with JWT tokens via SimpleJWT. The token is stored in localStorage on the frontend and sent as a Bearer token with each request.

I decided that only agents should update field stages — admins just create the field and assign it. This separation made sense to me because the agent is the one actually on the ground monitoring the field.

SQLite is used for the database since this is a development build. Switching to PostgreSQL for production would just be a settings change.

&#x20;**Stack**
Backend: Django, Django REST Framework, SimpleJWT
Frontend: React, TypeScript, Tailwind CSS, Axios
Database: SQLite



## AI Assistant

SmartSeason includes a chat assistant (the **Ask AI** button, bottom-right) that answers questions about your fields in plain English, for example:

- "Which fields haven't been updated in two weeks?"
- "Any pest problems on my maize fields this month?"
- "Mark Plot 7 as ready to harvest, the maize looks dry" (asks you to confirm first)

### How it works

The language model never touches the database. It is given a short menu of **tools** (list fields, find stale fields, search update notes, list issues, season summary, add an update, report an issue, assign a field). When you ask a question it requests a tool, the Django backend runs it **as the logged-in user**, and the result goes back to the model, which writes the answer. This is called tool calling.

- `backend/apps/assistant/tools.py` – the tools. Each one only returns data the user is allowed to see.
- `backend/apps/assistant/agent.py` – the tool-calling loop and the confirmation step.
- `backend/apps/assistant/llm.py` – a thin wrapper around the model provider (Google Gemini), easy to swap.
- `frontend/src/components/AssistantChat.tsx` – the chat panel.

### Safety design

- **Role scoping:** agents only see their own fields; admin-only tools are not even offered to agents. Tool arguments are validated and the model cannot pass extra ones.
- **Writes need a human yes:** any action that changes data is shown as a confirmation card first. Confirmation tokens are signed, expire after 10 minutes, belong to one user, and work once.
- **Prompt-injection aware:** field notes are treated as data, never as instructions, and the client can't inject tool results into the conversation.
- The API itself enforces roles too (admin-only endpoints return 403 to agents).

### Setup

1. Get a free API key at https://aistudio.google.com/apikey
2. Set these environment variables on the backend (see `backend/.env.example`):
   - `GEMINI_API_KEY` – your key (without it the assistant returns "not set up yet")
   - `GEMINI_MODEL` – optional, defaults to `gemini-flash-latest`; check AI Studio for the models and limits on your free plan
3. Endpoints: `POST /api/assistant/chat/` and `POST /api/assistant/confirm/` (both need the usual `Authorization: Bearer <token>`).

### Tests

```
cd backend
SECRET_KEY=any-long-test-secret DJANGO_SETTINGS_MODULE=smartseason.settings.test python manage.py test
```

The assistant tests use a scripted fake model, so they need no API key and no network.

### Docker (backend)

```
cd backend
docker build -t smartseason-backend .
docker run -p 8000:8000 -e SECRET_KEY=... -e DATABASE_URL=... -e GEMINI_API_KEY=... smartseason-backend
```
