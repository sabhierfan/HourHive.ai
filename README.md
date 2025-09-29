# HourHive.ai

A comprehensive, professional-grade timetable management system designed specifically for universities and educational institutions. This powerful web application eliminates the tedious manual process of creating academic schedules and replaces it with intelligent automation.

## 🚀 Features

- 🔐 **Secure Authentication** - Firebase-based user authentication with session management
- 📅 **Smart Timetable Creation** - AI-optimized timetable generation with conflict resolution
- 📊 **Department Management** - Support for multiple departments, programs, and semesters
- 📱 **Responsive Design** - Works seamlessly on desktop, tablet, and mobile devices
- 📤 **Export Options** - Export timetables in PDF, Excel, and CSV formats
- 📚 **Template System** - Pre-built templates for quick setup and consistency
- 📈 **History Tracking** - Keep track of all your timetable versions with timestamps
- 🎯 **Room Management** - Intelligent room allocation and conflict detection
- 👥 **Teacher Scheduling** - Optimize teacher workloads and availability
- 🔄 **Real-time Updates** - Live synchronization across all users

## 🛠️ Tech Stack

### Frontend
- **HTML5, CSS3, JavaScript (ES6+)** - Modern web standards
- **Bootstrap 5.3.0** - Responsive UI framework
- **Font Awesome 6.0** - Professional icon library
- **Firebase SDK** - Authentication and real-time database
- **Progressive Web App** - Offline capabilities and mobile optimization

### Backend
- **Python 3.9+** - Core programming language
- **Flask** - Lightweight web framework
- **Firebase Realtime Database** - NoSQL database for real-time sync
- **RESTful API** - Clean, scalable API design
- **CORS Support** - Cross-origin resource sharing enabled

### Development Tools
- **Node.js & npm** - Package management and development server
- **Git** - Version control
- **VS Code** - Recommended IDE
- **Firebase CLI** - Firebase project management

## 📸 Screenshots

> **Note**: Screenshots will be added soon to showcase the application interface.

## 🎯 Use Cases

- **Universities** - Manage complex academic schedules across multiple departments
- **Colleges** - Streamline timetable creation for different programs and semesters
- **Educational Institutions** - Automate scheduling for courses, labs, and exams
- **Academic Administrators** - Reduce manual work and scheduling conflicts
- **Faculty** - Access real-time schedule updates and room assignments

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │   Firebase      │
│   (React/HTML)  │◄──►│   (Flask)       │◄──►│   Database      │
│                 │    │                 │    │                 │
│ • Authentication│    │ • REST API      │    │ • Real-time     │
│ • UI Components │    │ • Business Logic│    │ • Authentication│
│ • State Mgmt    │    │ • Data Processing│    │ • Data Storage  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🚀 Getting Started

