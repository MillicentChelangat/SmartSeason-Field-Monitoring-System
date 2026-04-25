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
Rather than storing status in the database, I compute it on the frontend based on the field's current stage and when it was last updated:
\- A field is **Completed** if it has been harvested
\- A field is **At Risk** if it hasn't been updated in over 7 days
\- Everything else is considered Active

This keeps the backend simple and means status is always fresh without needing extra database fields.

A few decisions I made along the way

I used Django's built-in User model and extended it with a Profile model to store the role, full name, phone, and residence. This felt cleaner than modifying the User model directly.

For authentication I went with JWT tokens via SimpleJWT. The token is stored in localStorage on the frontend and sent as a Bearer token with each request.

I decided that only agents should update field stages — admins just create the field and assign it. This separation made sense to me because the agent is the one actually on the ground monitoring the field.

SQLite is used for the database since this is a development build. Switching to PostgreSQL for production would just be a settings change.

&#x20;**Stack**
Backend: Django, Django REST Framework, SimpleJWT
Frontend: React, TypeScript, Tailwind CSS, Axios
Database: SQLite

