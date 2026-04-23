import { LoginForm } from '@/components/auth/LoginForm'

export default function LoginPage() {
  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-bold mb-2 text-center">登入 JobPilot</h1>
        <p className="text-sm text-muted-foreground text-center mb-8">
          歡迎回來，繼續打造你的求職文件
        </p>
        <LoginForm />
      </div>
    </div>
  )
}