### Prerequisites
- **Python 3.9+** - [Download Python](https://www.python.org/downloads/)
- **Node.js 16+** - [Download Node.js](https://nodejs.org/)
- **Git** - [Download Git](https://git-scm.com/downloads)
- **Firebase Account** - [Create Firebase Account](https://console.firebase.google.com/)
- **Code Editor** - VS Code recommended

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/HourHive.git
   cd HourHive
   ```

2. **Backend Setup (Python Flask API)**
   ```bash
   cd Server
   python -m venv .venv
   
   # On Windows
   .\.venv\Scripts\Activate.ps1
   
   # On macOS/Linux
   source .venv/bin/activate
   
   pip install -r requirements.txt
   python app.py
   ```

3. **Frontend Setup**
   ```bash
   cd Main
   npm install
   npm run dev
   ```

4. **Firebase Configuration**
   - Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
   - Update the Firebase configuration in:
     - `Main/src/auth.js`
     - `Main/src/firebase/database.js`
   - Replace the placeholder values with your actual Firebase config

### Usage

1. **Start the Backend Server**
   ```bash
   cd Server
   python app.py
   ```
   The API will be available at `http://localhost:5001`

2. **Start the Frontend**
   ```bash
   cd Main
   npm run dev
   ```
   The application will be available at `http://localhost:3000`

3. **Access the Application**
   - Open your browser and navigate to `http://localhost:3000/pages/department-timetable.html`
   - Create an account or login
   - Start creating your timetables!

## Project Structure

```
HourHive/
├── Main/                    # Frontend application
│   ├── src/
│   │   ├── auth.js         # Firebase authentication
│   │   ├── firebase/       # Firebase configuration
│   │   ├── components/     # Reusable components
│   │   ├── js/            # JavaScript modules
│   │   ├── pages/         # HTML pages
│   │   └── assets/        # CSS, images, etc.
│   ├── public/            # Static assets
│   └── package.json       # Frontend dependencies
├── Server/                 # Backend API
│   ├── app.py             # Flask application
│   ├── server.py          # Server configuration
│   └── requirements.txt   # Python dependencies
└── README.md              # This file
```

## 📡 API Documentation

### Authentication Endpoints
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout
- `GET /api/auth/verify` - Verify authentication token

### Timetable Management
- `GET /api/health` - Health check endpoint
- `POST /api/generate-timetable` - Generate new timetable
- `GET /api/timetables` - Get all timetables for user
- `GET /api/timetables/{id}` - Get specific timetable
- `PUT /api/timetables/{id}` - Update timetable
- `DELETE /api/timetables/{id}` - Delete timetable
- `POST /api/timetables/{id}/export` - Export timetable

### Department & Course Management
- `GET /api/departments` - Get all departments
- `POST /api/departments` - Create new department
- `GET /api/courses` - Get all courses
- `POST /api/courses` - Add new course
- `GET /api/teachers` - Get all teachers
- `POST /api/teachers` - Add new teacher

### Room & Resource Management
- `GET /api/rooms` - Get all available rooms
- `POST /api/rooms` - Add new room
- `GET /api/rooms/availability` - Check room availability
- `POST /api/rooms/reserve` - Reserve room for specific time

### Export & Reporting
- `GET /api/export/pdf/{timetable_id}` - Export as PDF
- `GET /api/export/excel/{timetable_id}` - Export as Excel
- `GET /api/export/csv/{timetable_id}` - Export as CSV
- `GET /api/reports/conflicts` - Get scheduling conflicts
- `GET /api/reports/statistics` - Get timetable statistics

## Configuration

### Firebase Setup
1. Create a new Firebase project
2. Enable Authentication (Email/Password)
3. Enable Realtime Database
4. Update the configuration files with your project details

### Environment Variables
Create a `.env` file in the Server directory:
```
FLASK_ENV=development
FLASK_DEBUG=True
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, email support@hourhive.ai or create an issue in the repository.

## 🗺️ Roadmap

### Phase 1 (Current)
- [x] Core timetable generation
- [x] User authentication
- [x] Basic export functionality
- [x] Responsive web interface

### Phase 2 (Q2 2025)
- [ ] Mobile app development (React Native)
- [ ] Advanced AI optimization algorithms
- [ ] Real-time collaboration features
- [ ] Advanced analytics dashboard

### Phase 3 (Q3 2025)
- [ ] Integration with learning management systems (Moodle, Canvas)
- [ ] Multi-language support
- [ ] Advanced reporting and insights
- [ ] API for third-party integrations

### Phase 4 (Q4 2025)
- [ ] Machine learning for optimal scheduling
- [ ] Automated conflict resolution
- [ ] Integration with calendar systems
- [ ] Enterprise-grade security features

## 🤝 Contributing

We welcome contributions from the community! Here's how you can help:

### Ways to Contribute
- 🐛 **Bug Reports** - Report issues you encounter
- 💡 **Feature Requests** - Suggest new features
- 🔧 **Code Contributions** - Submit pull requests
- 📖 **Documentation** - Improve our documentation
- 🧪 **Testing** - Help us test new features

### Development Workflow
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Standards
- Follow PEP 8 for Python code
- Use ESLint for JavaScript
- Write comprehensive tests
- Update documentation for new features

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Getting Help
- 📧 **Email**: support@hourhive.ai
- 🐛 **Issues**: [GitHub Issues](https://github.com/sabhierfan/HourHive.ai/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/sabhierfan/HourHive.ai/discussions)
- 📚 **Documentation**: [Wiki](https://github.com/sabhierfan/HourHive.ai/wiki)

### Community
- Join our [Discord Server](https://discord.gg/hourhive) for real-time discussions
- Follow us on [Twitter](https://twitter.com/hourhive) for updates
- Star ⭐ this repository if you find it helpful

## 🙏 Acknowledgments

- **Firebase** - For providing excellent backend services
- **Bootstrap** - For the responsive UI framework
- **Font Awesome** - For the beautiful icons
- **Open Source Community** - For inspiration and support

---

<div align="center">

**HourHive.ai** - Making timetable management simple and efficient.

[![GitHub stars](https://img.shields.io/github/stars/sabhierfan/HourHive.ai?style=social)](https://github.com/sabhierfan/HourHive.ai)
[![GitHub forks](https://img.shields.io/github/forks/sabhierfan/HourHive.ai?style=social)](https://github.com/sabhierfan/HourHive.ai)
[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)

Made with ❤️ by the HourHive.ai Team

</div>
