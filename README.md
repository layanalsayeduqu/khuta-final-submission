Khuta Project Submission

Project Name:
Khuta

Project Description:
Khuta is a web-based stadium guidance and ticketing system. The system allows users to view live and upcoming matches, create an account, log in, book tickets, select seats, generate QR tickets, and use an interactive stadium map to navigate to gates, seats, facilities, restrooms, food areas, clinics, and emergency exits.

This submission includes the frontend, backend, and database files for the Khuta project.

--------------------------------------------------
Project Structure
--------------------------------------------------

Khuta_Project/
│
├── frontend/
│   Contains the React.js web interface.
│
├── backend/
│   Contains the FastAPI backend and API routes.
│
├── database/
│   Contains the exported database file.
│
└── README.txt
    Contains project description and running instructions.

--------------------------------------------------
Technologies Used
--------------------------------------------------

Frontend:
- React.js
- Vite
- JavaScript
- HTML
- CSS
- Axios
- React Router
- MapLibre GL JS
- QR Code library

Backend:
- Python
- FastAPI
- PostgreSQL connection
- JWT Authentication
- SMTP Email Verification

Database:
- PostgreSQL
- Supabase

--------------------------------------------------
Main Features
--------------------------------------------------

User Features:
- Create account
- Email verification
- Login
- View live and upcoming matches
- Book tickets
- Select seats
- Make payment
- View bookings
- Generate QR ticket
- Use interactive stadium map
- View and navigate to facilities

Organizer Features:
- Login as organizer
- View organizer dashboard
- Add, update, and cancel matches
- Add and delete stadium facilities

--------------------------------------------------
Database Files
--------------------------------------------------

The database folder includes:

khuta_database.sql

This file contains the exported database structure and data from Supabase.

Main Tables:
- users
- matches
- seats
- tickets
- payment
- stadium
- facilities

Main Relationships:
- seats.match_id references matches.id
- tickets.user_id references users.id
- tickets.match_id references matches.id
- tickets.seat_id references seats.id
- tickets.payment_id references payment.id
- facilities.stadium references stadium.id

To restore the database:
Import or run the khuta_database.sql file in PostgreSQL or Supabase SQL Editor.

--------------------------------------------------
How to Run the Project
--------------------------------------------------

Important:
Before running the project, make sure that:
- Python is installed
- Node.js is installed
- PostgreSQL / Supabase database is ready
- The backend .env file contains the correct database connection information

--------------------------------------------------
1. Run the Backend
--------------------------------------------------

Open the terminal and go to the backend folder:

cd backend

Create a virtual environment:

python -m venv venv

Activate the virtual environment:

venv\Scripts\activate

Install the required packages:

pip install -r requirements.txt

Run the backend server:

uvicorn main:app --reload

The backend will run on:

http://127.0.0.1:8000

--------------------------------------------------
2. Run the Frontend
--------------------------------------------------

Open another terminal and go to the frontend folder:

cd frontend

Install the required packages:

npm install

Run the frontend:

npm run dev

The frontend will run on a local Vite link, usually:

http://localhost:5173

--------------------------------------------------
3. Connect Frontend with Backend
--------------------------------------------------

Make sure the frontend API file or environment file uses this backend link:

http://127.0.0.1:8000

Example:

VITE_API_BASE_URL=http://127.0.0.1:8000

--------------------------------------------------
4. Database Connection
--------------------------------------------------

The backend connects to the Supabase PostgreSQL database using the database connection information stored in the .env file.

The .env file should include the required database variables, such as the database host, database name, user, password, and port.

Important:
Do not upload or share the real .env file publicly because it contains sensitive database information.

--------------------------------------------------
Notes
--------------------------------------------------

- This project is for academic and demonstration purposes.
- The included data is sample data used for testing the system.
- Sensitive information such as passwords, secret keys, and database connection strings should not be shared publicly.
- If the project is downloaded on another device, the user must install the frontend and backend dependencies before running it.

--------------------------------------------------
Prepared By
--------------------------------------------------

Layan M. Alsayed
Software Engineering Project
Khuta System
