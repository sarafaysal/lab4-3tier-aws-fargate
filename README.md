# Lab 4: 3-Tier Containerized Application using AWS Fargate

This repository contains full technical documentation and visual deployment verification for a scalable, highly available **3-Tier Web Application** deployed entirely on **AWS ECS Fargate**.

---

## 🏗️ Architecture Overview

The system follows a microservices design pattern decoupled across presentation, application, and persistence layers:
[ Web Browser / Client ]
                             │
                             ▼ (Port 80 / 5000)
                [ Application Load Balancer ]
                             │
     ┌───────────────────────┴───────────────────────┐
     ▼                                               ▼
[ 3tier-frontend ]                              [ 3tier-backend ]
(React + Nginx on ECS Fargate)                 (Flask REST API on ECS Fargate)
│
▼ (Port 3306 via Service Connect)
[ 3tier-db ]
(MySQL Container on ECS Fargate)
│
▼ (Persistent Storage Mount)
[ Amazon EFS ]
### Key Components:
1. **Frontend Tier (`3tier-frontend`):** React SPA served via Nginx in an Amazon ECS Fargate task behind an AWS Application Load Balancer (ALB).
2. **Backend Tier (`3tier-backend`):** Python Flask REST API handling data processing and database interactions inside ECS Fargate.
3. **Database Tier (`3tier-db`):** Containerized MySQL 8.0 instance running on ECS Fargate.
4. **Persistent Storage (Amazon EFS):** Amazon Elastic File System mounted to `/var/lib/mysql` inside the DB container, ensuring database state persists across task restarts.
5. **Internal Networking (AWS Service Connect):** Service discovery allowing `3tier-backend` to query `3tier-db` via the internal DNS alias `db:3306` without exposing the database publicly.
6. **Container Registry (Amazon ECR):** Docker images built, tagged, and pushed to dedicated private repositories.

---

## 📷 Deployment Verification & Visual Proof

### 1. Infrastructure & Storage
* `01_ecr_repositories.png` — Private ECR Repositories storing Docker images for Frontend, Backend, and Database.
* `02_efs_filesystem.png` — Amazon EFS filesystem (`3tier-db-efs`) available across multiple VPC mount targets.
* `03_security_groups.png` — Security Group inbound/outbound rules configuring access for HTTP, Flask, and MySQL.
* `04_ecs_cluster_overview.png` — ECS Cluster `3tier-cluster` active status with running tasks.

### 2. Task Definitions
* `05_task_def_db.png` — MySQL Task Definition configured with EFS volume mount and port mapping.
* `06_task_def_backend.png` — Backend Task Definition configured with `DB_HOST=db` environment integration.
* `07_task_def_frontend.png` — Frontend Task Definition configured for HTTP Nginx delivery.

### 3. Services & Load Balancing
* `08_services_running.png` — All 3 ECS Fargate services active and maintaining desired task counts.
* `09_service_connect_backend.png` — AWS Service Connect namespace resolution mapping `3tier-backend` to `3tier-db`.
* `10_alb_overview.png` — Application Load Balancer status, DNS configuration, and listener definitions.
* `11_target_group_frontend_healthy.png` — Target group health verification for the frontend container service.
* `12_target_group_backend_healthy.png` — Target group health verification for the backend container service.

### 4. Functional End-to-End Proof
* `13_app_working_in_browser.png` — Live DataDrop UI rendered in the browser using the public ALB endpoint.
* `14_new_entry_added.png` — Data persistence validation showing newly created entries stored to EFS and fetched back to the UI.
* `15_backend_logs_showing_request.png` — Amazon CloudWatch logs confirming HTTP 200 API transactions on `/insert` and `/entries`.
* `16_db_logs_showing_connection.png` — CloudWatch logs showing successful MySQL container initialization and active queries.
