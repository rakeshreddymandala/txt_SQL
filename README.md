# Natural Language to SQL Query Generator

A full-stack application that converts natural language questions into SQL queries using AI. Built with React, FastAPI, and Mistral AI.

## 🌟 Features

- Convert natural language to SQL queries
- Real-time query execution
- Database schema visualization
- Support for custom SQL file uploads
- Interactive results display

## 🛠️ Tech Stack

### Frontend
- React
- Tailwind CSS
- Axios
- Environment Variables

### Backend
- FastAPI
- Mistral AI
- MySQL Connector
- Python-dotenv

## 🚀 Getting Started

### Prerequisites
- Node.js (v16+)
- Python (v3.8+)
- MySQL Server
- Git

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd txt_SQL
```

2. Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: .\venv\Scripts\activate
pip install -r requirements.txt
```

3. Frontend Setup
```bash
cd frontend
npm install
```

4. Environment Setup

Backend (.env):
```env
HUGGINGFACE_TOKEN="your_token"
MYSQL_HOST=127.0.0.1
MYSQL_USER=root
MYSQL_PASSWORD=your_password
MYSQL_DATABASE=your_database
```

Frontend (.env):
```env
VITE_API_URL=http://localhost:8000
```

### Running the Application

1. Start Backend
```bash
cd backend
uvicorn main:app --reload --port 8000
```

2. Start Frontend
```bash
cd frontend
npm start
```

## 🌐 Deployment

### Frontend (Vercel)
1. Push to GitHub
2. Connect repository to Vercel
3. Add environment variables
4. Deploy

### Backend (Render)
1. Create new Web Service
2. Connect GitHub repository
3. Set environment variables
4. Deploy

## 📝 Usage

1. Connect to Database
   - Enter MySQL credentials
   - Or upload SQL file

2. Ask Questions
   - Type natural language questions
   - View generated SQL
   - See query results

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Open pull request

## 📜 License

MIT License - feel free to use and modify for your projects.
