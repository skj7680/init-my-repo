import React, { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { Layout, Spin } from 'antd'
import type { RootState, AppDispatch } from './store/store'
import { getCurrentUser } from './store/slices/authSlice'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Animals from './pages/Animals'
import Farms from './pages/Farms'
import MilkRecords from './pages/MilkRecords'
import Diseases from './pages/Diseases'
import Predictions from './pages/Predictions'
import Reports from './pages/Reports'
import MainLayout from './components/Layout/MainLayout'
import ProtectedRoute from './components/Auth/ProtectedRoute'

const App: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>()
  const { user, isLoading } = useSelector((state: RootState) => state.auth)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      dispatch(getCurrentUser())
    }
  }, [dispatch])

  if (isLoading) {
    return (
      <Layout className="min-h-screen flex items-center justify-center">
        <Spin size="large" />
      </Layout>
    )
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <Register />} />
      <Route path="/" element={<Navigate to="/dashboard" />} />

      <Route
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/animals" element={<Animals />} />
        <Route path="/farms" element={<Farms />} />
        <Route path="/milk-records" element={<MilkRecords />} />
        <Route path="/diseases" element={<Diseases />} />
        <Route path="/predictions" element={<Predictions />} />
        <Route path="/reports" element={<Reports />} />
      </Route>
    </Routes>
  )
}

export default App