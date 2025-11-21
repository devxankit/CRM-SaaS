# SaaS CRM - Proof of Concept (POC)

## 📋 Executive Summary

**SaaS CRM** is a comprehensive multi-tenant Customer Relationship Management and Project Management platform designed for modern businesses. The system provides role-based access control with dedicated modules for Sales, Project Management, Employee Management, Client Management, and Administrative functions.

**Version**: 1.0.0  
**Architecture**: Full-stack MERN (MongoDB, Express.js, React, Node.js)  
**Deployment Status**: Production-ready with real-time capabilities

---

## 🏗️ Technology Stack

### Backend
- **Runtime**: Node.js with Express.js framework
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens) with bcryptjs
- **Real-time Communication**: Socket.io for WebSocket connections
- **File Storage**: Cloudinary for media and document management
- **Security**: Helmet, CORS, cookie-parser
- **Utilities**: ExcelJS (Excel export), PDFKit (PDF generation), Multer (file uploads)
- **SMS Integration**: SMS India service for OTP delivery
- **Process Management**: PM2 ecosystem configuration

### Frontend
- **Framework**: React 19.1.1 with Vite 7.1.7
- **Routing**: React Router DOM 7.9.2
- **UI Components**: Radix UI primitives, Tailwind CSS 3.4.17
- **Animations**: Framer Motion 12.23.21, Lottie animations
- **Charts & Visualization**: Recharts 3.2.1, React Sparklines
- **State Management**: React Context API
- **HTTP Client**: Axios 1.12.2
- **Real-time**: Socket.io Client 4.8.1
- **Date Handling**: React DatePicker
- **File Processing**: XLSX (Excel import/export)

---

## 🎯 Core Modules

### 1. **Master Admin Module**
Multi-tenant administration for platform-level management.

**Features**:
- Company/Organization management
- User subscriptions and billing
- Platform analytics and monitoring
- System logs and audit trails
- Blog management
- Multi-company dashboard

**Pages**: Home, Dashboard, Companies, Users, Subscriptions, Analytics, Billing, Logs, Blogs

---

### 2. **Admin Module** (Organization Admin)
Complete administrative control for individual organizations.

**Key Features**:
- **User Management**: Create and manage Admin, PM, Sales, Employee, and Client users
- **Project Management**: Oversight of all projects, milestones, and tasks
- **Finance Management**: 
  - Transaction tracking and reporting
  - Salary management
  - Allowance management
  - Recurring expense automation
  - Project expense tracking
- **Sales Management**: Lead distribution, team management, incentive tracking
- **HR Management**: 
  - Attendance tracking (check-in/check-out, overtime)
  - Employee performance monitoring
- **Reward Management**: Employee rewards, leaderboard, points system
- **Notice Board**: Organization-wide announcements with role-based targeting
- **Request Management**: Handle approval requests from all user types
- **Analytics Dashboard**: Comprehensive system-wide statistics

**Pages**: Dashboard, User Management, Project Management, Finance Management, Sales Management, HR Management, Reward Management, Requests Management, Notice Board, Leaderboard

---

### 3. **Project Manager (PM) Module**
Complete project delivery and team coordination.

**Key Features**:
- **Project Management**: Create, update, and manage projects with client assignment
- **Milestone Tracking**: Create milestones with progress tracking and attachments
- **Task Management**: 
  - Regular task assignment and tracking
  - Urgent task escalation system
  - Task status workflow (Pending → In Progress → Completed)
  - Task comments and attachments
- **Team Coordination**: Assign tasks to employees, monitor progress
- **Payment Management**: Track project payments, milestones, and client transactions
- **Analytics**: Project statistics, team productivity metrics
- **Wallet System**: Track earnings, rewards, and incentives
- **Leaderboard**: Team performance rankings
- **Testing Management**: Dedicated testing projects and milestones
- **Request System**: Submit and manage requests (approvals, timeline extensions, etc.)

**Pages**: Dashboard, Projects, Project Details, Milestones, Milestone Details, Tasks, Task Details, Urgent Tasks, New Projects, Testing Projects, Testing Milestones, Wallet, Profile, Leaderboard, Requests, Notifications, Notice Board

---

### 4. **Sales Module**
Complete sales pipeline and lead management system.

**Key Features**:
- **Lead Management**: 
  - Lead creation and categorization
  - Lead status workflow (New → Connected → Follow-up → Quotation → Converted/Lost)
  - Lead profile management with notes and history
  - Hot leads prioritization
- **Lead Status Tracking**:
  - New Leads, Connected, Not Picked, Today Follow-up
  - Quotation Sent, DQ Sent, App Client, Web
  - Converted, Lost
