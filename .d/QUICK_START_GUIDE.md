# Quick Start Guide - Factory Maintenance Management System

## 🚀 Getting Started in 5 Minutes

### Prerequisites
- Node.js 18+ installed
- Docker Desktop installed
- Git installed
- Code editor (VS Code recommended)

### Initial Setup Commands

```bash
# 1. Clone/Initialize repository
git init
npm create next-app@latest . --typescript --tailwind --app --src-dir

# 2. Install dependencies
npm install prisma @prisma/client
npm install bcrypt jsonwebtoken
npm install react-query html5-qrcode chart.js
npm install -D @types/bcrypt @types/jsonwebtoken

# 3. Initialize Prisma
npx prisma init

# 4. Create Docker setup
# Copy docker-compose.yml from Phase 0.3

# 5. Start Docker containers
docker-compose up -d

# 6. Create database schema
npx prisma migrate dev --name init

# 7. Seed database
npx prisma db seed

# 8. Start development server
npm run dev
```

---

## 📋 Phase Summary at a Glance

### Phase 0: Foundation (Week 1-2)
**Goal**: Project setup, authentication, Docker
- ✓ Next.js + TypeScript + Tailwind
- ✓ Prisma + MySQL + Docker
- ✓ Authentication system
- ✓ Project structure

### Phase 1: Core (Week 2-3)
**Goal**: Database + User Management
- ✓ Complete 18-table schema
- ✓ User management with RBAC
- ✓ Department management
- ✓ Seed data

### Phase 2: Machines & QR (Week 4-5)
**Goal**: Machine management + QR scanning
- ✓ Machine CRUD + QR generation
- ✓ Supervisor QR scanner + problem reporting
- ✓ Technician QR scanner
- ✓ File upload system

### Phase 3: Maintenance (Week 6-8)
**Goal**: Complete maintenance workflow
- ✓ Maintenance requests lifecycle
- ✓ Maintenance work tracking
- ✓ Spare parts approval flow
- ✓ Auto downtime tracking
- ✓ Role dashboards

### Phase 4: Inventory (Week 9-11)
**Goal**: Comprehensive inventory system
- ✓ Spare parts management
- ✓ Inventory transactions (IN/OUT/ADJUST)
- ✓ Machine-specific spare parts
- ✓ Automatic quantity updates
- ✓ Inventory reports

### Phase 5: Advanced (Week 12-14)
**Goal**: Preventive maintenance + tracking
- ✓ Preventive maintenance scheduling
- ✓ Failure codes + Maintenance types
- ✓ Activity logs + Audit trail
- ✓ Manual/documentation system
- ✓ Notifications

### Phase 6: Analytics (Week 15-16)
**Goal**: Reports + optimization
- ✓ Analytics dashboards
- ✓ Comprehensive reports
- ✓ Performance optimization
- ✓ UI/UX polish
- ✓ Testing

### Phase 7: Deploy (Week 17-18)
**Goal**: Production launch
- ✓ Production setup
- ✓ CI/CD pipeline
- ✓ Security hardening
- ✓ Documentation + Training
- ✓ Go-live

---

## 🎯 Critical Path Items

### Must-Have for MVP (Phases 0-3)
1. ✅ Authentication & Authorization
2. ✅ Machine Management + QR Codes
3. ✅ Problem Reporting (Supervisor)
4. ✅ Maintenance Request Workflow
5. ✅ Basic Spare Parts Management
6. ✅ Downtime Tracking

### Nice-to-Have (Phases 4-5)
- Comprehensive Inventory Management
- Preventive Maintenance
- Activity Logs
- Advanced Analytics

### Future Enhancements (Post-Launch)
- Predictive Analytics (AI/ML)
- Mobile App
- Real-time WebSocket Notifications
- Advanced Integrations

---

## 📊 Weekly Deliverables Checklist

### Week 1-2: Foundation
- [ ] Next.js project initialized
- [ ] Docker containers running
- [ ] Database connected
- [ ] Authentication working
- [ ] Can login as admin

### Week 3: Database & Users
- [ ] All 18 tables created
- [ ] User CRUD working
- [ ] Departments created
- [ ] RBAC middleware working

### Week 4-5: Machines & QR
- [ ] Machines can be added
- [ ] QR codes generated
- [ ] Supervisor can scan + report
- [ ] Technician can scan + view
- [ ] File uploads working

### Week 6-8: Maintenance Flow
- [ ] Requests can be created
- [ ] Status workflow functional
- [ ] Spare parts can be requested
- [ ] Manager can approve
- [ ] Downtime auto-tracked
- [ ] All role dashboards working

