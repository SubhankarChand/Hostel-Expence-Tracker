# 🏠 HostelSplit - Smart Roommate Expense Tracker

<div align="center">

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![React](https://img.shields.io/badge/React-19-61dafb)
![Node](https://img.shields.io/badge/Node.js-18+-339933)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14+-4169e1)

**Track expenses, split bills, and settle debts with your roommates effortlessly**

[Features](#features) • [Tech Stack](#tech-stack) • [Installation](#installation) • [Screenshots](#screenshots) • [API Docs](#api-endpoints) • [Contributing](#contributing)

</div>

---

## 📱 Live Demo

> **Note:** Currently in development. Contact the author for demo access.

---

## ✨ Features

### 🔐 Authentication & Profiles
- ✅ **User Registration** with auto-generated unique ID (e.g., `HS-A8F2-99`)
- ✅ **Secure Login** with JWT authentication
- ✅ **Password visibility toggle** (show/hide)
- ✅ **Profile Page** displaying your unique token ID
- ✅ **Copy to Clipboard** functionality for IDs

### 🏠 Room Management
- ✅ **Create Rooms** (Hostel, Trip, Mess, Custom)
- ✅ **Auto-generated Room Codes** for easy sharing
- ✅ **Delete Rooms** (Admin only - with confirmation)
- ✅ **Join Rooms** via room code with admin approval
- ✅ **Admin Approval System** for join requests

### 👥 Member Management
- ✅ **Add Members** using Email + Unique ID
- ✅ **Admin-only** member addition
- ✅ **Real-time member list** with role badges
- ✅ **Copy member unique IDs** for easy sharing

### 💰 Expense Tracking
- ✅ **Add Expenses** with description, amount, and category
- ✅ **Split Equally** among all members
- ✅ **Split by Exact Amounts** (e.g., User A: ₹50, User B: ₹30, User C: ₹20)
- ✅ **Expense Categories**: Food, Rent, Utilities, Other
- ✅ **Date-grouped timeline** (e.g., "Jun 4 Thursday - Total: ₹275")
- ✅ **Category icons** for visual identification

### 📊 Analytics & Reports
- ✅ **Pie Chart Visualization** showing spending distribution
- ✅ **Identify highest contributor** ("👑 UserName paid the most")
- ✅ **Export to CSV** - Download all expenses as spreadsheet
- ✅ **Settlement Suggestions** - Shows exactly who pays whom

### 💵 Settlement System
- ✅ **Smart algorithm** minimizes number of transactions
- ✅ **Visual settlement plan** (e.g., "Rahul → Priya: ₹450")
- ✅ **Real-time balance updates** after each expense

### 🛠️ Admin Controls
- ✅ **Delete expenses** by week or month
- ✅ **Approve/Reject join requests** with user details
- ✅ **Delete entire room** with cascade deletion
- ✅ **Add/Remove members**

---

## 🛠️ Tech Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19.0 | UI Framework |
| Vite | 6.0 | Build Tool |
| Tailwind CSS | 4.0 | Styling |
| Recharts | 2.12 | Charts & Analytics |
| Lucide React | 0.468 | Icons |

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | 18+ | Runtime |
| Express | 4.18 | Web Framework |
| PostgreSQL | 14+ | Database |
| JWT | 9.0 | Authentication |
| bcryptjs | 2.4 | Password Hashing |

---

## 📋 Prerequisites

Before you begin, ensure you have installed:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **PostgreSQL** (v14 or higher) - [Download](https://www.postgresql.org/download/)
- **pgAdmin** (optional, for database management)
- **npm** or **yarn** (comes with Node.js)

---

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/hostel-split.git
cd hostel-split
```
### 2. Setup Database
Open pgAdmin or psql and run:

```sql
-- Create database
CREATE DATABASE hostel_split;

-- Copy the entire contents of database.sql file and run it
-- (database.sql is included in the root folder)
```
### 3. Backend Setup
```bash
# Navigate to backend folder
cd hostel-split-api
```

# Install dependencies
```bash
npm install
```

# Create environment file
```bash
cp .env.example .env
```

# Edit .env with your database credentials
# Open .env and update:
#   DB_PASSWORD=your_postgres_password
#   JWT_SECRET=your_secret_key
Example .env file:
```bash
env
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_actual_password_here
DB_NAME=hostel_split
JWT_SECRET=your_super_secret_key_change_this
4. Frontend Setup
```
```bash
# Open new terminal, navigate to frontend folder
cd hostel-split-app

# Install dependencies
npm install
``` 
5. Run the Application
Option A: One-Command Startup (Windows)

bash
# From root folder
start.bat
Option B: Manual Startup (Two Terminals)

Terminal 1 - Backend:

```bash
cd hostel-split-api
npm run dev
```
### Terminal 2 - Frontend:

```bash
cd hostel-split-app
npm run dev
```
## 6. Access the Application
Frontend: http://localhost:5173

Backend API: http://localhost:5000

📸 Screenshots
How to Add Screenshots to README
Create a screenshots folder in your project root:

text
Hostel_Expence_tracker/
├── screenshots/           ← Create this folder
│   ├── login-page.png
│   ├── dashboard.png
│   ├── room-view.png
│   ├── profile.png
│   ├── add-expense.png
│   ├── settlements.png
│   └── charts.png
├── hostel-split-api/
├── hostel-split-app/
└── README.md
Screenshots Gallery
Login Page
https://./screenshots/login-page.png

User authentication page with signup and login options

Dashboard View
https://./screenshots/dashboard.png

Main dashboard showing all rooms and create room option

Room View with Expenses
https://./screenshots/room-view.png

Room dashboard with expense timeline and balance summary

Profile with Unique ID
https://./screenshots/profile.png

User profile showing Personal System Member Token ID

Add Expense Modal
https://./screenshots/add-expense.png

Add expense with equal or exact split options

Settlement Suggestions
https://./screenshots/settlements.png

Smart settlement plan showing who pays whom

Analytics Charts
https://./screenshots/charts.png

Pie chart showing spending distribution

🎯 Usage Guide
1. Sign Up / Login
Click "Sign Up" to create a new account

Enter your full name, email, and password

Save your Unique ID (e.g., HS-A8F2-99) - you'll need this to join rooms

Login with your email and password

2. Create a Room
Click "Spawn Space" or "Create Space"

Enter room name (e.g., "Room 404", "Goa Trip")

Select room type: 🏡 Hostel | ✈️ Trip | 🍳 Mess

Share the Room Code with friends

3. Join a Room
Click "Join Room" in dashboard

Enter the room code shared by admin

Wait for admin approval

Admin will receive notification with your details

4. Add Members (Admin Only)
Go to your room

Scroll to "Add Roommate" section

Enter friend's Email + Unique ID

Click "Add Member to Room"

5. Add an Expense
In room view, fill the expense form:

Description: "Pizza night", "Electricity bill"

Amount: Total bill amount

Category: Food, Rent, Utilities, Other

Choose split method:

Split Equally: Everyone pays same amount

Exact Amounts: Enter custom amounts per person

Click "Save Expense"

6. Settle Debts
Click "Show Settlements" button

View suggested payments:

text
Rahul → Priya: ₹450
Amit → Priya: ₹120
Make payments via UPI/Cash

Balances update automatically

7. Export Data
Click "Export CSV" button

File downloads with all expenses

Open in Excel/Google Sheets

8. Delete Expenses (Admin Only)
Clear Week: Delete last 7 days of expenses

Clear Month: Delete last 30 days of expenses

📡 API Endpoints
Method	Endpoint	Description	Auth
POST	/api/auth/signup	Register new user	❌
POST	/api/auth/login	User login	❌
GET	/api/rooms	Get user's rooms	✅
POST	/api/rooms	Create new room	✅
DELETE	/api/rooms/:roomId	Delete room	✅
GET	/api/rooms/:roomId/data	Get room details	✅
POST	/api/expenses	Add expense	✅
DELETE	/api/rooms/:roomId/expenses/purge	Delete expenses	✅
POST	/api/rooms/:roomId/members	Add member	✅
POST	/api/rooms/:roomId/join-request	Request to join	✅
GET	/api/rooms/:roomId/pending-requests	Get join requests	✅
POST	/api/rooms/:roomId/approve-request	Approve/reject request	✅
GET	/api/rooms/:roomId/settlements	Get settlement plan	✅
GET	/api/rooms/:roomId/export	Export expenses CSV	✅
Authentication: Add Authorization: Bearer <token> header for protected routes

📁 Project Structure
text
Hostel_Expence_tracker/
│
├── screenshots/                    # Screenshots for README
│   ├── dashboard.png
│   ├── room-view.png
│   └── ...
│
├── hostel-split-api/               # Backend
│   ├── server.js                   # Main server file
│   ├── package.json                # Dependencies
│   ├── .env.example                # Environment template
│   └── node_modules/               # (ignored)
│
├── hostel-split-app/               # Frontend
│   ├── src/
│   │   ├── App.jsx                 # Main component
│   │   ├── main.jsx                # Entry point
│   │   ├── index.css               # Tailwind imports
│   │   └── components/
│   │       ├── Auth.jsx            # Login/Signup
│   │       ├── Dashboard.jsx       # Rooms list
│   │       └── RoomView.jsx        # Room details
│   ├── public/
│   ├── package.json
│   └── vite.config.js
│
├── database.sql                    # Database schema
├── start.bat                       # One-click startup
├── .gitignore                      # Git ignore rules
└── README.md                       # This file
🔒 Environment Variables
Backend (.env)
env
PORT=5000                    # Server port
DB_HOST=localhost           # Database host
DB_PORT=5432               # Database port
DB_USER=postgres           # Database user
DB_PASSWORD=your_password  # Database password
DB_NAME=hostel_split       # Database name
JWT_SECRET=your_secret     # JWT signing key
Frontend
No .env needed for development

🧪 Testing
Test Database Connection
bash
cd hostel-split-api
node -e "import('./server.js').then(() => console.log('✅ DB Connected'))"
Test API (using curl)
bash
# Signup
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"full_name":"Test","email":"test@test.com","password":"123456"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"123456"}'
### 🚢 Deployment
Deploy Backend (Render.com)
Push code to GitHub

Go to Render.com

Create new Web Service

Connect your repository

Set:

Build Command: npm install

Start Command: node server.js

Add environment variables

### Deploy

Deploy Frontend (Vercel)
```bash
cd hostel-split-app
npm run build
```
Then deploy the dist folder to:

Vercel: vercel --prod

Netlify: Drag dist folder to Netlify

GitHub Pages: Use gh-pages branch

Update API URLs for Production
In frontend files, replace http://localhost:5000 with your deployed backend URL.

### 🤝 Contributing
Fork the repository

Create feature branch (git checkout -b feature/AmazingFeature)

Commit changes (git commit -m 'Add AmazingFeature')

Push to branch (git push origin feature/AmazingFeature)

Open Pull Request

Development Guidelines
Follow existing code style

Add comments for complex logic

Test before submitting PR

Update documentation if needed

📝 License
This project is licensed under the MIT License - see below:

text
MIT License

Copyright (c) 2024 Subhankar Chand

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions...

Full license text: https://opensource.org/licenses/MIT
👨‍💻 Author
Subhankar Chand

GitHub: @yourusername

Email: subhankarchand66@gmail.com

🙏 Acknowledgments
Icons: Lucide React

Charts: Recharts

UI Inspiration: Modern expense tracking apps

Contributors: Thanks to all who tested and provided feedback

📞 Support
Having issues? Here's how to get help:

Check the Issues page

Create a new issue with:

Description of the problem

Steps to reproduce

Screenshots (if applicable)

Error messages

Contact author via email

🎯 Roadmap
Dark mode support

Email notifications

Recurring expenses (monthly rent)

Mobile app (React Native)

Receipt image upload

Group chat feature

Budget alerts

Multi-currency support

⭐ Show Your Support
If you found this project helpful, please give it a ⭐ on GitHub!

<div align="center">
Made with ❤️ for roommates everywhere

Report Bug • Request Feature • Star on GitHub

</div> ```