- **Client Management**: Client profiles, transaction history, payment recovery
- **Task Management**: Sales task creation and tracking
- **Meeting Management**: Schedule and track sales meetings
- **Demo Requests**: Manage product demo requests
- **Payment Recovery**: Track and manage overdue payments
- **Wallet System**: Track commissions, incentives, and earnings
- **Analytics**: Sales performance metrics, conversion rates, team statistics
- **Team Management**: Lead distribution, target setting, incentive management

**Pages**: Dashboard, Leads, New Leads, Connected, Not Picked, Today Follow-up, Quotation Sent, DQ Sent, App Client, Web, Hot Leads, Converted, Lost, Lead Profile, Client Profile, Client Transactions, Tasks, Meetings, Demo Requests, Payment Recovery, Wallet, Profile, Requests, Notifications, Notice Board

---

### 5. **Employee Module**
Employee-focused project and task management.

**Key Features**:
- **Project View**: View assigned projects with details
- **Task Management**: 
  - View assigned tasks
  - Update task status
  - Add comments and attachments
  - Track urgent tasks
- **Milestone Tracking**: View milestone details and progress
- **Analytics**: Personal productivity metrics and statistics
- **Wallet System**: Track rewards, allowances, and earnings
- **Leaderboard**: View team rankings and performance
- **Request System**: Submit requests (leave, approvals, etc.)
- **Notifications**: Real-time updates on assignments and changes

**Pages**: Dashboard, Projects, Project Details, Tasks, Task Details, Milestone Details, Wallet, Profile, Leaderboard, Requests, Notifications, Notice Board

---

### 6. **Client Module**
Client portal for project visibility and payment tracking.

**Key Features**:
- **Project Visibility**: View assigned projects with real-time progress
- **Milestone Tracking**: Monitor milestone completion and approvals
- **Payment Management**: 
  - View payment history
  - Track payment status
  - Payment statistics
- **Wallet System**: Track account balance and transactions
- **Request System**: Submit requests (timeline extensions, budget approvals, etc.)
- **Explore**: Browse available services and features
- **Notifications**: Real-time project updates

**Pages**: Dashboard, Projects, Project Details, Milestone Details, Payments, Wallet, Profile, Requests, Explore, Notifications

---

## 🗄️ Database Architecture

### Core Models (33 Models)

**User Models**:
- `Admin.js` - Admin user accounts
- `PM.js` - Project Manager accounts
- `Sales.js` - Sales team members
- `Employee.js` - Employee accounts
- `Client.js` - Client accounts
- `Account.js` - Account management

**Project Management Models**:
- `Project.js` - Project definitions
- `Milestone.js` - Project milestones
- `Task.js` - Task assignments
- `Activity.js` - Activity logging

**Financial Models**:
- `Payment.js` - Payment records
- `PaymentReceipt.js` - Payment receipts
- `AdminFinance.js` - Financial transactions
- `Salary.js` - Employee salaries
- `Allowance.js` - Employee allowances
- `RecurringExpense.js` - Recurring expenses
- `ExpenseEntry.js` - Expense entries

**Sales Models**:
- `Lead.js` - Sales leads
- `LeadCategory.js` - Lead categorization
- `LeadProfile.js` - Lead profiles
- `Incentive.js` - Sales incentives
- `SalesMeeting.js` - Sales meetings
- `SalesTask.js` - Sales tasks

**HR & Rewards Models**:
- `Attendance.js` - Attendance tracking
- `Reward.js` - Reward definitions
- `EmployeeReward.js` - Employee rewards
- `PMReward.js` - PM rewards
- `RewardTag.js` - Reward tags

**Communication Models**:
- `Notice.js` - Organization notices
- `Request.js` - Universal request system
- `DemoRequest.js` - Demo requests

---

## 🔌 API Architecture

### Authentication Endpoints
- `POST /api/admin/login` - Admin authentication
- `POST /api/pm/login` - PM authentication
- `POST /api/sales/login` - Sales authentication
- `POST /api/employee/login` - Employee authentication
- `POST /api/client/send-otp` - Client OTP generation
- `POST /api/client/verify-otp` - Client OTP verification
- `GET /api/*/profile` - Get user profile (all roles)
- `POST /api/*/logout` - Logout (all roles)

### Admin API Endpoints
- **User Management**: `/api/admin/users/*` (CRUD operations)
- **Project Management**: `/api/admin/projects/*`
- **Finance Management**: `/api/admin/finance/*`
- **Sales Management**: `/api/admin/sales/*`
- **Analytics**: `/api/admin/analytics/*`
- **Rewards**: `/api/admin/rewards/*`
- **Notices**: `/api/admin/notices/*`

