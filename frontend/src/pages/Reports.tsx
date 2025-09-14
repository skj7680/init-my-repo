"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useSelector } from "react-redux"
import {
  Card,
  Row,
  Col,
  Typography,
  DatePicker,
  Select,
  Button,
  Space,
  Statistic,
  Table,
  Spin,
  Tabs,
  Progress,
  message,
} from "antd"
import {
  DownloadOutlined,
  BarChartOutlined,
  FileTextOutlined,
  TrophyOutlined,
  MedicineBoxOutlined,
  DropboxOutlined,
  HomeOutlined,
} from "@ant-design/icons"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import type { ColumnsType } from "antd/es/table"
import dayjs from "dayjs"
import type { RootState } from "../store/store"
import type { SummaryReport, MilkProductionReport, HealthReport } from "../services/reportsAPI"
import { reportsAPI } from "../services/reportsAPI"

const { Title, Text } = Typography
const { RangePicker } = DatePicker
const { Option } = Select
const { TabPane } = Tabs

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"]

const Reports: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth)

  const [loading, setLoading] = useState(false)
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>([dayjs().subtract(30, "day"), dayjs()])
  const [selectedFarm, setSelectedFarm] = useState<number | undefined>()

  // Report data states
  const [summaryReport, setSummaryReport] = useState<SummaryReport | null>(null)
  const [milkReport, setMilkReport] = useState<MilkProductionReport | null>(null)
  const [healthReport, setHealthReport] = useState<HealthReport | null>(null)
  const [alertsData, setAlertsData] = useState<any[]>([])

  useEffect(() => {
    loadReports()
  }, [])

  const loadReports = async () => {
    setLoading(true)
    try {
      const params = {
        start_date: dateRange?.[0]?.format("YYYY-MM-DD"),
        end_date: dateRange?.[1]?.format("YYYY-MM-DD"),
        farm_id: selectedFarm,
      }

      const [summary, milk, health, alerts] = await Promise.all([
        reportsAPI.getSummaryReport(params),
        reportsAPI.getMilkProductionReport(params),
        reportsAPI.getHealthReport(params),
        reportsAPI.getAlertsReport(params),
      ])

      setSummaryReport(summary)
      setMilkReport(milk)
      setHealthReport(health)
      setAlertsData(alerts)
    } catch (error) {
      message.error("Failed to load reports")
      console.error("Reports error:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async (reportType: string) => {
    try {
      const params = {
        start_date: dateRange?.[0]?.format("YYYY-MM-DD"),
        end_date: dateRange?.[1]?.format("YYYY-MM-DD"),
        farm_id: selectedFarm,
        format: "csv" as const,
      }

      const blob = await reportsAPI.exportReport(reportType, params)
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `${reportType}-report-${dayjs().format("YYYY-MM-DD")}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      message.success("Report exported successfully")
    } catch (error) {
      message.error("Failed to export report")
    }
  }

  const topPerformersColumns: ColumnsType<any> = [
    {
      title: "Rank",
      key: "rank",
      render: (_, __, index) => index + 1,
      width: 60,
    },
    {
      title: "Animal",
      dataIndex: "tag_number",
      key: "tag_number",
    },
    {
      title: "Total Yield (L)",
      dataIndex: "total_yield",
      key: "total_yield",
      render: (yield_val) => yield_val.toFixed(2),
    },
  ]

  const alertsColumns: ColumnsType<any> = [
    {
      title: "Animal",
      dataIndex: "animal_tag",
      key: "animal_tag",
    },
    {
      title: "Alert Type",
      dataIndex: "alert_type",
      key: "alert_type",
    },
    {
      title: "Severity",
      dataIndex: "severity",
      key: "severity",
      render: (severity) => (
        <span
          className={`px-2 py-1 rounded text-xs ${
            severity === "high"
              ? "bg-red-100 text-red-800"
              : severity === "medium"
                ? "bg-yellow-100 text-yellow-800"
                : "bg-green-100 text-green-800"
          }`}
        >
          {severity.toUpperCase()}
        </span>
      ),
    },
    {
      title: "Date",
      dataIndex: "created_at",
      key: "created_at",
      render: (date) => dayjs(date).format("YYYY-MM-DD"),
    },
  ]

  const severityData = healthReport
    ? [
        { name: "Low", value: healthReport.severity_breakdown.low, color: "#52c41a" },
        { name: "Medium", value: healthReport.severity_breakdown.medium, color: "#faad14" },
        { name: "High", value: healthReport.severity_breakdown.high, color: "#f5222d" },
      ]
    : []

  const diseaseData = healthReport?.common_diseases.map((disease, index) => ({
    ...disease,
    color: COLORS[index % COLORS.length],
  }))

  if (loading && !summaryReport) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spin size="large" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Title level={2}>Reports & Analytics</Title>
        <Space>
          <Button icon={<DownloadOutlined />} onClick={() => handleExport("summary")}>
            Export Summary
          </Button>
          <Button icon={<DownloadOutlined />} onClick={() => handleExport("milk-production")}>
            Export Milk Data
          </Button>
        </Space>
      </div>

      {/* Filters */}
      <Card>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} lg={8}>
            <Text strong>Date Range:</Text>
            <RangePicker
              value={dateRange}
              onChange={(dates) => {
                if (dates && dates[0] && dates[1]) {
                  setDateRange([dates[0], dates[1]])
                } else {
                  setDateRange(null)
                }
              }}
              className="w-full mt-2"
              placeholder={["Start Date", "End Date"]}
            />
          </Col>
          {user?.role === "admin" && (
            <Col xs={24} sm={12} lg={8}>
              <Text strong>Farm:</Text>
              <Select
                placeholder="All Farms"
                allowClear
                value={selectedFarm}
                onChange={setSelectedFarm}
                className="w-full mt-2"
              >
                <Option value={1}>Farm 1</Option>
                <Option value={2}>Farm 2</Option>
              </Select>
            </Col>
          )}
          <Col xs={24} sm={12} lg={8}>
            <Button type="primary" onClick={loadReports} loading={loading} className="mt-6">
              Generate Reports
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Summary Statistics */}
      {summaryReport && (
        <Row gutter={[16, 16]}>
          <Col xs={12} sm={8} lg={4}>
            <Card>
              <Statistic
                title="Animals"
                value={summaryReport.total_animals}
                prefix={<BarChartOutlined className="text-blue-500" />}
              />
            </Card>
          </Col>
          <Col xs={12} sm={8} lg={4}>
            <Card>
              <Statistic
                title="Farms"
                value={summaryReport.total_farms}
                prefix={<HomeOutlined className="text-green-500" />}
              />
            </Card>
          </Col>
          <Col xs={12} sm={8} lg={4}>
            <Card>
              <Statistic
                title="Milk Records"
                value={summaryReport.total_milk_records}
                prefix={<DropboxOutlined className="text-yellow-500" />}
              />
            </Card>
          </Col>
          <Col xs={12} sm={8} lg={4}>
            <Card>
              <Statistic
                title="Health Records"
                value={summaryReport.total_diseases}
                prefix={<MedicineBoxOutlined className="text-red-500" />}
              />
            </Card>
          </Col>
          <Col xs={12} sm={8} lg={4}>
            <Card>
              <Statistic
                title="Avg Daily Yield"
                value={summaryReport.avg_daily_yield}
                precision={2}
                suffix="L"
                prefix={<TrophyOutlined className="text-orange-500" />}
              />
            </Card>
          </Col>
          <Col xs={12} sm={8} lg={4}>
            <Card>
              <Statistic
                title="Active Alerts"
                value={summaryReport.active_alerts}
                prefix={<FileTextOutlined className="text-purple-500" />}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* Detailed Reports */}
      <Tabs defaultActiveKey="milk">
        <TabPane tab="Milk Production" key="milk">
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={16}>
              <Card title="Production Overview" loading={loading}>
                {milkReport && (
                  <div className="space-y-4">
                    <Row gutter={[16, 16]}>
                      <Col span={8}>
                        <Statistic title="Total Yield" value={milkReport.total_yield} precision={2} suffix="L" />
                      </Col>
                      <Col span={8}>
                        <Statistic title="Average Yield" value={milkReport.average_yield} precision={2} suffix="L" />
                      </Col>
                      <Col span={8}>
                        <Statistic title="Records Count" value={milkReport.records_count} />
                      </Col>
                    </Row>
                    <div className="mt-4">
                      <Text strong>Performance Target (25L daily)</Text>
                      <Progress
                        percent={Math.min((milkReport.average_yield / 25) * 100, 100)}
                        status={milkReport.average_yield >= 25 ? "success" : "active"}
                      />
                    </div>
                  </div>
                )}
              </Card>
            </Col>
            <Col xs={24} lg={8}>
              <Card title="Top Performers" loading={loading}>
                {milkReport && (
                  <Table
                    columns={topPerformersColumns}
                    dataSource={milkReport.top_performers}
                    pagination={false}
                    size="small"
                    rowKey="animal_id"
                  />
                )}
              </Card>
            </Col>
          </Row>
        </TabPane>

        <TabPane tab="Health Analytics" key="health">
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
              <Card title="Health Overview" loading={loading}>
                {healthReport && (
                  <Row gutter={[16, 16]}>
                    <Col span={8}>
                      <Statistic title="Total Cases" value={healthReport.total_cases} />
                    </Col>
                    <Col span={8}>
                      <Statistic title="Active Cases" value={healthReport.active_cases} />
                    </Col>
                    <Col span={8}>
                      <Statistic title="Recovered" value={healthReport.recovered_cases} />
                    </Col>
                  </Row>
                )}
              </Card>
            </Col>
            <Col xs={24} lg={12}>
              <Card title="Severity Distribution" loading={loading}>
                {severityData.length > 0 && (
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={severityData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {severityData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </Card>
            </Col>
            <Col xs={24}>
              <Card title="Common Diseases" loading={loading}>
                {diseaseData && diseaseData.length > 0 && (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={diseaseData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="disease_name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </Card>
            </Col>
          </Row>
        </TabPane>

        <TabPane tab="Alerts" key="alerts">
          <Card title="Recent Alerts" loading={loading}>
            <Table
              columns={alertsColumns}
              dataSource={alertsData}
              rowKey="id"
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} alerts`,
              }}
            />
          </Card>
        </TabPane>
      </Tabs>
    </div>
  )
}

export default Reports
