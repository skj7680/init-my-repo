import type React from "react"
import { useSelector } from "react-redux"
import { Navigate } from "react-router-dom"
import type { RootState } from "../../store/store"

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: "farmer" | "vet" | "admin"
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole }) => {
  const { user, token } = useSelector((state: RootState) => state.auth)

  if (!token || !user) {
    return <Navigate to="/login" replace />
  }

  if (requiredRole && user.role !== requiredRole && user.role !== "admin") {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}

export default ProtectedRoute
