import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-blue-50">
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center space-y-6 mb-16">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900">
            Cattle Milk Prediction
            <span className="block text-green-600">with AI</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Harness the power of machine learning to predict milk yields, assess health risks, and optimize your dairy
            farm operations with data-driven insights.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="text-lg px-8">
              <Link href="/auth/signup">Get Started</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="text-lg px-8 bg-transparent">
              <Link href="/auth/login">Sign In</Link>
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">🥛</span>
                Milk Yield Prediction
              </CardTitle>
              <CardDescription>
                Predict daily milk production using advanced machine learning models trained on historical data.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm space-y-2 text-gray-600">
                <li>• Multiple ML models (Linear, Random Forest, XGBoost, Neural Networks)</li>
                <li>• Confidence scores for each prediction</li>
                <li>• Historical trend analysis</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">🏥</span>
                Health Risk Assessment
              </CardTitle>
              <CardDescription>
                Early detection of potential health issues through milk production pattern analysis.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm space-y-2 text-gray-600">
                <li>• Risk scoring and categorization</li>
                <li>• Automated health recommendations</li>
                <li>• Trend-based anomaly detection</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">📊</span>
                Data Management
              </CardTitle>
              <CardDescription>Comprehensive cattle and milk production data management system.</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm space-y-2 text-gray-600">
                <li>• Animal registration and tracking</li>
                <li>• Daily milk record management</li>
                <li>• Multi-farm support</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">🔒</span>
                Secure & Private
              </CardTitle>
              <CardDescription>Your farm data is protected with enterprise-grade security.</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm space-y-2 text-gray-600">
                <li>• Row-level security policies</li>
                <li>• Encrypted data storage</li>
                <li>• User authentication</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">📈</span>
                Performance Tracking
              </CardTitle>
              <CardDescription>Monitor model performance and prediction accuracy over time.</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm space-y-2 text-gray-600">
                <li>• Model comparison metrics</li>
                <li>• Prediction history tracking</li>
                <li>• Performance analytics</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">🚀</span>
                Easy Integration
              </CardTitle>
              <CardDescription>RESTful API for easy integration with existing farm management systems.</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm space-y-2 text-gray-600">
                <li>• RESTful API endpoints</li>
                <li>• Batch prediction support</li>
                <li>• Comprehensive documentation</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="text-center bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Ready to Optimize Your Dairy Farm?</h2>
          <p className="text-gray-600 mb-6">
            Join farmers who are already using AI to improve their milk production and animal health management.
          </p>
          <Button asChild size="lg" className="text-lg px-8">
            <Link href="/auth/signup">Start Free Trial</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