### PM API Endpoints
- **Projects**: `/api/projects/*` (CRUD)
- **Milestones**: `/api/milestones/*` (CRUD)
- **Tasks**: `/api/tasks/*` (CRUD)
- **Payments**: `/api/payments/*`
- **Analytics**: `/api/analytics/pm/dashboard`

### Sales API Endpoints
- **Leads**: `/api/sales/leads/*` (CRUD)
- **Categories**: `/api/sales/categories/*`
- **Team**: `/api/sales/team/*`
- **Meetings**: `/api/sales/meetings/*`
- **Tasks**: `/api/sales/tasks/*`

### Employee API Endpoints
- **Projects**: `/api/employee/projects/*` (Read-only)
- **Tasks**: `/api/employee/tasks/*` (Update status)
- **Analytics**: `/api/employee/analytics/*`

### Client API Endpoints
- **Projects**: `/api/client/projects/*` (Read-only)
- **Payments**: `/api/client/payments/*`
- **Wallet**: `/api/client/wallet/*`
- **Explore**: `/api/client/explore/*`

### Universal Endpoints
- **Requests**: `/api/requests/*` (All user types)
- **Analytics**: `/api/analytics/*` (Role-specific)

**Total API Endpoints**: 150+ RESTful endpoints

---

## 🔄 Real-time Features

### WebSocket Integration (Socket.io)
- **Connection**: JWT-authenticated WebSocket connections
- **Rooms**: 
  - `project_{projectId}` - Project-specific updates
  - `milestone_{milestoneId}` - Milestone updates
  - `task_{taskId}` - Task updates
  - `user_{userId}` - User-specific notifications
- **Events**:
  - `join_project`, `leave_project`
  - `join_milestone`, `leave_milestone`
  - `join_task`, `leave_task`
  - `project_updated`, `milestone_updated`, `task_updated`
  - `task_status_changed`, `comment_added`

### Real-time Updates
- Live project progress tracking
- Instant task status updates
- Real-time notifications
- Collaborative task comments
- Milestone completion alerts

---

## 🛠️ Services & Utilities

### Backend Services
1. **socketService.js** - WebSocket server management
2. **cloudinaryService.js** - Cloudinary file upload integration
3. **smsService.js** - SMS OTP delivery (SMS India)
4. **dailyPointsScheduler.js** - Automated daily points allocation
5. **recurringExpenseAutoPayScheduler.js** - Automated recurring expense processing

### Backend Utilities
1. **errorResponse.js** - Standardized error response formatting
2. **financeTransactionHelper.js** - Financial transaction processing
3. **paymentMethodMapper.js** - Payment method mapping utilities

### Frontend Services
- **Base API Service**: Centralized API client with error handling
- **Module-specific Services**: Dedicated service layers for each module
- **Cloudinary Service**: Frontend file upload integration

---


```
SaaS CRM/
├── backend/
│   ├── config/          # Database & Cloudinary configuration
│   ├── controllers/      # 30+ controller files (business logic)
│   ├── middlewares/      # Auth, validation, upload, async handlers
│   ├── models/           # 33 Mongoose models
│   ├── routes/           # 25+ route files
│   ├── services/         # 5 service files (Socket, SMS, Cloudinary, Schedulers)
│   ├── utils/            # Utility functions
│   ├── scripts/          # Database seeding & utility scripts
│   ├── public/           # Static files
│   └── server.js         # Main server entry point
│
├── frontend/
│   ├── src/
│   │   ├── modules/
│   │   │   ├── admin/           # Admin module (10 pages)
│   │   │   ├── dev/             # PM, Employee, Client modules (40+ pages)
│   │   │   ├── sells/           # Sales module (29 pages)
│   │   │   └── master-admin/    # Master Admin module (10 pages)
│   │   ├── components/          # Reusable UI components
│   │   ├── contexts/            # React Context providers
│   │   ├── services/            # API service layers
│   │   ├── utils/               # Utility functions
│   │   └── App.jsx             # Main application router
│   ├── public/                 # Static assets
│   └── package.json
│
└── tools/                      # Documentation & utilities
```

---

## 🔐 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Role-Based Access Control (RBAC)**: Granular permissions per role
- **Password Hashing**: bcryptjs with salt rounds
- **CORS Protection**: Configurable allowed origins
- **Helmet Security**: HTTP header security
- **Input Validation**: Request validation middleware
- **Protected Routes**: Frontend route guards for all modules
- **OTP Verification**: SMS-based OTP for client authentication

---

