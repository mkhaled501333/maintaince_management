# Running the Application with Docker

This guide explains how to run the Maintenance Management application using Docker and Docker Compose.

## Prerequisites

- [Docker](https://www.docker.com/get-started) (version 20.10 or higher)
- [Docker Compose](https://docs.docker.com/compose/install/) (version 2.0 or higher)

## Quick Start

1. **Clone the repository** (if you haven't already):
   ```bash
   cd maintaince_management
   ```

2. **Start all services**:
   ```bash
   docker-compose up -d
   ```

   This will start:
   - MySQL database (port 3306)
   - Backend API (port 8000)
   - Frontend application (port 3000)

3. **View logs**:
   ```bash
   docker-compose logs -f
   ```

4. **Access the application**:
   - Frontend: http://localhost:3001
   - Backend API: http://localhost:8001
   - API Documentation: http://localhost:8001/docs
   - Health Check: http://localhost:8001/health

## Services

### MySQL Database
- **Container**: `maintenance_mysql`
- **Port**: 3306
- **Database**: `maintenance_db`
- **User**: `user`
- **Password**: `Admin@1234` (⚠️ Change in production!)
- **Root Password**: `Admin@1234` (⚠️ Change in production!)

### Backend API
- **Container**: `maintenance_backend`
- **Port**: 8000
- **Framework**: FastAPI
- **Database URL**: Automatically configured to connect to MySQL service
- **Hot Reload**: Enabled (code changes are reflected automatically)

### Frontend
- **Container**: `maintenance_frontend`
- **Port**: 3000
- **Framework**: Next.js
- **Hot Reload**: Enabled (code changes are reflected automatically)

## Common Commands

### Start services
```bash
docker-compose up -d
```

### Stop services
```bash
docker-compose down
```

### Stop and remove volumes (⚠️ This will delete database data)
```bash
docker-compose down -v
```

### View logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f mysql
```

### Rebuild containers (after code changes)
```bash
docker-compose up -d --build
```

### Execute commands in containers
```bash
# Backend shell
docker-compose exec backend bash

# Frontend shell
docker-compose exec frontend sh

# MySQL shell
docker-compose exec mysql mysql -u user -p maintenance_db
```

### Run database migrations
```bash
docker-compose exec backend alembic upgrade head
```

### Create a new migration
```bash
docker-compose exec backend alembic revision --autogenerate -m "description"
```

## Environment Variables

### Backend Environment Variables
The backend uses these environment variables (set in `docker-compose.yml`):
- `DATABASE_URL`: MySQL connection string
- `SECRET_KEY`: JWT secret key (⚠️ Change in production!)
- `ALGORITHM`: JWT algorithm (default: HS256)
- `ACCESS_TOKEN_EXPIRE_MINUTES`: Token expiration time (default: 30)
- `UPLOAD_DIR`: Directory for file uploads

### Frontend Environment Variables
The frontend uses these environment variables:
- `NEXT_PUBLIC_API_URL`: Backend API URL (default: http://localhost:8001/api/v1)
- `NEXT_PUBLIC_APP_NAME`: Application name

## Production Considerations

⚠️ **Important**: The current Docker setup is configured for **development**. Before deploying to production:

1. **Change default passwords**:
   - Update MySQL root password
   - Update MySQL user password
   - Update `SECRET_KEY` in docker-compose.yml

2. **Use environment files**:
   - Create `.env` files for sensitive data
   - Use `docker-compose.prod.yml` for production overrides

3. **Frontend build**:
   - Update `frontend/Dockerfile` to build for production
   - Use `npm run build` and `npm start` instead of `npm run dev`

4. **Security**:
   - Remove `--reload` flag from backend
   - Set proper CORS origins
   - Use HTTPS in production
   - Secure database connections

5. **Volumes**:
   - Use named volumes for persistent data
   - Backup database regularly

## Troubleshooting

### Port already in use
If you get an error about ports being in use:
```bash
# Check what's using the port
netstat -ano | findstr :8000  # Windows
lsof -i :8000                 # Linux/Mac

# Or change ports in docker-compose.yml
```

### Database connection errors
1. Ensure MySQL container is running: `docker-compose ps`
2. Wait a few seconds after starting MySQL (it needs time to initialize)
3. Check MySQL logs: `docker-compose logs mysql`

### Frontend can't connect to backend
1. Check that `NEXT_PUBLIC_API_URL` in docker-compose.yml points to the correct backend URL
2. For external access, use your machine's IP address instead of `localhost`
3. Ensure backend CORS settings allow the frontend origin

### Container won't start
1. Check logs: `docker-compose logs [service-name]`
2. Rebuild containers: `docker-compose up -d --build`
3. Remove and recreate: `docker-compose down -v && docker-compose up -d`

### File uploads not persisting
Uploads are stored in a Docker volume. To access them:
```bash
docker-compose exec backend ls -la /app/uploads
```

## Development Workflow

1. Make code changes in your local files
2. Changes are automatically reflected (hot reload enabled)
3. For database schema changes:
   ```bash
   docker-compose exec backend alembic revision --autogenerate -m "your message"
   docker-compose exec backend alembic upgrade head
   ```

## Data Persistence

- **Database**: Stored in `mysql_data` volume (persists between restarts)
- **Uploads**: Stored in `backend_uploads` volume (persists between restarts)
- **Code**: Mounted from local filesystem (changes reflect immediately)

To backup the database:
```bash
docker-compose exec mysql mysqldump -u user -pAdmin@1234 maintenance_db > backup.sql
```

To restore:
```bash
docker-compose exec -T mysql mysql -u user -pAdmin@1234 maintenance_db < backup.sql
```

