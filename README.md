# 3-Tier Application on AWS ECS Fargate

A containerized 3-tier web application (React frontend, Flask backend, MySQL database) deployed entirely on **AWS ECS Fargate** — no EC2 instances managed, no servers to patch. Each tier runs as its own independently deployable Fargate task and service, connected through **AWS ECS Service Connect** and an **Application Load Balancer**, with the database backed by **Amazon EFS** for persistent storage.

This project was built as a hands-on lab covering containerization fundamentals (Docker, Dockerfiles, container networking) and their real-world deployment equivalent on AWS's serverless container platform.

---

## Architecture
Internet
                        |
                        v
            +-----------------------+
            |  Application Load      |
            |  Balancer (public)     |
            +-----------+-------------+
             :80         |        :5000
    +----------------+  |  +----------------+
    |   frontend      |  |  |   backend       |
    |   (Fargate,     |<-+->|   (Fargate,     |
    |   Nginx + React)|     |   Flask API)    |
    +----------------+     +--------+--------+
                                      |
                            Service Connect: "db"
                                      v
                             +----------------+
                             |      db         |
                             |  (Fargate,      |
                             |   MySQL)        |
                             +--------+--------+
                                      |
                                      v
                             +----------------+
                             |  Amazon EFS     |
                             |  (persistent    |
                             |   volume)       |
                             +----------------+
**Why each tier is a separate task/service, not one combined container:** this mirrors how you'd actually run production workloads — each tier scales, deploys, and fails independently. The frontend can be redeployed without touching the backend or database; the backend can scale to multiple tasks under load without duplicating the database.

**Why the database is a Fargate task with an EFS volume, instead of RDS:** Fargate tasks have no persistent local disk — anything written inside a container is lost on restart. Mounting an EFS volume at MySQL's data directory (`/var/lib/mysql`) gives the database tier durable storage that survives task restarts and redeployments, while keeping the entire stack (including the database) on Fargate as required for this lab.

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React (built with Vite), served via Nginx |
| Backend | Python / Flask |
| Database | MySQL 8 |
| Container orchestration | Amazon ECS (Fargate launch type) |
| Service discovery | AWS ECS Service Connect |
| Load balancing | Application Load Balancer |
| Persistent storage | Amazon EFS |
| Image registry | Amazon ECR |
| Secrets | AWS Secrets Manager |
| Logging | Amazon CloudWatch Logs |

---

## Repository structure
.
├── frontend/
│ ├── Dockerfile
│ ├── src/
│ │ └── App.jsx
│ └── ...
├── backend/
│ ├── Dockerfile
│ ├── app.py
│ └── ...
├── task-definitions/
│ ├── frontend-task-def.json
│ ├── backend-task-def.json
│ └── db-task-def.json
├── screenshots/
│ └── ... (deployment verification evidence)
└── README.md
---

## How it works

1. **Frontend** — a static React app served by Nginx inside its own container. The browser loads it from the ALB's public DNS name and calls the backend API directly from client-side JavaScript.
2. **Backend** — a Flask API exposing `/entries` (GET, DELETE) and `/insert` (POST) routes. It connects to the database using the hostname `db`, resolved automatically via ECS Service Connect — the same mechanism, conceptually, as Docker's container-name DNS resolution on a user-defined bridge network.
3. **Database** — MySQL running as its own Fargate task, with its data directory mounted on an EFS volume so data persists independently of the task's lifecycle.

Each tier only trusts the layer directly in front of it: the internet can only reach the ALB, the ALB can only reach frontend/backend tasks, and only the backend's security group is permitted to reach the database on port 3306.

---

## Local development (Docker, before AWS deployment)

```bash
docker build -t 3tier-backend ./backend
docker build -t 3tier-frontend ./frontend

docker network create 3tier-net

docker run -d --name db --network 3tier-net -e MYSQL_ROOT_PASSWORD=<password> -e MYSQL_DATABASE=appdb -v db-data:/var/lib/mysql mysql:8
docker run -d --name backend --network 3tier-net -e DB_HOST=db -p 5000:5000 3tier-backend
docker run -d --name frontend --network 3tier-net -p 3000:80 3tier-frontend
```

Then open `http://localhost:3000`.

---

## AWS deployment (summary)

1. Push all three images to **Amazon ECR**
2. Create an **EFS** file system for the database's persistent volume
3. Create security groups enforcing the trust chain: `alb-sg` -> `frontend-sg`/`backend-sg` -> `db-sg`
4. Create an **ECS cluster** (Fargate)
5. Register three task definitions — one per tier — including the EFS volume mount on the db task
6. Create an **Application Load Balancer** with target groups for frontend and backend
7. Create three ECS services (db -> backend -> frontend), enabling **Service Connect** on a shared namespace so the backend can resolve `db` by name
8. Point the frontend's API calls at the ALB's DNS name and redeploy

Full task definitions are in [`/task-definitions`](./task-definitions).

---

## Deployment verification

Screenshots documenting a working deployment — cluster, task definitions, running services, healthy load balancer targets, and an end-to-end functional test — are in [`/screenshots`](./screenshots).

---

## What this demonstrates

- Multi-stage Docker builds (frontend build stage vs slim Nginx runtime stage)
- Container-to-container networking, both locally (Docker bridge network) and in the cloud (ECS Service Connect)
- Environment-based configuration and secrets handling (no credentials hardcoded in source)
- Persistent storage for stateful workloads on an inherently stateless compute platform (Fargate + EFS)
- Defense-in-depth network design using layered security groups
