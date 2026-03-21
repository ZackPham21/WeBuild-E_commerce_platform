# Docker & PostgreSQL Setup Guide

## Prerequisites

- Docker Desktop installed and running
- At least 4GB RAM allocated to Docker

## Quick Start

```bash
# Build images and start all services
docker-compose build
docker-compose up -d

# Verify everything is running
docker-compose ps
```

## Service URLs

| Service    | Port | URL                   |
|------------|------|-----------------------|
| Gateway    | 8080 | http://localhost:8080 |
| IAM        | 8081 | http://localhost:8081 |
| Catalogue  | 8082 | http://localhost:8082 |
| Auction    | 8083 | http://localhost:8083 |
| Payment    | 8084 | http://localhost:8084 |

## Database Connections (host access)

| Database   | Port | Database Name |
|------------|------|---------------|
| IAM        | 5432 | iamdb         |
| Catalogue  | 5433 | cataloguedb   |
| Auction    | 5434 | auctiondb     |
| Payment    | 5435 | paymentdb     |

Default credentials: `postgres` / `postgres`

## Test Users

| Username   | Password      |
|------------|---------------|
| winner789  | WinPass!1     |
| loser456   | LosePass!1    |
| seller1    | SellerPass!1  |

## Common Commands

```bash
# Stop services (keep data)
docker-compose down

# Stop and delete all data
docker-compose down -v

# View logs
docker-compose logs -f
docker-compose logs -f iam-service

# Rebuild a single service after code changes
docker-compose build iam-service
docker-compose up -d iam-service

# Rebuild everything from scratch
docker-compose build --no-cache
docker-compose up -d
```

## Environment Variables

Copy `.env.example` to `.env` to override defaults:

```bash
cp .env.example .env
```
