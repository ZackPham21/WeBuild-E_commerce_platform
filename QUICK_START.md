# Quick Start

## Build & Run

```bash
# Build all Docker images
docker-compose build

# Start all services (runs in background)
docker-compose up -d

# View status
docker-compose ps
```

## Verify Services

```bash
# Check logs
docker-compose logs -f

# Test gateway health
curl http://localhost:8080/api/gateway/health
```

## Database Access

```bash
# Connect to IAM database
psql -h localhost -p 5432 -U postgres -d iamdb

# Connect to other databases (ports 5433-5435)
```

## Clean Up

```bash
# Stop services (keep data)
docker-compose down

# Stop and remove all data
docker-compose down -v
```

See `DOCKER_SETUP.md` for comprehensive documentation.
