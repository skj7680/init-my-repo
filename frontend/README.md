# Cattle Prediction Platform - Frontend

A modern React TypeScript frontend for the AI-powered cattle milk-yield & health prediction platform.

## 🚀 Features

- **Modern Tech Stack**: React 18, TypeScript, Vite, Redux Toolkit
- **UI Components**: Ant Design with Tailwind CSS for styling
- **Authentication**: JWT-based auth with role-based access control
- **Real-time Dashboard**: Interactive charts and statistics
- **Animal Management**: Complete CRUD operations for cattle records
- **Milk Production Tracking**: Daily yield recording and analytics
- **Health Records**: Disease tracking and management
- **AI Predictions**: Milk yield and disease risk predictions
- **Reports & Analytics**: Comprehensive reporting with data visualization
- **Responsive Design**: Mobile-first approach with responsive layouts

## 📋 Prerequisites

- Node.js 18+ and npm/yarn
- Backend API running on `http://localhost:8000`

## 🛠️ Installation

1. **Navigate to frontend directory**:
   \`\`\`bash
   cd frontend
   \`\`\`

2. **Install dependencies**:
   \`\`\`bash
   npm install
   # or
   yarn install
   \`\`\`

3. **Environment Setup**:
   Create a `.env` file in the frontend directory:
   \`\`\`env
   VITE_API_BASE_URL=http://localhost:8000
   \`\`\`

4. **Start development server**:
   \`\`\`bash
   npm run dev
   # or
   yarn dev
   \`\`\`

5. **Access the application**:
   Open [http://localhost:3000](http://localhost:3000) in your browser

## 🏗️ Project Structure

\`\`\`
frontend/
├── public/                 # Static assets
├── src/
│   ├── components/        # Reusable UI components
│   │   ├── Auth/         # Authentication components
│   │   └── Layout/       # Layout components
│   ├── pages/            # Page components
│   │   ├── Login.tsx     # Login page
│   │   ├── Register.tsx  # Registration page
│   │   ├── Dashboard.tsx # Main dashboard
│   │   ├── Animals.tsx   # Animal management
│   │   ├── Farms.tsx     # Farm management
│   │   ├── MilkRecords.tsx # Milk production tracking
│   │   ├── Diseases.tsx  # Health records
│   │   ├── Predictions.tsx # AI predictions
│   │   └── Reports.tsx   # Analytics and reports
│   ├── services/         # API service layer
│   │   ├── api.ts        # Axios configuration
│   │   ├── authAPI.ts    # Authentication APIs
│   │   ├── animalsAPI.ts # Animal management APIs
│   │   ├── farmsAPI.ts   # Farm management APIs
│   │   ├── milkRecordsAPI.ts # Milk records APIs
│   │   ├── diseasesAPI.ts # Disease records APIs
│   │   ├── predictionsAPI.ts # Prediction APIs
│   │   └── reportsAPI.ts # Reports APIs
│   ├── store/            # Redux store
│   │   ├── store.ts      # Store configuration
│   │   └── slices/       # Redux slices
│   ├── types/            # TypeScript type definitions
│   ├── App.tsx           # Main app component
│   └── main.tsx          # App entry point
├── package.json          # Dependencies and scripts
├── vite.config.ts        # Vite configuration
├── tailwind.config.js    # Tailwind CSS configuration
└── tsconfig.json         # TypeScript configuration
\`\`\`

## 🔐 Authentication & Authorization

The frontend implements role-based access control with three user roles:

- **Farmer**: Manage own animals, milk records, and view predictions
- **Veterinarian**: Access health records across farms, manage diseases
- **Administrator**: Full system access, user management, farm oversight

### Login Credentials (Development)
Use the backend's user creation script to generate test users, or register through the UI.

## 📊 Key Features

### Dashboard
- Real-time statistics and KPIs
- Milk production trends (last 30 days)
- Quick action buttons
- Role-based content display

### Animal Management
- Complete CRUD operations
- Advanced filtering (breed, status, search)
- Pagination and sorting
- Bulk operations support

### Milk Production Tracking
- Daily yield recording (morning/evening)
- Quality metrics (fat/protein content)
- Animal-specific filtering
- Date range analysis

### Health Records
- Disease tracking and management
- Severity classification (low/medium/high)
- Treatment recording
- Recovery status tracking

### AI Predictions
- Single animal predictions
- Batch prediction support
- Confidence level indicators
- Risk assessment visualization

### Reports & Analytics
- Summary reports with KPIs
- Milk production analytics
- Health trend analysis
- Data export (CSV format)
- Interactive charts and visualizations

## 🎨 UI/UX Features

- **Responsive Design**: Mobile-first approach with breakpoint optimization
- **Dark/Light Theme**: Consistent theming with Ant Design
- **Interactive Charts**: Recharts integration for data visualization
- **Loading States**: Skeleton loading and spinners
- **Error Handling**: User-friendly error messages and retry mechanisms
- **Form Validation**: Real-time validation with helpful error messages

## 🔧 Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Code Style

- **TypeScript**: Strict mode enabled
- **ESLint**: Configured for React and TypeScript
- **Prettier**: Code formatting (if configured)

### State Management

The application uses Redux Toolkit for state management with the following slices:

- `authSlice` - Authentication state
- `animalsSlice` - Animal management
- `farmsSlice` - Farm management
- `milkRecordsSlice` - Milk production data
- `diseasesSlice` - Health records
- `predictionsSlice` - AI predictions

## 🚀 Production Deployment

1. **Build the application**:
   \`\`\`bash
   npm run build
   \`\`\`

2. **Deploy the `dist` folder** to your web server or CDN

3. **Configure environment variables** for production API endpoints

4. **Set up reverse proxy** (nginx/Apache) for API routing if needed

## 🔗 API Integration

The frontend communicates with the FastAPI backend through RESTful APIs:

- **Base URL**: `http://localhost:8000` (development)
- **Authentication**: JWT Bearer tokens
- **Request/Response**: JSON format
- **Error Handling**: Standardized error responses

### API Endpoints Used

- `POST /auth/login` - User authentication
- `GET /auth/me` - Get current user
- `GET /animals` - List animals with pagination
- `POST /animals` - Create new animal
- `GET /milk-records` - List milk records
- `POST /predictions/milk-yield/{animal_id}` - Generate milk yield prediction
- `GET /reports/summary` - Get summary report

## 🐛 Troubleshooting

### Common Issues

1. **API Connection Failed**
   - Ensure backend is running on `http://localhost:8000`
   - Check CORS configuration in backend
   - Verify environment variables

2. **Authentication Issues**
   - Clear localStorage and cookies
   - Check token expiration
   - Verify user permissions

3. **Build Errors**
   - Clear node_modules and reinstall
   - Check TypeScript errors
   - Verify all imports

## 📝 Contributing

1. Follow the existing code structure and naming conventions
2. Add TypeScript types for new features
3. Include proper error handling
4. Test responsive design on multiple screen sizes
5. Update documentation for new features

## 📄 License

This project is part of the Cattle Prediction Platform and follows the same licensing terms as the main project.
