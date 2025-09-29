# HourHive.ai Setup Guide

This guide will help you set up HourHive.ai on your local machine.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Python 3.9+** - [Download Python](https://www.python.org/downloads/)
- **Node.js 16+** - [Download Node.js](https://nodejs.org/)
- **Git** - [Download Git](https://git-scm.com/downloads)
- **Firebase Account** - [Create Firebase Account](https://console.firebase.google.com/)

## Step 1: Clone the Repository

```bash
git clone https://github.com/yourusername/HourHive.git
cd HourHive
```

## Step 2: Firebase Setup

### 2.1 Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Enter project name: `hourhive-ai` (or your preferred name)
4. Enable Google Analytics (optional)
5. Click "Create project"

### 2.2 Enable Authentication
1. In your Firebase project, go to "Authentication"
2. Click "Get started"
3. Go to "Sign-in method" tab
4. Enable "Email/Password" provider
5. Click "Save"

### 2.3 Enable Realtime Database
1. Go to "Realtime Database"
2. Click "Create Database"
3. Choose "Start in test mode" (for development)
4. Select a location for your database
5. Click "Done"

### 2.4 Get Firebase Configuration
1. Go to Project Settings (gear icon)
2. Scroll down to "Your apps"
3. Click "Add app" and select Web (</>) icon
4. Register your app with a nickname
5. Copy the Firebase configuration object

## Step 3: Configure Firebase

### 3.1 Update Authentication File
Edit `Main/src/auth.js` and replace the placeholder values:

```javascript
const firebaseConfig = {
    apiKey: "your-actual-api-key",
    authDomain: "your-project.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project.firebasestorage.app",
    messagingSenderId: "your-messaging-sender-id",
    appId: "your-app-id",
    databaseURL: "https://your-project-default-rtdb.firebaseio.com"
};
```

### 3.2 Update Database File
Edit `Main/src/firebase/database.js` with the same configuration.

## Step 4: Backend Setup

### 4.1 Navigate to Server Directory
```bash
cd Server
```

### 4.2 Create Virtual Environment
```bash
# Windows
python -m venv .venv
.\.venv\Scripts\Activate.ps1

# macOS/Linux
python3 -m venv .venv
source .venv/bin/activate
```

### 4.3 Install Dependencies
```bash
pip install -r requirements.txt
```

### 4.4 Start the Backend Server
```bash
python app.py
```

The API will be available at `http://localhost:5001`

## Step 5: Frontend Setup

### 5.1 Navigate to Main Directory
```bash
cd ../Main
```

### 5.2 Install Dependencies
```bash
npm install
```

### 5.3 Start the Frontend Server
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Step 6: Verify Installation

### 6.1 Test Backend
Open a new terminal and run:
```bash
curl http://localhost:5001/api/health
```

Expected response:
```json
{"status":"ok"}
```

### 6.2 Test Frontend
1. Open your browser
2. Navigate to `http://localhost:3000/pages/department-timetable.html`
3. Try creating an account
4. Test the login functionality

## Troubleshooting

### Common Issues

**1. Firebase Authentication Not Working**
- Verify your Firebase configuration is correct
- Check that Email/Password authentication is enabled
- Ensure your domain is added to authorized domains

**2. Backend Server Won't Start**
- Check if port 5001 is available
- Verify Python virtual environment is activated
- Check if all dependencies are installed

**3. Frontend Build Errors**
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Check Node.js version: `node --version`
- Verify npm version: `npm --version`

**4. CORS Issues**
- Ensure backend is running on the correct port
- Check that CORS is properly configured in the Flask app

### Getting Help

If you encounter issues:

1. Check the [Issues](https://github.com/yourusername/HourHive/issues) page
2. Create a new issue with:
   - Your operating system
   - Python and Node.js versions
   - Error messages
   - Steps to reproduce the issue

## Next Steps

Once everything is set up:

1. **Create Your First Timetable**
   - Fill in department, program, semester details
   - Add courses and teachers
   - Generate your timetable

2. **Explore Features**
   - Try different export formats
   - Use the template system
   - Check the history feature

3. **Customize for Your Institution**
   - Update branding and colors
   - Modify the course structure
   - Add your institution's specific requirements

## Production Deployment

For production deployment:

1. **Update Firebase Security Rules**
2. **Configure Environment Variables**
3. **Set up HTTPS**
4. **Configure Domain Settings**
5. **Set up Monitoring and Logging**

See the [DEPLOYMENT.md](DEPLOYMENT.md) guide for detailed production setup instructions.

---

**Need Help?** Contact us at support@hourhive.ai or create an issue in the repository.
