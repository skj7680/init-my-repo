"use client"

import { Button } from "@/components/ui/button"

import type React from "react"
import { useEffect, useState } from "react"
import { useSelector } from "react-redux"
import { Row, Col, Card, Statistic, Typography, Alert, Spin, Progress } from "antd"
import {
  UserOutlined,
  HomeOutlined,
  DropboxOutlined,
  MedicineBoxOutlined,
  TrophyOutlined,
  WarningOutlined,
} from "@ant-design/icons"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import type { RootState } from "../store/store"
import { api } from "../services/api"

const { Title, Text } = Typography

interface DashboardStats {
  total_animals: number
  total_farms: number
  total_milk_records: number
  total_diseases: number
  avg_daily_yield: number
  active_alerts: number
}

interface MilkTrend {
  date: string
  yield: number
}

const Dashboard: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [milkTrends, setMilkTrends] = useState<MilkTrend[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      // Fetch dashboard statistics
      const [statsResponse, trendsResponse] = await Promise.all([
        api.get("/reports/summary"),
        api.get("/milk-records/trends?days=30"),
      ])

      setStats(statsResponse.data)
      setMilkTrends(trendsResponse.data)
    } catch (err) {
      setError("Failed to load dashboard data")
      console.error("Dashboard error:", err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spin size="large" />
      </div>
    )
  }

  if (error) {
    return <Alert message="Error" description={error} type="error" showIcon />
  }

  const getRoleBasedGreeting = () => {
    switch (user?.role) {
      case "farmer":
        return "Manage your farm and track your cattle's health and productivity."
      case "vet":
        return "Monitor animal health across multiple farms and provide expert care."
      case "admin":
        return "Oversee the entire platform and manage system-wide operations."
      default:
        return "Welcome to the Cattle Prediction Platform."
    }
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div>
        <Title level={2}>Dashboard</Title>
        <Text type="secondary">{getRoleBasedGreeting()}</Text>
      </div>

      {/* Statistics Cards */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Animals"
              value={stats?.total_animals || 0}
              prefix={<UserOutlined className="text-blue-500" />}
            />
          </Card>
        </Col>
        {(user?.role === "farmer" || user?.role === "admin") && (
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Total Farms"
                value={stats?.total_farms || 0}
                prefix={<HomeOutlined className="text-green-500" />}
              />
            </Card>
          </Col>
        )}
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Milk Records"
              value={stats?.total_milk_records || 0}
              prefix={<DropboxOutlined className="text-yellow-500" />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Health Records"
              value={stats?.total_diseases || 0}
              prefix={<MedicineBoxOutlined className="text-red-500" />}
            />
          </Card>
        </Col>
      </Row>

      {/* Performance Metrics */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card>
            <Statistic
              title="Average Daily Yield"
              value={stats?.avg_daily_yield || 0}
              precision={2}
              suffix="L"
              prefix={<TrophyOutlined className="text-orange-500" />}
            />
            <div className="mt-4">
              <Text type="secondary">Performance compared to target (25L)</Text>
              <Progress
                percent={Math.min(((stats?.avg_daily_yield || 0) / 25) * 100, 100)}
                status={stats?.avg_daily_yield && stats.avg_daily_yield >= 25 ? "success" : "active"}
              />
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card>
            <Statistic
              title="Active Alerts"
              value={stats?.active_alerts || 0}
              prefix={<WarningOutlined className="text-red-500" />}
            />
            <div className="mt-4">
              <Text type="secondary">{stats?.active_alerts === 0 ? "All systems normal" : "Requires attention"}</Text>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Charts */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card title="Milk Production Trends (Last 30 Days)">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={milkTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="yield" stroke="#0ea5e9" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="Quick Actions">
            <div className="space-y-4">
              <Button variant="primary" block onClick={() => (window.location.href = "/animals")}>
                Add New Animal
              </Button>
              <Button block onClick={() => (window.location.href = "/milk-records")}>
                Record Milk Production
              </Button>
              <Button block onClick={() => (window.location.href = "/predictions")}>
                View Predictions
              </Button>
              <Button block onClick={() => (window.location.href = "/reports")}>
                Generate Report
              </Button>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default Dashboard
