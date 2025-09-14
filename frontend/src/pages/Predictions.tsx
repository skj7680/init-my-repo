"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import {
  Card,
  Button,
  Space,
  Typography,
  Select,
  Row,
  Col,
  Statistic,
  Progress,
  Alert,
  Table,
  Tag,
  Tabs,
  message,
  Spin,
} from "antd"
import {
  BarChartOutlined,
  MedicineBoxOutlined,
  DropboxOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  WarningOutlined,
} from "@ant-design/icons"
import type { ColumnsType } from "antd/es/table"
import dayjs from "dayjs"
import type { AppDispatch, RootState } from "../store/store"
import type { Prediction } from "../types"
import {
  predictMilkYield,
  predictDiseaseRisk,
  batchPredict,
  clearError,
  clearPredictions,
} from "../store/slices/predictionsSlice"
import { fetchAnimals } from "../store/slices/animalsSlice"

const { Title, Text } = Typography
const { Option } = Select
const { TabPane } = Tabs

const Predictions: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>()
  const { predictions, currentPrediction, isLoading, error } = useSelector((state: RootState) => state.predictions)
  const { animals } = useSelector((state: RootState) => state.animals)

  const [selectedAnimal, setSelectedAnimal] = useState<number | undefined>()
  const [selectedAnimals, setSelectedAnimals] = useState<number[]>([])
  const [activeTab, setActiveTab] = useState("single")

  useEffect(() => {
    dispatch(fetchAnimals({ page: 1, size: 1000 }))
  }, [dispatch])

  useEffect(() => {
    if (error) {
      message.error(error)
      dispatch(clearError())
    }
  }, [error, dispatch])

  const handleSinglePrediction = async (type: "milk_yield" | "disease_risk") => {
    if (!selectedAnimal) {
      message.warning("Please select an animal first")
      return
    }

    try {
      if (type === "milk_yield") {
        await dispatch(predictMilkYield(selectedAnimal)).unwrap()
        message.success("Milk yield prediction completed")
      } else {
        await dispatch(predictDiseaseRisk(selectedAnimal)).unwrap()
        message.success("Disease risk prediction completed")
      }
    } catch (error) {
      console.error("Prediction failed:", error)
    }
  }

  const handleBatchPrediction = async (type: "milk_yield" | "disease_risk") => {
    if (selectedAnimals.length === 0) {
      message.warning("Please select at least one animal")
      return
    }

    try {
      await dispatch(batchPredict({ animal_ids: selectedAnimals, prediction_type: type })).unwrap()
      message.success(`Batch ${type.replace("_", " ")} prediction completed`)
    } catch (error) {
      console.error("Batch prediction failed:", error)
    }
  }

  const getRiskLevel = (confidence: number, predictionType: string) => {
    if (predictionType === "disease_risk") {
      if (confidence >= 0.7) return { level: "High", color: "red", icon: <ExclamationCircleOutlined /> }
      if (confidence >= 0.4) return { level: "Medium", color: "orange", icon: <WarningOutlined /> }
      return { level: "Low", color: "green", icon: <CheckCircleOutlined /> }
    }
    return { level: "Normal", color: "blue", icon: <BarChartOutlined /> }
  }

  const predictionColumns: ColumnsType<Prediction> = [
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
      title: "Type",
      dataIndex: "prediction_type",
      key: "prediction_type",
      render: (type) => (
        <Tag color={type === "milk_yield" ? "blue" : "red"}>
          {type === "milk_yield" ? "Milk Yield" : "Disease Risk"}
        </Tag>
      ),
    },
    {
      title: "Predicted Value",
      dataIndex: "predicted_value",
      key: "predicted_value",
      render: (value, record) => {
        if (record.prediction_type === "milk_yield") {
          return `${value.toFixed(2)} L`
        }
        return `${(value * 100).toFixed(1)}%`
      },
    },
    {
      title: "Confidence",
      dataIndex: "confidence",
      key: "confidence",
      render: (confidence, record) => {
        const risk = getRiskLevel(confidence, record.prediction_type)
        return (
          <Space>
            <Progress
              percent={confidence * 100}
              size="small"
              status={confidence >= 0.7 ? "success" : confidence >= 0.4 ? "active" : "exception"}
            />
            <Tag color={risk.color} icon={risk.icon}>
              {risk.level}
            </Tag>
          </Space>
        )
      },
    },
    {
      title: "Date",
      dataIndex: "created_at",
      key: "created_at",
      render: (date) => dayjs(date).format("YYYY-MM-DD HH:mm"),
    },
  ]

  const milkPredictions = predictions.filter((p) => p.prediction_type === "milk_yield")
  const diseasePredictions = predictions.filter((p) => p.prediction_type === "disease_risk")
  const highRiskAnimals = diseasePredictions.filter((p) => p.confidence >= 0.7).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Title level={2}>AI Predictions</Title>
        <Button onClick={() => dispatch(clearPredictions())}>Clear History</Button>
      </div>

      {/* Statistics */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Total Predictions"
              value={predictions.length}
              prefix={<BarChartOutlined className="text-blue-500" />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Milk Predictions"
              value={milkPredictions.length}
              prefix={<DropboxOutlined className="text-green-500" />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="High Risk Animals"
              value={highRiskAnimals}
              prefix={<MedicineBoxOutlined className="text-red-500" />}
            />
          </Card>
        </Col>
      </Row>

      {/* Current Prediction Display */}
      {currentPrediction && (
        <Card title="Latest Prediction Result">
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary-600 mb-2">
                  {currentPrediction.prediction_type === "milk_yield"
                    ? `${currentPrediction.predicted_value.toFixed(2)} L`
                    : `${(currentPrediction.predicted_value * 100).toFixed(1)}% Risk`}
                </div>
                <Text type="secondary">
                  {currentPrediction.prediction_type === "milk_yield" ? "Predicted Daily Yield" : "Disease Risk Level"}
                </Text>
              </div>
            </Col>
            <Col xs={24} md={12}>
              <div className="text-center">
                <Progress
                  type="circle"
                  percent={currentPrediction.confidence * 100}
                  format={(percent) => `${percent?.toFixed(1)}%`}
                  status={
                    currentPrediction.confidence >= 0.7
                      ? "success"
                      : currentPrediction.confidence >= 0.4
                        ? "active"
                        : "exception"
                  }
                />
                <div className="mt-2">
                  <Text type="secondary">Confidence Level</Text>
                </div>
              </div>
            </Col>
          </Row>
          {currentPrediction.prediction_type === "disease_risk" && currentPrediction.confidence >= 0.7 && (
            <Alert
              message="High Risk Alert"
              description="This animal shows high risk indicators. Consider veterinary consultation."
              type="warning"
              showIcon
              className="mt-4"
            />
          )}
        </Card>
      )}

      {/* Prediction Interface */}
      <Card title="Generate Predictions">
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab="Single Animal" key="single">
            <div className="space-y-4">
              <Select
                placeholder="Select an animal"
                value={selectedAnimal}
                onChange={setSelectedAnimal}
                className="w-full"
                showSearch
                optionFilterProp="children"
              >
                {animals.map((animal) => (
                  <Option key={animal.id} value={animal.id}>
                    {animal.tag_number} {animal.name ? `(${animal.name})` : ""} - {animal.breed}
                  </Option>
                ))}
              </Select>

              <Space>
                <Button
                  type="primary"
                  icon={<DropboxOutlined />}
                  onClick={() => handleSinglePrediction("milk_yield")}
                  loading={isLoading}
                  disabled={!selectedAnimal}
                >
                  Predict Milk Yield
                </Button>
                <Button
                  icon={<MedicineBoxOutlined />}
                  onClick={() => handleSinglePrediction("disease_risk")}
                  loading={isLoading}
                  disabled={!selectedAnimal}
                >
                  Predict Disease Risk
                </Button>
              </Space>
            </div>
          </TabPane>

          <TabPane tab="Batch Prediction" key="batch">
            <div className="space-y-4">
              <Select
                mode="multiple"
                placeholder="Select multiple animals"
                value={selectedAnimals}
                onChange={setSelectedAnimals}
                className="w-full"
                showSearch
                optionFilterProp="children"
              >
                {animals.map((animal) => (
                  <Option key={animal.id} value={animal.id}>
                    {animal.tag_number} {animal.name ? `(${animal.name})` : ""} - {animal.breed}
                  </Option>
                ))}
              </Select>

              <Space>
                <Button
                  type="primary"
                  icon={<DropboxOutlined />}
                  onClick={() => handleBatchPrediction("milk_yield")}
                  loading={isLoading}
                  disabled={selectedAnimals.length === 0}
                >
                  Batch Milk Yield
                </Button>
                <Button
                  icon={<MedicineBoxOutlined />}
                  onClick={() => handleBatchPrediction("disease_risk")}
                  loading={isLoading}
                  disabled={selectedAnimals.length === 0}
                >
                  Batch Disease Risk
                </Button>
              </Space>
            </div>
          </TabPane>
        </Tabs>
      </Card>

      {/* Predictions History */}
      <Card title="Prediction History">
        {isLoading && predictions.length === 0 ? (
          <div className="text-center py-8">
            <Spin size="large" />
            <div className="mt-4">
              <Text type="secondary">Generating predictions...</Text>
            </div>
          </div>
        ) : (
          <Table
            columns={predictionColumns}
            dataSource={predictions}
            rowKey={(record) => `${record.animal_id}-${record.prediction_type}-${record.created_at}`}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} predictions`,
            }}
          />
        )}
      </Card>
    </div>
  )
}

export default Predictions
