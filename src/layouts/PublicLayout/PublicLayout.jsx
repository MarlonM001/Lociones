import { Outlet } from 'react-router-dom'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { WhatsAppButton } from '@/components/layout/WhatsAppButton'
import { ChatWidget } from '@/components/layout/ChatWidget'
import { PromoBanner } from '@/components/layout/PromoBanner'
import { CelebrationEffect } from '@/components/layout/CelebrationEffect'
import { ChatProvider } from '@/context/ChatContext'
import { ToastContainer } from '@/components/ui/Toast'

export function PublicLayout() {
  return (
    <ChatProvider>
      <CelebrationEffect />
      <PromoBanner />
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <WhatsAppButton />
      <ChatWidget />
      <ToastContainer />
    </ChatProvider>
  )
}
