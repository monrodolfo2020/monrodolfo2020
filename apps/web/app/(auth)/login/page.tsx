import type { Metadata } from 'next'
import { LoginForm } from '@/components/auth/login-form'

export const metadata: Metadata = {
  title: 'Iniciar Sesión',
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Mall Management</h1>
          <p className="mt-2 text-gray-600">Plataforma de Gestión Integral</p>
        </div>
        <div className="bg-white shadow-md rounded-lg p-8">
          <h2 className="text-xl font-semibold mb-6">Iniciar Sesión</h2>
          <LoginForm />
        </div>
      </div>
    </div>
  )
}