### Week 9-11: Inventory
- [ ] Spare parts management complete
- [ ] Transactions tracked (IN/OUT)
- [ ] Quantity updates automatically
- [ ] Machine-specific parts assigned
- [ ] Inventory reports working

### Week 12-14: Advanced Features
- [ ] Preventive maintenance scheduled
- [ ] Failure codes integrated
- [ ] Activity logs capturing actions
- [ ] Notifications working

### Week 15-16: Analytics & Polish
- [ ] Analytics dashboards complete
- [ ] All reports functional
- [ ] Performance optimized
- [ ] UI/UX polished

### Week 17-18: Deploy
- [ ] Production environment ready
- [ ] CI/CD pipeline working
- [ ] Users trained
- [ ] System live!

---

## 🔧 Development Workflow

### Daily Workflow
```bash
# Start Docker containers
docker-compose up -d

# Start development server
npm run dev

# Open Prisma Studio (database UI)
npx prisma studio

# Run linting
npm run lint

# Format code
npm run format
```

### When Changing Database Schema
```bash
# 1. Edit prisma/schema.prisma

# 2. Create migration
npx prisma migrate dev --name descriptive_name

# 3. Generate Prisma Client
npx prisma generate
```

### Before Committing Code
```bash
# 1. Run linter
npm run lint

# 2. Fix any issues
npm run lint:fix

# 3. Format code
npm run format

# 4. Commit with descriptive message
git add .
git commit -m "feat: add machine QR code generation"
```

---

## 🗂️ Project Structure

```
maintaince_management/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   └── register/
│   ├── api/
│   │   ├── auth/
│   │   ├── machines/
│   │   ├── maintenance-requests/
│   │   ├── spare-parts/
│   │   └── ... (all API routes)
│   ├── dashboard/
│   ├── admin/
│   ├── supervisor/
│   ├── technician/
│   ├── manager/
│   └── inventory/
├── components/
│   ├── ui/              # Reusable UI components
│   ├── forms/           # Form components
│   ├── tables/          # Table components
│   ├── charts/          # Chart components
│   ├── qr-scanner/      # QR scanning components
│   └── layouts/         # Layout components
├── lib/
│   ├── prisma.ts        # Prisma client
│   ├── auth.ts          # Auth utilities
│   ├── audit.ts         # Activity logging
│   ├── downtime.ts      # Downtime tracking
│   ├── inventory.ts     # Inventory helpers
│   └── utils.ts         # General utilities
├── prisma/
│   ├── schema.prisma    # Database schema
│   ├── migrations/      # Database migrations
│   └── seed.ts          # Seed data
├── types/
│   └── index.ts         # TypeScript types
├── public/
│   └── uploads/         # Uploaded files
├── docker-compose.yml
├── Dockerfile
├── .env
├── .env.example
├── package.json
└── tsconfig.json
```

---

## 🎨 UI Component Library

Recommended: **shadcn/ui** (built on Radix UI + Tailwind)

### Install shadcn/ui
```bash
npx shadcn-ui@latest init
```

### Add common components
```bash
npx shadcn-ui@latest add button
npx shadcn-ui@latest add input
npx shadcn-ui@latest add form
npx shadcn-ui@latest add table
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add select
npx shadcn-ui@latest add toast
npx shadcn-ui@latest add card
npx shadcn-ui@latest add badge
npx shadcn-ui@latest add alert
```

---

## 🔐 Default Credentials (After Seeding)

```
Admin User:
Email: admin@factory.com
Password: Admin123!

Supervisor:
Email: supervisor@factory.com
Password: Super123!

Technician:
Email: tech@factory.com
Password: Tech123!

Maintenance Manager:
Email: manager@factory.com
Password: Manager123!

Inventory Manager:
Email: inventory@factory.com
Password: Inventory123!
```

---

## 📱 Testing Checklist

### User Authentication
- [ ] Can login with correct credentials
- [ ] Cannot login with wrong credentials
- [ ] Can logout
- [ ] Session persists on refresh
- [ ] Redirects to login when not authenticated

### Machine Management (Admin)
- [ ] Can create new machine
- [ ] Can edit machine details
- [ ] Can delete machine
- [ ] QR code generated automatically
- [ ] Can view machine history

### Problem Reporting (Supervisor)
- [ ] Can scan QR code on mobile
- [ ] Can fill problem description
- [ ] Can select failure code
- [ ] Can select maintenance type
- [ ] Can upload multiple photos
- [ ] Request created successfully

