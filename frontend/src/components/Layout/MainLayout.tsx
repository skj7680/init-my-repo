"use client"

import type React from "react"
import { useState } from "react"
import { Outlet, useNavigate, useLocation } from "react-router-dom"
import { useDispatch, useSelector } from "react-redux"
import { Layout, Menu, Avatar, Dropdown, Typography, Button, Space } from "antd"
import {
  DashboardOutlined,
  UserOutlined,
  HomeOutlined,
  DropboxOutlined,
  MedicineBoxOutlined,
  BarChartOutlined,
  FileTextOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from "@ant-design/icons"
import type { AppDispatch, RootState } from "../../store/store"
import { logout } from "../../store/slices/authSlice"

const { Header, Sider, Content } = Layout
const { Text } = Typography

const MainLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false)
  const dispatch = useDispatch<AppDispatch>()
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useSelector((state: RootState) => state.auth)

  const handleLogout = () => {
    dispatch(logout())
    navigate("/login")
  }

  const menuItems = [
    {
      key: "/dashboard",
      icon: <DashboardOutlined />,
      label: "Dashboard",
    },
    {
      key: "/animals",
      icon: <UserOutlined />,
      label: "Animals",
    },
    ...(user?.role === "farmer" || user?.role === "admin"
      ? [
          {
            key: "/farms",
            icon: <HomeOutlined />,
            label: "Farms",
          },
        ]
      : []),
    {
      key: "/milk-records",
      icon: <DropboxOutlined />,
      label: "Milk Records",
    },
    {
      key: "/diseases",
      icon: <MedicineBoxOutlined />,
      label: "Health Records",
    },
    {
      key: "/predictions",
      icon: <BarChartOutlined />,
      label: "Predictions",
    },
    {
      key: "/reports",
      icon: <FileTextOutlined />,
      label: "Reports",
    },
  ]

  const userMenuItems = [
    {
      key: "profile",
      icon: <UserOutlined />,
      label: "Profile",
    },
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: "Logout",
      onClick: handleLogout,
    },
  ]

  return (
    <Layout className="min-h-screen">
      <Sider trigger={null} collapsible collapsed={collapsed} className="bg-white shadow-md">
        <div className="p-4 text-center border-b">
          <Text strong className="text-primary-600">
            {collapsed ? "CP" : "Cattle Platform"}
          </Text>
        </div>
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          className="border-r-0"
        />
      </Sider>

      <Layout>
        <Header className="bg-white shadow-sm px-4 flex items-center justify-between">
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            className="text-lg"
          />

          <Space>
            <Text type="secondary">Welcome, {user?.full_name}</Text>
            <Dropdown
              menu={{
                items: userMenuItems,
              }}
              placement="bottomRight"
            >
              <Avatar icon={<UserOutlined />} className="cursor-pointer bg-primary-500" />
            </Dropdown>
          </Space>
        </Header>

        <Content className="p-6 bg-gray-50">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}

export default MainLayout
