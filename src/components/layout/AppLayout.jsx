import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Menu } from 'lucide-react'

export function AppLayout() {
  const [open, setOpen] = useState(false)

  return (
    <div data-app-shell className="h-[100dvh] flex overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden md:block w-64 flex-shrink-0">
        <Sidebar />
      </div>

      {/* Mobile sidebar */}
      <Sheet open={open} onOpenChange={setOpen}>
        <div className="md:hidden fixed top-4 left-4 z-50">
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="bg-background/80 backdrop-blur">
              <Menu className="w-5 h-5" />
            </Button>
          </SheetTrigger>
        </div>
        <SheetContent side="left" className="p-0 w-64">
          <Sidebar onClose={() => setOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Main content */}
      <main className="flex-1 overflow-hidden">
        <Outlet />
      </main>
    </div>
  )
}