### Maintenance Work (Technician)
- [ ] Can scan QR code
- [ ] Can see machine's active requests
- [ ] Can accept request
- [ ] Can add work steps
- [ ] Can request spare parts
- [ ] Can complete work
- [ ] Downtime tracked automatically

### Spare Parts Flow (All Roles)
- [ ] Technician requests parts
- [ ] Manager sees approval request
- [ ] Manager can approve/reject
- [ ] Inventory manager sees approved requests
- [ ] Inventory manager can issue parts
- [ ] Quantity deducted automatically
- [ ] Transaction recorded

### Inventory Management (Inventory Manager)
- [ ] Can add new spare part
- [ ] Can record stock arrival (IN)
- [ ] Can issue parts (OUT)
- [ ] Can make adjustments
- [ ] Quantity updates automatically
- [ ] Low stock alerts shown
- [ ] Can view reports

---

## 🐛 Common Issues & Solutions

### Database Connection Error
```
Error: Can't reach database server
```
**Solution**: Check if Docker MySQL container is running
```bash
docker-compose ps
docker-compose up -d mysql
```

### Prisma Client Not Found
```
Error: @prisma/client did not initialize yet
```
**Solution**: Regenerate Prisma Client
```bash
npx prisma generate
```

### QR Scanner Not Working
**Solution**: Must use HTTPS or localhost. Camera requires secure context.

### File Upload Not Working
**Solution**: Check upload directory exists and has write permissions
```bash
mkdir -p public/uploads
chmod 755 public/uploads
```

---

## 📚 Useful Resources

### Documentation
- [Next.js 14 Docs](https://nextjs.org/docs)
- [Prisma Docs](https://www.prisma.io/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [shadcn/ui](https://ui.shadcn.com)
- [React Query](https://tanstack.com/query/latest)

### Tutorials
- [Next.js App Router Tutorial](https://nextjs.org/learn)
- [Prisma Getting Started](https://www.prisma.io/docs/getting-started)
- [QR Code Scanning](https://github.com/mebjas/html5-qrcode)

---

## 📞 Support & Communication

### Development Team Channels
- **Daily Standup**: 10:00 AM
- **Code Review**: Pull Requests on GitHub
- **Questions**: Slack #dev-maintenance-app
- **Bug Reports**: GitHub Issues

### Definition of Done
A feature is "done" when:
- ✅ Code written and tested locally
- ✅ Pull request created and reviewed
- ✅ Tests passing (if applicable)
- ✅ Merged to main branch
- ✅ Deployed to staging
- ✅ Tested on staging
- ✅ Documentation updated

---

## 🎯 Sprint Planning Template

### Sprint 1 (Week 1-2): Phase 0
**Goal**: Project foundation ready
- [ ] Initialize Next.js project
- [ ] Set up Docker
- [ ] Create authentication
- [ ] Project structure

### Sprint 2 (Week 3): Phase 1
**Goal**: Database and users working
- [ ] Complete Prisma schema
- [ ] User management
- [ ] Department management
- [ ] RBAC

### Sprint 3-4 (Week 4-5): Phase 2
**Goal**: Machines and QR scanning
- [ ] Machine CRUD
- [ ] QR code generation
- [ ] Supervisor scanner
- [ ] Technician scanner
- [ ] File uploads

### Sprint 5-7 (Week 6-8): Phase 3
**Goal**: Maintenance workflow complete
- [ ] Maintenance requests
- [ ] Maintenance work
- [ ] Spare parts requests
- [ ] Approval flow
- [ ] Dashboards

### Sprint 8-10 (Week 9-11): Phase 4
**Goal**: Inventory system
- [ ] Spare parts management
- [ ] Inventory transactions
- [ ] Machine spare parts
- [ ] Reports

### Sprint 11-13 (Week 12-14): Phase 5
**Goal**: Advanced features
- [ ] Preventive maintenance
- [ ] Failure codes
- [ ] Activity logs
- [ ] Notifications

### Sprint 14-15 (Week 15-16): Phase 6
**Goal**: Analytics and polish
- [ ] Analytics dashboard
- [ ] Reports
- [ ] Optimization
- [ ] Testing

### Sprint 16-17 (Week 17-18): Phase 7
**Goal**: Deploy to production
- [ ] Production setup
- [ ] CI/CD
- [ ] Training
- [ ] Launch

---

**Last Updated**: October 26, 2025  
**Version**: 1.0

