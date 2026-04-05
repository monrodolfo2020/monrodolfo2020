import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Bot, BookOpen, Share2, Zap, CheckCircle, FileText, PlayCircle, Globe, Mic } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="border-b px-6 py-4 flex items-center justify-between max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg">AgentForge</span>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" asChild><Link href="/login">Iniciar sesión</Link></Button>
          <Button asChild><Link href="/register">Empieza gratis</Link></Button>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 py-24 text-center">
        <div className="inline-flex items-center gap-2 bg-black/5 rounded-full px-4 py-2 text-sm font-medium mb-6">
          <Zap className="w-4 h-4" />
          Sin conocimientos técnicos requeridos
        </div>
        <h1 className="text-5xl font-bold leading-tight mb-6">
          Convierte tu experiencia en un{' '}
          <span className="bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
            agente de IA
          </span>{' '}
          que trabaja por ti
        </h1>
        <p className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto">
          Crea, entrena y comparte un asistente de IA personalizado con tu conocimiento profesional.
          Tus clientes y empresas chatan con tu agente 24/7 — sin que tú tengas que estar presente.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Button asChild size="lg" className="text-base px-8">
            <Link href="/register">Crear mi agente gratis →</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/login">Ya tengo cuenta</Link>
          </Button>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-slate-50 py-20">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-4">¿Cómo funciona?</h2>
          <p className="text-center text-slate-600 mb-12">Tres pasos para tener tu agente listo</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: Bot, step: '1', title: 'Crea tu agente', desc: 'Dale un nombre, personalidad y elige su estilo de comunicación. Sin tecnicismos.' },
              { icon: BookOpen, step: '2', title: 'Entrénalo con tu conocimiento', desc: 'Sube tus documentos, grabaciones, videos de YouTube o páginas web. Tu agente aprende de todo.' },
              { icon: Share2, step: '3', title: 'Comparte tu link', desc: 'Genera un link único y compártelo con empresas o clientes. Ellos chatean con tu agente al instante.' },
            ].map(({ icon: Icon, step, title, desc }) => (
              <div key={step} className="text-center">
                <div className="w-14 h-14 bg-black rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Icon className="w-7 h-7 text-white" />
                </div>
                <div className="text-sm font-semibold text-slate-500 mb-2">PASO {step}</div>
                <h3 className="text-lg font-bold mb-2">{title}</h3>
                <p className="text-slate-600 text-sm">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Knowledge sources */}
      <section className="py-20 max-w-5xl mx-auto px-6">
        <h2 className="text-3xl font-bold text-center mb-4">Tu agente aprende de todo</h2>
        <p className="text-center text-slate-600 mb-12">Múltiples formatos de conocimiento soportados</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: FileText, label: 'PDFs y documentos Word', color: 'bg-blue-50 text-blue-600' },
            { icon: Mic, label: 'Grabaciones de audio', color: 'bg-purple-50 text-purple-600' },
            { icon: PlayCircle, label: 'Videos de YouTube', color: 'bg-red-50 text-red-600' },
            { icon: Globe, label: 'Páginas web y artículos', color: 'bg-green-50 text-green-600' },
          ].map(({ icon: Icon, label, color }) => (
            <div key={label} className="rounded-xl border p-4 text-center">
              <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center mx-auto mb-3`}>
                <Icon className="w-5 h-5" />
              </div>
              <p className="text-sm font-medium">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Use case */}
      <section className="bg-black text-white py-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-6">Un caso real</h2>
          <blockquote className="text-xl text-slate-300 italic max-w-2xl mx-auto mb-8">
            "Soy consultor de supply chain con 15 años de experiencia. Creé mi agente, lo entrené con mis metodologías y papers, y ahora lo comparto con 10 empresas. Cada una tiene acceso a mi conocimiento las 24 horas."
          </blockquote>
          <div className="flex items-center justify-center gap-2">
            <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center">
              <span className="text-lg">👤</span>
            </div>
            <div className="text-left">
              <div className="font-semibold">Juan García</div>
              <div className="text-sm text-slate-400">Consultor de Supply Chain</div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 max-w-4xl mx-auto px-6">
        <h2 className="text-3xl font-bold text-center mb-12">¿Por qué AgentForge?</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            'Sin programación ni conocimientos técnicos',
            'Modelos de IA de última generación',
            'Link compartible listo en minutos',
            'Tus clientes chatean sin crear cuenta',
            'Múltiples formatos de conocimiento',
            'Plan gratuito disponible para empezar',
          ].map(benefit => (
            <div key={benefit} className="flex items-center gap-3 p-4 rounded-lg border">
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
              <span className="text-sm font-medium">{benefit}</span>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-slate-50 py-20">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-4">Empieza hoy, gratis</h2>
          <p className="text-slate-600 mb-8">Crea tu primer agente en menos de 5 minutos. Sin tarjeta de crédito.</p>
          <Button asChild size="lg" className="text-base px-10">
            <Link href="/register">Crear mi agente gratis →</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 text-center text-sm text-slate-500">
        <p>© 2026 AgentForge. Todos los derechos reservados.</p>
      </footer>
    </div>
  )
}
