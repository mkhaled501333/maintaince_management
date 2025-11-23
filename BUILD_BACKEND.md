# Backend Build Instructions

## Option 1: Using Docker (Recommended)

### Build and Run with Docker Compose
```bash
# Build and start all services (backend, frontend, MySQL)
docker-compose up --build

# Or build only the backend
docker-compose build backend

# Run only the backend service
docker-compose up backend
```

### Build Docker Image Only
```bash
cd backend
docker build -t maintenance-backend .
```

## Option 2: Local Development Setup

### Prerequisites
- Python 3.11 or higher
- MySQL 8.0 (or use Docker for MySQL only)
- pip (Python package manager)

### Steps

1. **Navigate to backend directory**
```bash
cd backend
```

2. **Create virtual environment (if not already created)**
```bash
# Windows
python -m venv venv
venv\Scripts\activate

# Linux/Mac
python3 -m venv venv
source venv/bin/activate
```

3. **Install dependencies**
```bash
pip install -r requirements.txt
```

4. **Set up environment variables**
```bash
# Copy the example env file
copy backend-env.example .env  # Windows
# or
cp backend-env.example .env    # Linux/Mac

# Edit .env file with your database credentials
```

5. **Run database migrations**
```bash
alembic upgrade head
```

6. **Start the backend server**
```bash
# Development mode (with auto-reload)
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Production mode
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

## Option 3: Production Build

### Using Docker for Production
```bash
# Build production image
docker build -t maintenance-backend:latest ./backend

# Run production container
docker run -d \
  -p 8000:8000 \
  -e DATABASE_URL="mysql+pymysql://user:password@host:3306/dbname" \
  -e SECRET_KEY="your-secret-key" \
  -e ALGORITHM="HS256" \
  -e ACCESS_TOKEN_EXPIRE_MINUTES=30 \
  -v $(pwd)/backend/uploads:/app/uploads \
  maintenance-backend:latest
```

### Using Gunicorn for Production (Alternative)
```bash
# Install gunicorn
pip install gunicorn

# Run with gunicorn
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

## Environment Variables

Required environment variables (set in `.env` file or Docker environment):

- `DATABASE_URL`: MySQL connection string (e.g., `mysql+pymysql://user:password@host:3306/dbname`)
- `SECRET_KEY`: Secret key for JWT token signing
- `ALGORITHM`: JWT algorithm (default: `HS256`)
- `ACCESS_TOKEN_EXPIRE_MINUTES`: Token expiration time (default: 30)
- `UPLOAD_DIR`: Directory for file uploads (default: `./uploads`)

## Verify Build

After building, verify the backend is running:

1. **Health Check**
```bash
curl http://localhost:8001/health
```

2. **API Root**
```bash
curl http://localhost:8001/
```

3. **API Documentation**
- Swagger UI: http://localhost:8001/docs
- ReDoc: http://localhost:8001/redoc

## Troubleshooting

### Database Connection Issues
- Ensure MySQL is running and accessible
- Check DATABASE_URL format
- Verify database credentials

### Port Already in Use
- Change port: `--port 8001`
- Or stop the service using port 8000

### Missing Dependencies
- Reinstall: `pip install -r requirements.txt --force-reinstall`

### Migration Issues
- Check alembic.ini configuration
- Run: `alembic current` to check migration status
- Reset: `alembic downgrade base` then `alembic upgrade head`


