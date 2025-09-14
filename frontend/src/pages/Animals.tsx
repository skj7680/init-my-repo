"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import {
  Table,
  Button,
  Space,
  Typography,
  Input,
  Select,
  Card,
  Modal,
  Form,
  DatePicker,
  message,
  Popconfirm,
  Tag,
  Row,
  Col,
} from "antd"
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from "@ant-design/icons"
import type { ColumnsType } from "antd/es/table"
import dayjs from "dayjs"
import type { AppDispatch, RootState } from "../store/store"
import type { Animal } from "../types"
import { fetchAnimals, createAnimal, updateAnimal, deleteAnimal, clearError } from "../store/slices/animalsSlice"

const { Title } = Typography
const { Option } = Select

const Animals: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>()
  const { animals, total, page, size, isLoading, error } = useSelector((state: RootState) => state.animals)
  const { user } = useSelector((state: RootState) => state.auth)

  const [isModalVisible, setIsModalVisible] = useState(false)
  const [editingAnimal, setEditingAnimal] = useState<Animal | null>(null)
  const [searchText, setSearchText] = useState("")
  const [breedFilter, setBreedFilter] = useState<string | undefined>()
  const [statusFilter, setStatusFilter] = useState<boolean | undefined>()
  const [form] = Form.useForm()

  useEffect(() => {
    loadAnimals()
  }, [dispatch, page, size])

  useEffect(() => {
    if (error) {
      message.error(error)
      dispatch(clearError())
    }
  }, [error, dispatch])

  const loadAnimals = () => {
    dispatch(
      fetchAnimals({
        page,
        size,
        breed: breedFilter,
        is_active: statusFilter,
      }),
    )
  }

  const handleSearch = () => {
    loadAnimals()
  }

  const handleCreate = () => {
    setEditingAnimal(null)
    form.resetFields()
    setIsModalVisible(true)
  }

  const handleEdit = (animal: Animal) => {
    setEditingAnimal(animal)
    form.setFieldsValue({
      ...animal,
      birth_date: dayjs(animal.birth_date),
    })
    setIsModalVisible(true)
  }

  const handleDelete = async (id: number) => {
    try {
      await dispatch(deleteAnimal(id)).unwrap()
      message.success("Animal deleted successfully")
      loadAnimals()
    } catch (error) {
      message.error("Failed to delete animal")
    }
  }

  const handleSubmit = async (values: any) => {
    try {
      const animalData = {
        ...values,
        birth_date: values.birth_date.format("YYYY-MM-DD"),
        farm_id: user?.farm_id || values.farm_id,
      }

      if (editingAnimal) {
        await dispatch(updateAnimal({ id: editingAnimal.id, data: animalData })).unwrap()
        message.success("Animal updated successfully")
      } else {
        await dispatch(createAnimal(animalData)).unwrap()
        message.success("Animal created successfully")
      }

      setIsModalVisible(false)
      form.resetFields()
      loadAnimals()
    } catch (error) {
      message.error(`Failed to ${editingAnimal ? "update" : "create"} animal`)
    }
  }

  const columns: ColumnsType<Animal> = [
    {
      title: "Tag Number",
      dataIndex: "tag_number",
      key: "tag_number",
      filteredValue: searchText ? [searchText] : null,
      onFilter: (value: React.Key | boolean, record: Animal): boolean => {
        const searchValue = value.toString().toLowerCase()
        return (
          record.tag_number.toLowerCase().includes(searchValue) ||
          (record.name?.toLowerCase() || "").includes(searchValue)
        )
      },
    },
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      render: (name) => name || "-",
    },
    {
      title: "Breed",
      dataIndex: "breed",
      key: "breed",
    },
    {
      title: "Gender",
      dataIndex: "gender",
      key: "gender",
      render: (gender) => (
        <Tag color={gender === "female" ? "pink" : "blue"}>{gender.charAt(0).toUpperCase() + gender.slice(1)}</Tag>
      ),
    },
    {
      title: "Birth Date",
      dataIndex: "birth_date",
      key: "birth_date",
      render: (date) => dayjs(date).format("YYYY-MM-DD"),
    },
    {
      title: "Age",
      dataIndex: "birth_date",
      key: "age",
      render: (date) => {
        const age = dayjs().diff(dayjs(date), "year")
        return `${age} years`
      },
    },
    {
      title: "Status",
      dataIndex: "is_active",
      key: "is_active",
      render: (isActive) => <Tag color={isActive ? "green" : "red"}>{isActive ? "Active" : "Inactive"}</Tag>,
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
            title="Are you sure you want to delete this animal?"
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Title level={2}>Animal Management</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
          Add Animal
        </Button>
      </div>

      <Card>
        <Row gutter={[16, 16]} className="mb-4">
          <Col xs={24} sm={8}>
            <Input
              placeholder="Search by tag number or name"
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onPressEnter={handleSearch}
            />
          </Col>
          <Col xs={24} sm={6}>
            <Select
              placeholder="Filter by breed"
              allowClear
              value={breedFilter}
              onChange={setBreedFilter}
              className="w-full"
            >
              <Option value="Holstein">Holstein</Option>
              <Option value="Jersey">Jersey</Option>
              <Option value="Angus">Angus</Option>
              <Option value="Hereford">Hereford</Option>
              <Option value="Simmental">Simmental</Option>
            </Select>
          </Col>
          <Col xs={24} sm={6}>
            <Select
              placeholder="Filter by status"
              allowClear
              value={statusFilter}
              onChange={setStatusFilter}
              className="w-full"
            >
              <Option value={true}>Active</Option>
              <Option value={false}>Inactive</Option>
            </Select>
          </Col>
          <Col xs={24} sm={4}>
            <Button type="primary" onClick={handleSearch} className="w-full">
              Search
            </Button>
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={animals}
          rowKey="id"
          loading={isLoading}
          pagination={{
            current: page,
            pageSize: size,
            total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} animals`,
          }}
          onChange={(pagination) => {
            dispatch(
              fetchAnimals({
                page: pagination.current || 1,
                size: pagination.pageSize || 10,
                breed: breedFilter,
                is_active: statusFilter,
              }),
            )
          }}
        />
      </Card>

      <Modal
        title={editingAnimal ? "Edit Animal" : "Add New Animal"}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="tag_number"
                label="Tag Number"
                rules={[{ required: true, message: "Please input tag number!" }]}
              >
                <Input placeholder="Enter tag number" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="name" label="Name (Optional)">
                <Input placeholder="Enter animal name" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="breed" label="Breed" rules={[{ required: true, message: "Please select breed!" }]}>
                <Select placeholder="Select breed">
                  <Option value="Holstein">Holstein</Option>
                  <Option value="Jersey">Jersey</Option>
                  <Option value="Angus">Angus</Option>
                  <Option value="Hereford">Hereford</Option>
                  <Option value="Simmental">Simmental</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="gender" label="Gender" rules={[{ required: true, message: "Please select gender!" }]}>
                <Select placeholder="Select gender">
                  <Option value="female">Female</Option>
                  <Option value="male">Male</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="birth_date"
            label="Birth Date"
            rules={[{ required: true, message: "Please select birth date!" }]}
          >
            <DatePicker className="w-full" />
          </Form.Item>

          {user?.role === "admin" && (
            <Form.Item name="farm_id" label="Farm ID" rules={[{ required: true, message: "Please input farm ID!" }]}>
              <Input type="number" placeholder="Enter farm ID" />
            </Form.Item>
          )}

          <Form.Item name="is_active" label="Status" initialValue={true}>
            <Select>
              <Option value={true}>Active</Option>
              <Option value={false}>Inactive</Option>
            </Select>
          </Form.Item>

          <Form.Item className="mb-0 text-right">
            <Space>
              <Button onClick={() => setIsModalVisible(false)}>Cancel</Button>
              <Button type="primary" htmlType="submit" loading={isLoading}>
                {editingAnimal ? "Update" : "Create"}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default Animals
