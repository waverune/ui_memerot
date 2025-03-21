"use client"

import { useState } from "react"
import { Form, Input, Button, Tabs, Checkbox, Divider, message } from "antd"
import { UserOutlined, LockOutlined, MailOutlined, GoogleOutlined, TwitterOutlined } from "@ant-design/icons"
import "./LoginSignUp.css"

const { TabPane } = Tabs

const LoginSignUp = () => {
  const [activeTab, setActiveTab] = useState("login")
  const [loginForm] = Form.useForm()
  const [signupForm] = Form.useForm()
  const [loading, setLoading] = useState(false)

  const handleLogin = async (values: any) => {
    try {
      setLoading(true)
      console.log("Login values:", values)
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))
      message.success("Login successful!")
      // Add your actual login logic here
    } catch (error) {
      message.error("Login failed. Please try again.")
      console.error("Login error:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSignup = async (values: any) => {
    try {
      setLoading(true)
      console.log("Signup values:", values)
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))
      message.success("Account created successfully!")
      // Add your actual signup logic here
    } catch (error) {
      message.error("Signup failed. Please try again.")
      console.error("Signup error:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-signup-container">
      <div className="pixel-container">
        <h1 className="pixel-title">MEMEROT</h1>

        <Tabs activeKey={activeTab} onChange={setActiveTab} className="pixel-tabs" centered>
          <TabPane tab="Login" key="login">
            <Form form={loginForm} name="login" onFinish={handleLogin} layout="vertical" className="pixel-form">
              <Form.Item name="email" rules={[{ required: true, message: "Please enter your email!" }]}>
                <Input prefix={<UserOutlined />} placeholder="Email" className="pixel-input" />
              </Form.Item>

              <Form.Item name="password" rules={[{ required: true, message: "Please enter your password!" }]}>
                <Input.Password prefix={<LockOutlined />} placeholder="Password" className="pixel-input" />
              </Form.Item>

              <Form.Item>
                <div className="remember-forgot">
                  <Form.Item name="remember" valuePropName="checked" noStyle>
                    <Checkbox className="pixel-checkbox">Remember me</Checkbox>
                  </Form.Item>
                  <a href="#" className="pixel-link">
                    Forgot password?
                  </a>
                </div>
              </Form.Item>

              <Form.Item>
                <Button type="primary" htmlType="submit" className="pixel-button login-button" loading={loading} block>
                  Login
                </Button>
              </Form.Item>

              <Divider className="pixel-divider">
                <span className="pixel-divider-text">or continue with</span>
              </Divider>

              <div className="social-buttons">
                <Button className="pixel-social-button google-button">
                  <GoogleOutlined /> Google
                </Button>
                <Button className="pixel-social-button twitter-button">
                  <TwitterOutlined /> Twitter
                </Button>
              </div>
            </Form>
          </TabPane>

          <TabPane tab="Sign Up" key="signup">
            <Form form={signupForm} name="signup" onFinish={handleSignup} layout="vertical" className="pixel-form">
              <Form.Item name="username" rules={[{ required: true, message: "Please enter your username!" }]}>
                <Input prefix={<UserOutlined />} placeholder="Username" className="pixel-input" />
              </Form.Item>

              <Form.Item
                name="email"
                rules={[
                  { required: true, message: "Please enter your email!" },
                  { type: "email", message: "Please enter a valid email!" },
                ]}
              >
                <Input prefix={<MailOutlined />} placeholder="Email" className="pixel-input" />
              </Form.Item>

              <Form.Item
                name="password"
                rules={[
                  { required: true, message: "Please enter your password!" },
                  { min: 6, message: "Password must be at least 6 characters!" },
                ]}
              >
                <Input.Password prefix={<LockOutlined />} placeholder="Password" className="pixel-input" />
              </Form.Item>

              <Form.Item
                name="confirmPassword"
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
                <Input.Password prefix={<LockOutlined />} placeholder="Confirm Password" className="pixel-input" />
              </Form.Item>

              <Form.Item
                name="agreement"
                valuePropName="checked"
                rules={[
                  {
                    validator: (_, value) =>
                      value ? Promise.resolve() : Promise.reject(new Error("Please accept the terms and conditions!")),
                  },
                ]}
              >
                <Checkbox className="pixel-checkbox">
                  I agree to the{" "}
                  <a href="#" className="pixel-link">
                    Terms and Conditions
                  </a>
                </Checkbox>
              </Form.Item>

              <Form.Item>
                <Button type="primary" htmlType="submit" className="pixel-button signup-button" loading={loading} block>
                  Sign Up
                </Button>
              </Form.Item>
            </Form>
          </TabPane>
        </Tabs>
      </div>
    </div>
  )
}

export default LoginSignUp

