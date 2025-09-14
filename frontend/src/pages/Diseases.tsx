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
  DatePicker,
  Select,
  message,
  Popconfirm,
  Tag,
  Row,
  Col,
  Statistic,
} from "antd"
import { PlusOutlined, EditOutlined, DeleteOutlined, MedicineBoxOutlined } from "@ant-design/icons"
import type { ColumnsType } from "antd/es/table"
import dayjs from "dayjs"
import type { AppDispatch, RootState } from "../store/store"
import type { DiseaseRecord } from "../types"
import { fetchDiseases, createDisease, updateDisease, deleteDisease, clearError } from "../store/slices/diseasesSlice"
import { fetchAnimals } from "../store/slices/animalsSlice"

const { Title } = Typography
const { Option } = Select
const { TextArea } = Input

const Diseases: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>()
  const { diseases, total, page, size, isLoading, error } = useSelector((state: RootState) => state.diseases)
  const { animals } = useSelector((state: RootState) => state.animals)

  const [isModalVisible, setIsModalVisible] = useState(false)
  const [editingDisease, setEditingDisease] = useState<DiseaseRecord | null>(null)
  const [severityFilter, setSeverityFilter] = useState<"low" | "medium" | "high" | undefined>()
  const [form] = Form.useForm()

  useEffect(() => {
    dispatch(fetchAnimals({ page: 1, size: 1000 }))
    loadDiseases()
  }, [dispatch])

  useEffect(() => {
    if (error) {
      message.error(error)
      dispatch(clearError())
    }
  }, [error, dispatch])

  const loadDiseases = () => {
    dispatch(
      fetchDiseases({
        page,
        size,
        severity: severityFilter,
      }),
    )
  }

  const handleCreate = () => {
    setEditingDisease(null)
    form.resetFields()
    form.setFieldsValue({ diagnosis_date: dayjs() })
    setIsModalVisible(true)
  }

  const handleEdit = (disease: DiseaseRecord) => {
    setEditingDisease(disease)
    form.setFieldsValue({
      ...disease,
      diagnosis_date: dayjs(disease.diagnosis_date),
      recovery_date: disease.recovery_date ? dayjs(disease.recovery_date) : null,
    })
    setIsModalVisible(true)
  }

  const handleDelete = async (id: number) => {
    try {
      await dispatch(deleteDisease(id)).unwrap()
      message.success("Disease record deleted successfully")
      loadDiseases()
    } catch (error) {
      message.error("Failed to delete disease record")
    }
  }

  const handleSubmit = async (values: any) => {
    try {
      const diseaseData = {
        ...values,
        diagnosis_date: values.diagnosis_date.format("YYYY-MM-DD"),
        recovery_date: values.recovery_date ? values.recovery_date.format("YYYY-MM-DD") : null,
      }

      if (editingDisease) {
        await dispatch(updateDisease({ id: editingDisease.id, data: diseaseData })).unwrap()
        message.success("Disease record updated successfully")
      } else {
        await dispatch(createDisease(diseaseData)).unwrap()
        message.success("Disease record created successfully")
      }

      setIsModalVisible(false)
      form.resetFields()
      loadDiseases()
    } catch (error) {
      message.error(`Failed to ${editingDisease ? "update" : "create"} disease record`)
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "red"
      case "medium":
        return "orange"
      case "low":
        return "green"
      default:
        return "default"
    }
  }

  const columns: ColumnsType<DiseaseRecord> = [
    {
      title: "Animal",
      dataIndex: "animal_id",
      key: "animal_id",
      render: (animalId) => {
        const animal = animals.find((a) => a.id === animalId)
        return animal ? `${animal.tag_number} ${animal.name ? `(${animal.name})` : ""}` : `ID: ${animalId}`
      },
    },
    {
      title: "Disease",
      dataIndex: "disease_name",
      key: "disease_name",
    },
    {
      title: "Symptoms",
      dataIndex: "symptoms",
      key: "symptoms",
      ellipsis: true,
    },
    {
      title: "Severity",
      dataIndex: "severity",
      key: "severity",
      render: (severity) => (
        <Tag color={getSeverityColor(severity)}>{severity.charAt(0).toUpperCase() + severity.slice(1)}</Tag>
      ),
    },
    {
      title: "Diagnosis Date",
      dataIndex: "diagnosis_date",
      key: "diagnosis_date",
      render: (date) => dayjs(date).format("YYYY-MM-DD"),
    },
    {
      title: "Recovery Date",
      dataIndex: "recovery_date",
      key: "recovery_date",
      render: (date) => (date ? dayjs(date).format("YYYY-MM-DD") : "-"),
    },
    {
      title: "Status",
      key: "status",
      render: (_, record) => (
        <Tag color={record.recovery_date ? "green" : "red"}>{record.recovery_date ? "Recovered" : "Active"}</Tag>
      ),
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

  const activeCases = diseases.filter((d) => !d.recovery_date).length
  const highSeverityCases = diseases.filter((d) => d.severity === "high").length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Title level={2}>Health Records</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
          Add Record
        </Button>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic title="Total Records" value={total} prefix={<MedicineBoxOutlined className="text-blue-500" />} />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Active Cases"
              value={activeCases}
              prefix={<MedicineBoxOutlined className="text-red-500" />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="High Severity"
              value={highSeverityCases}
              prefix={<MedicineBoxOutlined className="text-orange-500" />}
            />
          </Card>
        </Col>
      </Row>

      <Card>
        <div className="mb-4">
          <Select
            placeholder="Filter by severity"
            allowClear
            value={severityFilter}
            onChange={(value) => {
              setSeverityFilter(value)
              dispatch(fetchDiseases({ page: 1, size, severity: value }))
            }}
            className="w-48"
          >
            <Option value="low">Low</Option>
            <Option value="medium">Medium</Option>
            <Option value="high">High</Option>
          </Select>
        </div>

        <Table
          columns={columns}
          dataSource={diseases}
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
              fetchDiseases({
                page: pagination.current || 1,
                size: pagination.pageSize || 10,
                severity: severityFilter,
              }),
            )
          }}
        />
      </Card>

      <Modal
        title={editingDisease ? "Edit Health Record" : "Add New Health Record"}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={700}
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

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="disease_name"
                label="Disease Name"
                rules={[{ required: true, message: "Please input disease name!" }]}
              >
                <Input placeholder="Enter disease name" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="severity"
                label="Severity"
                rules={[{ required: true, message: "Please select severity!" }]}
              >
                <Select placeholder="Select severity">
                  <Option value="low">Low</Option>
                  <Option value="medium">Medium</Option>
                  <Option value="high">High</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="symptoms"
            label="Symptoms"
            rules={[{ required: true, message: "Please describe symptoms!" }]}
          >
            <TextArea rows={3} placeholder="Describe the symptoms" />
          </Form.Item>

          <Form.Item name="treatment" label="Treatment">
            <TextArea rows={3} placeholder="Describe the treatment (optional)" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="diagnosis_date"
                label="Diagnosis Date"
                rules={[{ required: true, message: "Please select diagnosis date!" }]}
              >
                <DatePicker className="w-full" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="recovery_date" label="Recovery Date">
                <DatePicker className="w-full" placeholder="Select if recovered" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item className="mb-0 text-right">
            <Space>
              <Button onClick={() => setIsModalVisible(false)}>Cancel</Button>
              <Button type="primary" htmlType="submit" loading={isLoading}>
                {editingDisease ? "Update" : "Create"}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default Diseases
