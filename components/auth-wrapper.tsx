"use client"

import { useState } from "react"
import { LoginForm } from "@/components/login-form"
import { SignupForm } from "@/components/signup-form"

export function AuthWrapper() {
  const [isLogin, setIsLogin] = useState(true)

  return isLogin ? (
    <LoginForm onSwitchToSignup={() => setIsLogin(false)} />
  ) : (
    <SignupForm onSwitchToLogin={() => setIsLogin(true)} />
  )
}
