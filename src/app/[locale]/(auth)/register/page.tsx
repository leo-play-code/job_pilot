import { RegisterForm } from '@/components/auth/RegisterForm'

export default function RegisterPage() {
  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-bold mb-2 text-center">建立帳號</h1>
        <p className="text-sm text-muted-foreground text-center mb-8">
          免費開始，用 AI 加速你的求職旅程
        </p>
        <RegisterForm />
      </div>
    </div>
  )
}
