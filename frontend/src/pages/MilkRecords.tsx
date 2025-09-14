"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import type { Dayjs } from "dayjs"
import {
  Table,
  Button,
  Space,
  Typography,
  Card,
  Modal,
  Form,
  InputNumber,
  DatePicker,
  Select,
  message,
  Popconfirm,
  Statistic,
  Row,
  Col,
} from "antd"
import { PlusOutlined, EditOutlined, DeleteOutlined, DropboxOutlined, SearchOutlined } from "@ant-design/icons"
import type { ColumnsType } from "antd/es/table"
import dayjs from "dayjs"
import type { AppDispatch, RootState } from "../store/store"
import type { MilkRecord } from "../types"
import {
  fetchMilkRecords,
  createMilkRecord,
  updateMilkRecord,
  deleteMilkRecord,
  clearError,
} from "../store/slices/milkRecordsSlice"
import { fetchAnimals } from "../store/slices/animalsSlice"

const { Title } = Typography
const { Option } = Select
const { RangePicker } = DatePicker

const MilkRecords: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>()
  const { milkRecords, total, page, size, isLoading, error } = useSelector((state: RootState) => state.milkRecords)
  const { animals } = useSelector((state: RootState) => state.animals)

  const [isModalVisible, setIsModalVisible] = useState(false)
  const [editingRecord, setEditingRecord] = useState<MilkRecord | null>(null)
  const [selectedAnimal, setSelectedAnimal] = useState<number | undefined>()
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | null>(null)
  const [form] = Form.useForm()

  useEffect(() => {
    dispatch(fetchAnimals({ page: 1, size: 1000 }))
    loadMilkRecords()
  }, [dispatch])

  useEffect(() => {
    if (error) {
      message.error(error)
      dispatch(clearError())
    }
  }, [error, dispatch])

  const loadMilkRecords = () => {
    dispatch(
      fetchMilkRecords({
        page,
        size,
        animal_id: selectedAnimal,
        start_date: dateRange?.[0]?.format("YYYY-MM-DD"),
        end_date: dateRange?.[1]?.format("YYYY-MM-DD"),
      }),
    )
  }

  const handleSearch = () => {
    loadMilkRecords()
  }

  const handleCreate = () => {
    setEditingRecord(null)
    form.resetFields()
    form.setFieldsValue({ date: dayjs() })
    setIsModalVisible(true)
  }

  const handleEdit = (record: MilkRecord) => {
    setEditingRecord(record)
    form.setFieldsValue({
      ...record,
      date: dayjs(record.date),
    })
    setIsModalVisible(true)
  }

  const handleDelete = async (id: number) => {
    try {
      await dispatch(deleteMilkRecord(id)).unwrap()
      message.success("Milk record deleted successfully")
      loadMilkRecords()
    } catch (error) {
      message.error("Failed to delete milk record")
    }
  }

  const handleSubmit = async (values: any) => {
    try {
      const recordData = {
        ...values,
        date: values.date.format("YYYY-MM-DD"),
      }

      if (editingRecord) {
        await dispatch(updateMilkRecord({ id: editingRecord.id, data: recordData })).unwrap()
        message.success("Milk record updated successfully")
      } else {
        await dispatch(createMilkRecord(recordData)).unwrap()
        message.success("Milk record created successfully")
      }

      setIsModalVisible(false)
      form.resetFields()
      loadMilkRecords()
    } catch (error) {
      message.error(`Failed to ${editingRecord ? "update" : "create"} milk record`)
    }
  }

  const columns: ColumnsType<MilkRecord> = [
    {
      title: "Animal",
      dataIndex: "animal_id",
      key: "animal_id",
      render: (animalId) => {
        const animal = animals.find((a) => a.id === animalId)
        if (!animal) {
          return `ID: ${animalId}`
        }
        const name = animal.name ? ` (${animal.name})` : ""
        return `${animal.tag_number}${name}`
      },
    },
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
      render: (date) => dayjs(date).format("YYYY-MM-DD"),
    },
    {
      title: "Morning Yield (L)",
      dataIndex: "morning_yield",
      key: "morning_yield",
      render: (yield_val) => yield_val.toFixed(2),
    },
    {
      title: "Evening Yield (L)",
      dataIndex: "evening_yield",
      key: "evening_yield",
      render: (yield_val) => yield_val.toFixed(2),
    },
    {
      title: "Total Yield (L)",
      dataIndex: "total_yield",
      key: "total_yield",
      render: (yield_val) => yield_val.toFixed(2),
    },
    {
      title: "Fat Content (%)",
      dataIndex: "fat_content",
      key: "fat_content",
      render: (content) => (content ? `${content.toFixed(2)}%` : "-"),
    },
    {
      title: "Protein Content (%)",
      dataIndex: "protein_content",
      key: "protein_content",
      render: (content) => (content ? `${content.toFixed(2)}%` : "-"),
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
            title="Are you sure you want to delete this record?"
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

  const totalYield = milkRecords.reduce((sum, record) => sum + record.total_yield, 0)
  const avgYield = milkRecords.length > 0 ? totalYield / milkRecords.length : 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Title level={2}>Milk Records</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
          Add Record
        </Button>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic title="Total Records" value={total} prefix={<DropboxOutlined className="text-blue-500" />} />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Total Yield"
              value={totalYield}
              precision={2}
              suffix="L"
              prefix={<DropboxOutlined className="text-green-500" />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Average Yield"
              value={avgYield}
              precision={2}
              suffix="L"
              prefix={<DropboxOutlined className="text-orange-500" />}
            />
          </Card>
        </Col>
      </Row>

      <Card>
        <Row gutter={[16, 16]} className="mb-4">
          <Col xs={24} sm={8}>
            <Select
              placeholder="Filter by animal"
              allowClear
              value={selectedAnimal}
              onChange={setSelectedAnimal}
              className="w-full"
              showSearch
              optionFilterProp="children"
            >
              {animals.map((animal) => (
                <Option key={animal.id} value={animal.id}>
                  {animal.tag_number} {animal.name ? `(${animal.name})` : ""}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={10}>
            <RangePicker
              value={dateRange}
              onChange={(dates) => {
                if (dates && dates[0] && dates[1]) {
                  setDateRange([dates[0], dates[1]])
                } else {
                  setDateRange(null)
                }
              }}
              className="w-full"
              placeholder={["Start Date", "End Date"]}
            />
          </Col>
          <Col xs={24} sm={6}>
            <Button type="primary" onClick={handleSearch} className="w-full" icon={<SearchOutlined />}>
              Search
            </Button>
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={milkRecords}
          rowKey="id"
          loading={isLoading}
          pagination={{
            current: page,
            pageSize: size,
            total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} records`,
          }}
          onChange={(pagination) => {
            dispatch(
              fetchMilkRecords({
                page: pagination.current || 1,
                size: pagination.pageSize || 10,
                animal_id: selectedAnimal,
                start_date: dateRange?.[0]?.format("YYYY-MM-DD"),
                end_date: dateRange?.[1]?.format("YYYY-MM-DD"),
              }),
            )
          }}
        />
      </Card>

      <Modal
        title={editingRecord ? "Edit Milk Record" : "Add New Milk Record"}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="animal_id" label="Animal" rules={[{ required: true, message: "Please select an animal!" }]}>
            <Select placeholder="Select animal" showSearch optionFilterProp="children">
              {animals.map((animal) => (
                <Option key={animal.id} value={animal.id}>
                  {animal.tag_number} {animal.name ? `(${animal.name})` : ""}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="date" label="Date" rules={[{ required: true, message: "Please select date!" }]}>
            <DatePicker className="w-full" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="morning_yield"
                label="Morning Yield (L)"
                rules={[{ required: true, message: "Please input morning yield!" }]}
              >
                <InputNumber min={0} step={0.1} placeholder="0.0" className="w-full" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="evening_yield"
                label="Evening Yield (L)"
                rules={[{ required: true, message: "Please input evening yield!" }]}
              >
                <InputNumber min={0} step={0.1} placeholder="0.0" className="w-full" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="fat_content" label="Fat Content (%)">
                <InputNumber min={0} max={100} step={0.1} placeholder="0.0" className="w-full" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="protein_content" label="Protein Content (%)">
                <InputNumber min={0} max={100} step={0.1} placeholder="0.0" className="w-full" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item className="mb-0 text-right">
            <Space>
              <Button onClick={() => setIsModalVisible(false)}>Cancel</Button>
              <Button type="primary" htmlType="submit" loading={isLoading}>
                {editingRecord ? "Update" : "Create"}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default MilkRecords
