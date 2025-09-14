# Frontend Setup Guide

This guide provides detailed instructions for setting up the Cattle Prediction Platform frontend.

## Prerequisites

- Node.js 18.0 or higher
- npm 8.0 or higher (or yarn 1.22+)
- Backend API running (see backend setup guide)

## Quick Start

1. **Clone and navigate to frontend**:
   \`\`\`bash
   cd frontend
   \`\`\`

2. **Install dependencies**:
   \`\`\`bash
   npm install
   \`\`\`

3. **Start development server**:
   \`\`\`bash
   npm run dev
   \`\`\`

4. **Open browser**: Navigate to `http://localhost:3000`

## Environment Configuration

Create a `.env` file in the frontend directory:

\`\`\`env
# API Configuration
VITE_API_BASE_URL=http://localhost:8000

# Optional: Enable development features
VITE_DEV_MODE=true
\`\`\`

## Development Workflow

### 1. Project Structure Overview

\`\`\`
src/
├── components/     # Reusable UI components
├── pages/         # Route components
├── services/      # API integration
├── store/         # Redux state management
├── types/         # TypeScript definitions
└── styles/        # Global styles
\`\`\`

### 2. Adding New Features

1. **Create API service** in `src/services/`
2. **Add Redux slice** in `src/store/slices/`
3. **Create page component** in `src/pages/`
4. **Add route** in `src/App.tsx`
5. **Update navigation** in `src/components/Layout/MainLayout.tsx`

### 3. State Management

The app uses Redux Toolkit with the following pattern:

\`\`\`typescript
// 1. Define API service
export const newFeatureAPI = {
  getData: async (): Promise<DataType> => {
    const response = await api.get('/new-feature')
    return response.data
  }
}

// 2. Create Redux slice
export const fetchData = createAsyncThunk(
  'newFeature/fetchData',
  async () => {
    return await newFeatureAPI.getData()
  }
)

// 3. Use in component
const { data, loading } = useSelector((state: RootState) => state.newFeature)
const dispatch = useDispatch<AppDispatch>()

useEffect(() => {
  dispatch(fetchData())
}, [dispatch])
\`\`\`

## Building for Production

1. **Build the application**:
   \`\`\`bash
   npm run build
   \`\`\`

2. **Preview production build**:
   \`\`\`bash
   npm run preview
   \`\`\`

3. **Deploy `dist` folder** to your web server

## Troubleshooting

### Common Development Issues

1. **Port already in use**:
   \`\`\`bash
   # Kill process on port 3000
   lsof -ti:3000 | xargs kill -9
   \`\`\`

2. **Module not found errors**:
   \`\`\`bash
   # Clear node_modules and reinstall
   rm -rf node_modules package-lock.json
   npm install
   \`\`\`

3. **TypeScript errors**:
   \`\`\`bash
   # Check TypeScript configuration
   npx tsc --noEmit
   \`\`\`

### API Connection Issues

1. **CORS errors**: Ensure backend CORS is configured for `http://localhost:3000`
2. **Network errors**: Verify backend is running on `http://localhost:8000`
3. **Authentication errors**: Check JWT token storage and expiration

## Performance Optimization

### Code Splitting

The app uses React.lazy for route-based code splitting:

\`\`\`typescript
const LazyComponent = React.lazy(() => import('./components/LazyComponent'))

// Wrap with Suspense
<Suspense fallback={<Spin size="large" />}>
  <LazyComponent />
</Suspense>
\`\`\`

### Bundle Analysis

\`\`\`bash
# Analyze bundle size
npm run build
npx vite-bundle-analyzer dist
\`\`\`

## Testing

### Unit Testing (Future Enhancement)

\`\`\`bash
# Install testing dependencies
npm install --save-dev @testing-library/react @testing-library/jest-dom vitest

# Run tests
npm run test
\`\`\`

### E2E Testing (Future Enhancement)

\`\`\`bash
# Install Playwright
npm install --save-dev @playwright/test

# Run E2E tests
npm run test:e2e
\`\`\`

## Deployment Options

### 1. Static Hosting (Vercel, Netlify)

\`\`\`bash
# Build for production
npm run build

# Deploy dist folder
\`\`\`

### 2. Docker Deployment

\`\`\`dockerfile
FROM node:18-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
\`\`\`

### 3. Server Deployment

\`\`\`bash
# Build application
npm run build

# Copy dist folder to web server
scp -r dist/ user@server:/var/www/cattle-platform/

# Configure nginx/apache to serve static files
\`\`\`

## Advanced Configuration

### Custom Webpack Configuration

If you need to customize the build process, you can extend Vite configuration:

\`\`\`typescript
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          antd: ['antd'],
          charts: ['recharts']
        }
      }
    }
  }
})
\`\`\`

### Environment-Specific Builds

\`\`\`bash
# Development build
VITE_ENV=development npm run build

# Staging build
VITE_ENV=staging npm run build

# Production build
VITE_ENV=production npm run build
\`\`\`

## Security Considerations

1. **Environment Variables**: Never expose sensitive data in VITE_ variables
2. **API Keys**: Store sensitive keys on the backend only
3. **Authentication**: Implement proper token refresh logic
4. **HTTPS**: Always use HTTPS in production
5. **CSP Headers**: Configure Content Security Policy headers

## Monitoring and Analytics

### Error Tracking

\`\`\`typescript
// Add error boundary for production
import { ErrorBoundary } from 'react-error-boundary'

function ErrorFallback({error}: {error: Error}) {
  return (
    <div role="alert">
      <h2>Something went wrong:</h2>
      <pre>{error.message}</pre>
    </div>
  )
}

// Wrap app with error boundary
<ErrorBoundary FallbackComponent={ErrorFallback}>
  <App />
</ErrorBoundary>
\`\`\`

### Performance Monitoring

\`\`\`typescript
// Add performance monitoring
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals'

getCLS(console.log)
getFID(console.log)
getFCP(console.log)
getLCP(console.log)
getTTFB(console.log)
\`\`\`

## Support

For technical support or questions:

1. Check the troubleshooting section above
2. Review the backend API documentation
3. Check browser console for error messages
4. Verify network requests in browser dev tools
