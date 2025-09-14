"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import {
  Table,
  Button,
  Space,
  Typography,
  Card,
  Modal,
  Form,
  Input,
  InputNumber,
  message,
  Popconfirm,
  Statistic,
  Row,
  Col,
} from "antd"
import { PlusOutlined, EditOutlined, DeleteOutlined, HomeOutlined } from "@ant-design/icons"
import type { ColumnsType } from "antd/es/table"
import dayjs from "dayjs"
import type { AppDispatch, RootState } from "../store/store"
import type { Farm } from "../types"
import { fetchFarms, createFarm, updateFarm, deleteFarm, clearError } from "../store/slices/farmsSlice"

const { Title } = Typography

const Farms: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>()
  const { farms, total, page, size, isLoading, error } = useSelector((state: RootState) => state.farms)
  const { user } = useSelector((state: RootState) => state.auth)

  const [isModalVisible, setIsModalVisible] = useState(false)
  const [editingFarm, setEditingFarm] = useState<Farm | null>(null)
  const [form] = Form.useForm()

  useEffect(() => {
    if (user?.role === "admin" || user?.role === "farmer") {
      dispatch(fetchFarms({ page, size }))
    }
  }, [dispatch, page, size, user])

  useEffect(() => {
    if (error) {
      message.error(error)
      dispatch(clearError())
    }
  }, [error, dispatch])

  const handleCreate = () => {
    setEditingFarm(null)
    form.resetFields()
    setIsModalVisible(true)
  }

  const handleEdit = (farm: Farm) => {
    setEditingFarm(farm)
    form.setFieldsValue(farm)
    setIsModalVisible(true)
  }

  const handleDelete = async (id: number) => {
    try {
      await dispatch(deleteFarm(id)).unwrap()
      message.success("Farm deleted successfully")
    } catch (error) {
      message.error("Failed to delete farm")
    }
  }

  const handleSubmit = async (values: any) => {
    try {
      if (editingFarm) {
        await dispatch(updateFarm({ id: editingFarm.id, data: values })).unwrap()
        message.success("Farm updated successfully")
      } else {
        await dispatch(createFarm(values)).unwrap()
        message.success("Farm created successfully")
      }

      setIsModalVisible(false)
      form.resetFields()
    } catch (error) {
      message.error(`Failed to ${editingFarm ? "update" : "create"} farm`)
    }
  }

  const columns: ColumnsType<Farm> = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Location",
      dataIndex: "location",
      key: "location",
    },
    {
      title: "Size (Hectares)",
      dataIndex: "size_hectares",
      key: "size_hectares",
      render: (size) => `${size} ha`,
    },
    {
      title: "Created",
      dataIndex: "created_at",
      key: "created_at",
      render: (date) => dayjs(date).format("YYYY-MM-DD"),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            Edit
          </Button>
          <Popconfirm
            title="Are you sure you want to delete this farm?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  if (user?.role === "vet") {
    return (
      <div className="text-center py-12">
        <Title level={3}>Access Restricted</Title>
        <p>Veterinarians do not have access to farm management.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Title level={2}>Farm Management</Title>
        {user?.role === "admin" && (
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            Add Farm
          </Button>
        )}
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic title="Total Farms" value={total} prefix={<HomeOutlined className="text-green-500" />} />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Total Area"
              value={farms.reduce((sum, farm) => sum + farm.size_hectares, 0)}
              suffix="ha"
              prefix={<HomeOutlined className="text-blue-500" />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Average Size"
              value={farms.length > 0 ? farms.reduce((sum, farm) => sum + farm.size_hectares, 0) / farms.length : 0}
              precision={1}
              suffix="ha"
              prefix={<HomeOutlined className="text-orange-500" />}
            />
          </Card>
        </Col>
      </Row>

      <Card>
        <Table
          columns={columns}
          dataSource={farms}
          rowKey="id"
          loading={isLoading}
          pagination={{
            current: page,
            pageSize: size,
            total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} farms`,
          }}
        />
      </Card>

      <Modal
        title={editingFarm ? "Edit Farm" : "Add New Farm"}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={500}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="name" label="Farm Name" rules={[{ required: true, message: "Please input farm name!" }]}>
            <Input placeholder="Enter farm name" />
          </Form.Item>

          <Form.Item name="location" label="Location" rules={[{ required: true, message: "Please input location!" }]}>
            <Input placeholder="Enter farm location" />
          </Form.Item>

          <Form.Item
            name="size_hectares"
            label="Size (Hectares)"
            rules={[{ required: true, message: "Please input farm size!" }]}
          >
            <InputNumber min={0} placeholder="Enter size in hectares" className="w-full" />
          </Form.Item>

          <Form.Item className="mb-0 text-right">
            <Space>
              <Button onClick={() => setIsModalVisible(false)}>Cancel</Button>
              <Button type="primary" htmlType="submit" loading={isLoading}>
                {editingFarm ? "Update" : "Create"}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default Farms
