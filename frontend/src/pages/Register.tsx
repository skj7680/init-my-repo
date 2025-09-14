"use client"

import type React from "react"
import { useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useDispatch, useSelector } from "react-redux"
import { Form, Input, Button, Card, Typography, Alert, Row, Col, Select, message } from "antd"
import { UserOutlined, LockOutlined, MailOutlined } from "@ant-design/icons"
import type { AppDispatch, RootState } from "../store/store"
import { register, clearError } from "../store/slices/authSlice"

const { Title, Text } = Typography
const { Option } = Select

const Register: React.FC = () => {
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

  const onFinish = async (values: {
    email: string
    password: string
    full_name: string
    role: "farmer" | "vet" | "admin"
    farm_id?: number
  }) => {
    try {
      await dispatch(register(values)).unwrap()
      message.success("Registration successful! Please login to continue.")
      navigate("/login")
    } catch (error) {
      console.error("Registration failed:", error)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Row justify="center" className="w-full">
        <Col xs={24} sm={20} md={16} lg={12} xl={10}>
          <Card className="shadow-lg border-0">
            <div className="text-center mb-8">
              <Title level={2} className="text-primary-600 mb-2">
                Create Account
              </Title>
              <Text type="secondary">Join the Cattle Prediction Platform</Text>
            </div>

            {error && <Alert message={error} type="error" className="mb-4" closable />}

            <Form form={form} name="register" onFinish={onFinish} layout="vertical" size="large">
              <Form.Item
                name="full_name"
                label="Full Name"
                rules={[{ required: true, message: "Please input your full name!" }]}
              >
                <Input prefix={<UserOutlined />} placeholder="Enter your full name" />
              </Form.Item>

              <Form.Item
                name="email"
                label="Email"
                rules={[
                  { required: true, message: "Please input your email!" },
                  { type: "email", message: "Please enter a valid email!" },
                ]}
              >
                <Input prefix={<MailOutlined />} placeholder="Enter your email" />
              </Form.Item>

              <Form.Item
                name="password"
                label="Password"
                rules={[
                  { required: true, message: "Please input your password!" },
                  { min: 6, message: "Password must be at least 6 characters!" },
                ]}
              >
                <Input.Password prefix={<LockOutlined />} placeholder="Enter your password" />
              </Form.Item>

              <Form.Item
                name="confirm_password"
                label="Confirm Password"
                dependencies={["password"]}
                rules={[
                  { required: true, message: "Please confirm your password!" },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue("password") === value) {
                        return Promise.resolve()
                      }
                      return Promise.reject(new Error("The two passwords do not match!"))
                    },
                  }),
                ]}
              >
                <Input.Password prefix={<LockOutlined />} placeholder="Confirm your password" />
              </Form.Item>

              <Form.Item name="role" label="Role" rules={[{ required: true, message: "Please select your role!" }]}>
                <Select placeholder="Select your role">
                  <Option value="farmer">Farmer</Option>
                  <Option value="vet">Veterinarian</Option>
                  <Option value="admin">Administrator</Option>
                </Select>
              </Form.Item>

              <Form.Item>
                <Button type="primary" htmlType="submit" className="w-full" loading={isLoading}>
                  Create Account
                </Button>
              </Form.Item>
            </Form>

            <div className="text-center">
              <Text type="secondary">
                Already have an account?{" "}
                <Link to="/login" className="text-primary-600 hover:text-primary-700">
                  Sign in
                </Link>
              </Text>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default Register
