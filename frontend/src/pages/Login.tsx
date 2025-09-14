"use client"

import type React from "react"
import { useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useDispatch, useSelector } from "react-redux"
import { Form, Input, Button, Card, Typography, Alert, Row, Col } from "antd"
import { UserOutlined, LockOutlined } from "@ant-design/icons"
import type { AppDispatch, RootState } from "../store/store"
import { login, clearError } from "../store/slices/authSlice"

const { Title, Text } = Typography

const Login: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>()
  const navigate = useNavigate()
  const { isLoading, error, user } = useSelector((state: RootState) => state.auth)
  const [form] = Form.useForm()

  useEffect(() => {
    if (user) {
      navigate("/dashboard")
    }
  }, [user, navigate])

  useEffect(() => {
    return () => {
      dispatch(clearError())
    }
  }, [dispatch])

  const onFinish = async (values: { email: string; password: string }) => {
    try {
      await dispatch(login(values)).unwrap()
      navigate("/dashboard")
    } catch (error) {
      console.error("Login failed:", error)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Row justify="center" className="w-full">
        <Col xs={24} sm={20} md={16} lg={12} xl={8}>
          <Card className="shadow-lg border-0">
            <div className="text-center mb-8">
              <Title level={2} className="text-primary-600 mb-2">
                Cattle Prediction Platform
              </Title>
              <Text type="secondary">Sign in to your account</Text>
            </div>

            {error && <Alert message={error} type="error" className="mb-4" closable />}

            <Form form={form} name="login" onFinish={onFinish} layout="vertical" size="large">
              <Form.Item
                name="email"
                label="Email"
                rules={[
                  { required: true, message: "Please input your email!" },
                  { type: "email", message: "Please enter a valid email!" },
                ]}
              >
                <Input prefix={<UserOutlined />} placeholder="Enter your email" />
              </Form.Item>

              <Form.Item
                name="password"
                label="Password"
                rules={[{ required: true, message: "Please input your password!" }]}
              >
                <Input.Password prefix={<LockOutlined />} placeholder="Enter your password" />
              </Form.Item>

              <Form.Item>
                <Button type="primary" htmlType="submit" className="w-full" loading={isLoading}>
                  Sign In
                </Button>
              </Form.Item>
            </Form>

            <div className="text-center">
              <Text type="secondary">
                Don't have an account?{" "}
                <Link to="/register" className="text-primary-600 hover:text-primary-700">
                  Sign up
                </Link>
              </Text>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default Login
