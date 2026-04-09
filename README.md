# CourseWeaver - Adaptive Learning Management System

An intelligent, adaptive learning platform that personalizes the educational experience based on student performance and competency mastery.

## 🚀 Features

### For Students
- **Adaptive Learning Paths**: Personalized course recommendations based on competency mastery
- **Interactive Quizzes**: Real-time feedback with competency tracking
- **Progress Dashboard**: Visual representation of learning progress with enrollment management
- **Competency Map**: 3D visualization of skill mastery across different categories
- **Smart Recommendations**: AI-powered suggestions for next learning steps
- **Course Enrollment**: Browse, enroll, and access course content seamlessly
- **Course Ratings**: Rate and review enrolled courses
- **AI Assistant**: Gemini-powered chatbot for learning assistance

### For Instructors
- **Course Builder**: Drag-and-drop interface for creating adaptive courses with chapters, units, and video content
- **Course Publishing**: Publish and manage course availability
- **Student Analytics**: Comprehensive dashboard with performance metrics
- **At-Risk Detection**: Automatic identification of struggling students
- **Messaging System**: Direct communication with students via in-app chat
- **Real-time Insights**: Track engagement, enrollments, and progress across all courses
- **AI-Powered Quiz Generator**: Auto-generate practice quizzes using Gemini AI
- **AI Instructor Assistant**: Gemini-powered chatbot for course management help

### Technical Features
- **JWT Authentication**: Secure token-based authentication with refresh tokens
- **Real-time Updates**: Instant competency updates after quiz completion
- **Responsive Design**: Beautiful UI that works on all devices
- **Theme System**: Multiple theme options with persistent preferences
- **Notification System**: In-app notifications for achievements and updates
- **Global Search**: Search across all courses on the platform
- **Avatar Upload**: Profile picture upload and management
- **Google API Integration**: Google Drive and YouTube link support for course content

## 🛠️ Tech Stack

### Backend
- **FastAPI**: Modern, fast Python web framework
- **SQLAlchemy + SQLite**: Relational database with ORM
- **Alembic**: Database migrations
- **JWT**: JSON Web Tokens for authentication
- **Bcrypt**: Password hashing
- **Google Generative AI (Gemini)**: AI-powered features

### Frontend
- **React 19**: Latest React with modern features
- **Vite**: Lightning-fast build tool
- **Zustand**: Lightweight state management
- **Framer Motion**: Smooth animations
- **React Three Fiber**: 3D competency map visualization
- **Axios**: HTTP client with interceptors
- **DnD Kit**: Drag-and-drop for course builder

## 📁 Project Structure

```
CourseWeaver/
├── backend/
│   ├── routes/          # API endpoints
│   │   ├── auth.py      # Authentication & registration
│   │   ├── courses.py   # Course CRUD & enrollment
│   │   ├── quizzes.py   # Quiz management & AI generation
│   │   ├── students.py  # Student management
│   │   ├── chat.py      # AI chatbot (Gemini)
│   │   ├── messages.py  # In-app messaging
│   │   ├── chapters.py  # Chapter management
│   │   ├── units.py     # Unit management
│   │   ├── competencies.py
│   │   ├── recommendations.py
│   │   ├── notifications.py
│   │   ├── analytics.py
│   │   ├── search.py
│   │   └── users.py
│   ├── db/models.py     # Database models
│   ├── schemas.py       # Pydantic schemas
│   ├── database.py      # Database configuration
│   ├── server.py        # FastAPI app entry point
│   └── alembic/         # Database migrations
├── frontend/
│   ├── src/
│   │   ├── pages/       # Page components
│   │   │   ├── Login.jsx
│   │   │   ├── StudentDashboard.jsx
│   │   │   ├── InstructorDashboard.jsx
│   │   │   ├── CourseBuilder.jsx
│   │   │   ├── CourseDetail.jsx
│   │   │   ├── Courses.jsx
│   │   │   ├── Quiz.jsx
│   │   │   ├── CompetencyMap.jsx
│   │   │   ├── Students.jsx
│   │   │   ├── AtRisk.jsx
│   │   │   ├── Analytics.jsx
│   │   │   ├── Recommendations.jsx
│   │   │   ├── Settings.jsx
│   │   │   └── AdminPanel.jsx
│   │   ├── components/  # Reusable components
│   │   │   ├── AIAssistant.jsx
│   │   │   ├── ChatDrawer.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   ├── TopNav.jsx
│   │   │   ├── ThreeCanvas.jsx
│   │   │   ├── QuizBuilder.jsx
│   │   │   ├── Confetti.jsx
│   │   │   └── AnimatedPage.jsx
│   │   ├── services/api.js  # API service layer
│   │   ├── store/useStore.js # Zustand state management
│   │   └── App.jsx
│   └── vite.config.js
├── start_app.sh         # One-click startup script
├── docker-compose.yml   # Docker configuration
└── README.md
```

## 🔧 Setup & Installation

### Prerequisites
- Python 3.9+
- Node.js 18+
- npm

### Quick Start
```bash
# Clone the repository
git clone https://github.com/Ahanaf-Aziz/Final-Project-demo-.git
cd Final-Project-demo-

# Option 1: Use the startup script
chmod +x start_app.sh
./start_app.sh

# Option 2: Manual setup
# Backend
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn server:app --reload --port 8000

# Frontend (in a new terminal)
cd frontend
npm install
npm run dev
```

### Environment Variables
Create a `.env` file in the `backend/` directory:
```env
GEMINI_API_KEY=your_gemini_api_key
SECRET_KEY=your_jwt_secret_key
```

## 🎨 Current Status — Fully Functional ✅

### ✅ Backend (Complete)
- [x] FastAPI REST API with all endpoints
- [x] SQLAlchemy + SQLite database with migrations
- [x] JWT authentication with refresh tokens
- [x] Course CRUD, enrollment, and publishing
- [x] Quiz management with AI-powered generation
- [x] Student analytics and at-risk detection
- [x] In-app messaging and notifications
- [x] AI chatbot integration (Gemini)
- [x] Course ratings and reviews
- [x] Global search
- [x] Avatar upload
- [x] Google Drive/YouTube integration support

### ✅ Frontend (Complete)
- [x] Full React 19 SPA with Vite
- [x] Student & Instructor dashboards
- [x] Course Builder with drag-and-drop
- [x] Course enrollment and detail views
- [x] Interactive quizzes with real-time feedback
- [x] 3D Competency Map visualization
- [x] AI Assistant (Gemini chatbot)
- [x] In-app chat/messaging
- [x] Settings with theme and avatar management
- [x] Notifications system
- [x] Responsive design with animations
- [x] Global course search
- [x] Course ratings UI

## 🔑 Demo Credentials

### Student Account
- **Email**: student@demo.com
- **Password**: demo

### Instructor Account
- **Email**: instructor@demo.com
- **Password**: demo

## 📄 License

MIT License

---

**CourseWeaver** — Built with ❤️ for adaptive learning.

**Edited By Computer Student**

