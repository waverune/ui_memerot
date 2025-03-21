"use client"

import { Drawer } from "antd"
import { CloseOutlined } from "@ant-design/icons"
import { useSelector, useDispatch } from "react-redux"
import { selectAuth, closeAuthSidebar } from "../../../store/feature/auth/authSlice"
import LoginSignUp from "./loginSignUp"
import { useState, useEffect } from "react"
import type { CSSProperties } from "react"
import "./AuthSidebar.css" // Import custom styles

const AuthSidebar = () => {
  const dispatch = useDispatch()
  const { isAuthSidebarOpen } = useSelector(selectAuth)
  const [drawerWidth, setDrawerWidth] = useState("50%")
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth
      if (width <= 480) {
        setDrawerWidth("100%")
        setIsMobile(true)
      } else if (width <= 768) {
        setDrawerWidth("85%")
        setIsMobile(false)
      } else if (width <= 1024) {
        setDrawerWidth("70%")
        setIsMobile(false)
      } else {
        setDrawerWidth("50%")
        setIsMobile(false)
      }
    }

    // Initial check
    handleResize()

    // Add event listener
    window.addEventListener("resize", handleResize)

    // Cleanup
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // Direct styling for the drawer content
  const drawerContentStyle: CSSProperties = {
    background: "linear-gradient(135deg, rgba(48, 25, 107, 0.85), rgba(88, 28, 135, 0.85))",
    backdropFilter: "blur(10px)",
    WebkitBackdropFilter: "blur(10px)",
    borderLeft: isMobile ? "none" : "4px solid white",
    boxShadow: "-5px 0 15px rgba(0, 0, 0, 0.5)",
  }

  const drawerStyle: CSSProperties = {
    borderRadius: isMobile ? "0" : "40px 0 0 40px",
    overflow: "hidden", // Ensure the background doesn't overflow the border radius
  }

  const bodyStyle: CSSProperties = {
    padding: isMobile ? "16px" : "24px",
    background: "transparent", // Make the body background transparent
  }

  const headerStyle: CSSProperties = {
    background: "transparent",
    borderBottom: "none",
    padding: "16px 24px",
  }

  const closeIconStyle: CSSProperties = {
    fontSize: isMobile ? "20px" : "16px",
    padding: isMobile ? "12px" : "8px",
    cursor: "pointer",
    color: "white", // Change close icon color to white
    textShadow: "2px 2px 0 rgba(0, 0, 0, 0.5)", // Add pixel-style shadow
  }

  const contentStyle: CSSProperties = {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "100%",
    padding: isMobile ? "16px 8px" : "24px",
  }

  return (
    <Drawer
      placement="right"
      onClose={() => dispatch(closeAuthSidebar())}
      open={isAuthSidebarOpen}
      width={drawerWidth}
      height="100vh"
      style={drawerStyle}
      bodyStyle={bodyStyle}
      headerStyle={headerStyle}
      title=" "
      closeIcon={false}
      className="pixel-drawer" // Add custom class for styling
      maskStyle={{
        background: "rgba(0, 0, 0, 0.7)", // Darker mask for better contrast
      }}
      // This is the key part - directly styling the drawer content
      styles={{
        wrapper: {},
        header: {},
        body: {},
        content: drawerContentStyle,
        footer: {},
        mask: {},
      }}
      extra={
        <CloseOutlined
          onClick={() => dispatch(closeAuthSidebar())}
          style={closeIconStyle}
          className="pixel-close-icon"
        />
      }
    >
      <div style={contentStyle}>
        <LoginSignUp />
      </div>
    </Drawer>
  )
}

export default AuthSidebar

