# Standard Operating Procedure (SOP)
## SaaS CRM System 

**Document Version:** 1.0  
**Last Updated:** December 2025  
**Status:** Production

---

## Table of Contents
1. [System Overview](#system-overview)
2. [Architecture](#architecture)
3. [User Roles & Access](#user-roles--access)
4. [Modules & Features](#modules--features)
5. [API Structure](#api-structure)
6. [Development Workflow](#development-workflow)
7. [Deployment](#deployment)
8. [Maintenance & Monitoring](#maintenance--monitoring)

---

## System Overview

### Purpose
Comprehensive SaaS CRM platform for project management, sales operations, employee management, and client relations with real-time collaboration capabilities.

### Technology Stack

**Backend:**
- Node.js with Express.js
- MongoDB (Mongoose ODM)
- Socket.io (WebSocket)
- JWT Authentication
- Cloudinary (File Storage)
- PM2 (Process Management)

**Frontend:**
- React 19 with Vite
- React Router DOM
- Tailwind CSS
- Socket.io Client
- Axios (API Client)
- Recharts (Analytics)

---

## Architecture

### System Components

1. **Backend Server** (`backend/`)
   - RESTful API endpoints
   - WebSocket real-time communication
   - Background job schedulers
   - File upload handling
   - Authentication middleware

2. **Frontend Application** (`frontend/`)
   - Role-based module separation
   - Protected route system
   - Service layer architecture
   - Responsive mobile-first design

3. **Database**
   - MongoDB Atlas (Cloud)
   - 30+ data models
   - Role-based collections

4. **External Services**
   - Cloudinary (Media storage)
   - SMS India (OTP delivery)


backend/
├── config/          # Database & Cloudinary config
├── controllers/     # Business logic (25+ controllers)
├── models/          # Data models (30+ schemas)
├── routes/          # API route definitions
├── middlewares/     # Auth, validation, upload
├── services/        # Background jobs & Socket.io
├── utils/           # Helper functions
└── scripts/         # Database seeding utilities

frontend/
├── src/
│   ├── modules/
│   │   ├── admin/        # Admin module
│   │   ├── dev/          # PM, Employee, Client modules
│   │   ├── sells/        # Sales module
│   │   └── master-admin/ # Super admin module
│   ├── components/       # Reusable UI components
│   ├── contexts/         # React contexts
│   ├── config/           # Environment config
│   └── utils/            # Helper functions
```



## User Roles & Access

### 1. Master Admin
- **Access Level:** Super Admin (Platform Owner)
- **Modules:** Analytics, Billing, Subscriptions, Companies, Users, Logs
- **Purpose:** Platform-wide administration

### 2. Admin
- **Access Level:** Organization Admin
- **Modules:**
  - User Management (Create/Edit/Delete all user types)
  - Project Management (Oversight & control)
  - Finance Management (Transactions, Accounts)
  - HR Management (Attendance, Recurring Expenses, Allowances)
  - Sales Management (Team, Leads, Categories, Incentives)
  - Reward Management
  - Notice Board
  - Requests Management
  - Analytics & Reports
- **Authentication:** Email + Password (JWT)

### 3. Project Manager (PM)
- **Access Level:** Project Operations
- **Modules:**
  - Project CRUD operations
  - Milestone management
  - Task assignment & tracking
  - Urgent task handling
  - Payment tracking
  - Team analytics
  - Wallet (Rewards & Salary)
  - Requests
  - Notifications
  - Notice Board
- **Authentication:** Email + Password (JWT)

### 4. Sales Representative
- **Access Level:** Sales Operations
- **Modules:**
  - Lead management (All stages)
  - Client management
  - Meetings & Tasks
  - Demo requests
  - Payment recovery
  - Team analytics
  - Wallet
  - Requests
  - Notice Board
- **Authentication:** Email + Password (JWT)

### 5. Employee (Developer)
- **Access Level:** Project Contributor
- **Modules:**
  - Assigned projects view
  - Task management
  - Milestone details
  - Analytics dashboard
  - Leaderboard
  - Points system
  - Requests
  - Wallet
  - Notifications
  - Notice Board
- **Authentication:** Email + Password (JWT)
- **Teams:** Developer, Sales

### 6. Client
- **Access Level:** External Stakeholder
- **Modules:**
  - Project visibility
  - Milestone tracking
  - Payment history
  - Wallet
  - Requests
  - Notifications
  - Explore (Services)
- **Authentication:** Phone + OTP (JWT)

---

## Modules & Features

### Admin Module

#### 1. User Management
- Create users (Admin, HR, PM, Sales, Employee, Client)
- Edit user profiles
- Deactivate/Activate users
- User statistics dashboard
- Bulk operations support

#### 2. Project Management
- View all projects
- Project statistics
- Project creation & editing
- Status management
- Client & PM assignment

#### 3. Finance Management
- **Transactions Tab:**
  - Income/Expense tracking
  - Category management
  - Client/Project linking
  - Payment method tracking
  - Account management
- **Other Tabs:** Budgets, Invoices, Expenses (In Progress)

#### 4. HR Management
- **Recurring Expenses:**
  - Monthly/Quarterly/Yearly setup
  - Auto-entry generation
  - Payment tracking
- **Allowances:**
  - Employee allowance management
- **Attendance:**
  - Daily check-in/check-out
  - Status tracking (Present, Absent, Late, On Leave)
  - Statistics & reports

#### 5. Sales Management
- **Lead Management:**
  - Lead creation (Single & Bulk)
  - Lead status workflow (New → Converted/Lost)
  - Category management
  - Lead distribution
- **Team Management:**
  - Sales team creation
  - Target setting
  - Lead assignment
  - Incentive management
- **Analytics:**
  - Category performance
  - Team performance
  - Conversion tracking

#### 6. Reward Management
- Reward creation & distribution
- Tag-based categorization
- Employee reward tracking

#### 7. Notice Board
- Create notices for all/specific roles
- Priority-based notices
- Attachment support
- Expiry management

#### 8. Requests Management
- Universal request system
- Multi-user type support
- Request types (Approval, Feedback, Payment Recovery, etc.)
- Status tracking (Pending, Responded, Approved, Rejected)

#### 9. Analytics Dashboard
- System-wide statistics
- User metrics
- Project metrics
- Financial overview

---

### Sales Module

#### Core Features
- **Lead Management:**
  - Lead stages: New, Connected, Not Picked, Today Followup, Quotation Sent, DQ Sent, Web, App Client, Hot Leads, Converted, Lost
  - Lead profile with complete history
  - Status updates & follow-ups
  - Notes & attachments

- **Client Management:**
  - Client profiles
  - Transaction history
  - Payment tracking

- **Tasks & Meetings:**
  - Task creation & assignment
  - Meeting scheduling
  - Calendar integration

- **Payment Recovery:**
  - Outstanding payment tracking
  - Recovery requests

- **Analytics:**
  - Personal performance metrics
  - Lead conversion rates
  - Revenue tracking

---

### Project Management Module (PM)

#### Core Features
- **Projects:**
  - Create/edit/delete projects
  - Project status (Untouched, In Progress, On Hold, Testing, Completed, Cancelled)
  - Client assignment
  - Attachment management

- **Milestones:**
  - Create milestones per project
  - Progress tracking (0-100%)
  - Due date management
  - Attachment support

- **Tasks:**
  - Task creation & assignment
  - Status management (Pending, In Progress, Completed, Blocked)
  - Priority levels (Low, Normal, High, Urgent)
  - Urgent task system
  - Comment system
  - File attachments

- **Payments:**
  - Payment tracking per project
  - Payment status (Pending, Partial, Paid, Overdue)
  - Receipt generation

- **Analytics:**
  - Project performance metrics
  - Team productivity
  - Timeline tracking

- **Wallet:**
  - Salary tracking
  - Performance rewards
  - Transaction history

---

### Employee Module

#### Core Features
- **Dashboard:**
  - Assigned projects overview
  - Task statistics
  - Performance metrics
  - Points system

- **Projects:**
  - View assigned projects
  - Project details & milestones
  - Progress tracking

- **Tasks:**
  - View assigned tasks
  - Status updates
  - Comment on tasks
  - Upload attachments

- **Analytics:**
  - Personal productivity metrics
  - Task completion rates
  - Performance trends

- **Leaderboard:**
  - Points-based ranking
  - Department-wise leaderboards

- **Wallet:**
  - Salary & rewards tracking
  - Transaction history

---

### Client Module

#### Core Features
- **Dashboard:**
  - Project overview
  - Milestone progress
  - Payment status

- **Projects:**
  - View assigned projects
  - Project details
  - Milestone tracking

- **Payments:**
  - Payment history
  - Receipts
  - Outstanding payments

- **Wallet:**
  - Transaction history
  - Balance tracking

- **Explore:**
  - Service catalog
  - Additional offerings

---




1. **Authentication Routes** (`/admin`, `/pm`, `/sales`, `/employee`, `/client`)
   - POST `/login` - User login
   - GET `/profile` - Get user profile
   - POST `/logout` - User logout
   - POST `/send-otp` (Client only) - Send OTP
   - POST `/verify-otp` (Client only) - Verify OTP

2. **Project Routes** (`/projects`, `/api/projects`)
   - CRUD operations (PM only)
   - Statistics endpoints
   - File upload endpoints

3. **Milestone Routes** (`/milestones`, `/api/milestones`)
   - CRUD operations
   - Progress update endpoints

4. **Task Routes** (`/tasks`, `/api/tasks`)
   - CRUD operations
   - Status update endpoints
   - Assignment endpoints
   - Urgent task endpoints

5. **Payment Routes** (`/payments`, `/api/payments`)
   - Payment tracking
   - Statistics endpoints

6. **Admin Routes** (`/admin/*`, `/api/admin/*`)
   - User management
   - Project management
   - Finance management
   - HR management
   - Sales management
   - Analytics

7. **Role-Specific Routes**
   - `/employee/*` - Employee-specific endpoints
   - `/client/*` - Client-specific endpoints
   - `/admin/*` - Admin-specific endpoints

8. **Universal Routes**
   - `/requests` - Request management (All roles)
   - `/analytics` - Analytics endpoints

### WebSocket Events
- **Connection:** JWT authentication required
- **Rooms:**
  - `project_{projectId}`
  - `milestone_{milestoneId}`
  - `task_{taskId}`
  - `user_{userId}`

- **Events:**
  - `join_project`, `leave_project`
  - `join_milestone`, `leave_milestone`
  - `join_task`, `leave_task`
  - `project_updated`, `milestone_updated`, `task_updated`
  - `task_status_changed`, `comment_added`

---

## Development Workflow

### Prerequisites
- Node.js 18+ installed
- MongoDB Atlas account (or local MongoDB)
- Cloudinary account
- Git installed

## Maintenance & Monitoring

### Background Jobs

1. **Daily Points Scheduler**
   - Runs at midnight daily
   - Deducts points for overdue tasks
   - Awards points for completed tasks

2. **Recurring Expense Auto-Pay**
   - Runs at midnight daily
   - Generates expense entries
   - Marks overdue payments

### Health Checks

**Backend:**
- `GET /health` - Basic health check
- `GET /status` - Detailed server status (WebSocket, Database, Memory)

### Logging

**Backend Logs:**
- PM2 logs: `backend/logs/pm2-*.log`
- Morgan HTTP logs (Development)
- Console logs with structured format

**Error Handling:**
- Centralized error middleware
- Error response standardization
- Development vs Production error messages

### Database Maintenance

### Security Practices

1. **Authentication:**
   - JWT token expiration (7 days)
   - Password hashing (bcrypt, 12 rounds)
   - Account lockout (5 failed attempts, 2-hour lock)

2. **Authorization:**
   - Role-based access control (RBAC)
   - Route-level protection
   - Resource-level permissions

3. **Data Protection:**
   - Input validation
   - SQL injection prevention (Mongoose)
   - XSS protection (Helmet)
   - CORS configuration

4. **File Uploads:**
   - Cloudinary integration
   - File type validation
   - Size limits

---

## Module Status Summary

### Fully Implemented (100%)
- ✅ Authentication System (All roles)
- ✅ Project Management Module (PM)
- ✅ Task Management System
- ✅ Milestone Management
- ✅ Admin User Management
- ✅ Admin Sales Management
- ✅ Admin Finance Transactions
- ✅ Admin HR Recurring Expenses
- ✅ Admin HR Attendance
- ✅ Admin Notice Board
- ✅ Request Management System
- ✅ PM Wallet System
- ✅ Sales Lead Management
- ✅ WebSocket Real-time Updates



## Support & Contact

**Technical Issues:**
- Check server logs: `pm2 logs`
- Verify environment variables
- Test API endpoints: `POSTMAN` or `curl`
- Check database connection

**Documentation:**
- Backend API docs: `GET /api`
- Frontend service layer: `frontend/src/modules/*/services/`
- Model schemas: `backend/models/`

---
