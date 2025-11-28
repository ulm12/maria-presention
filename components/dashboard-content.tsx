"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { AttendanceButton } from "@/components/attendance-button"
import { AttendanceHistory } from "@/components/attendance-history"
import { CurrentTime } from "@/components/current-time"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { MapPin, Clock, History, LogOut, CreditCard } from "lucide-react"

interface DashboardContentProps {
  user: {
    id: string
    nip: string
    nama: string
  }
}

export function DashboardContent({ user }: DashboardContentProps) {
  const { logout } = useAuth()
  const router = useRouter()
  const [refreshKey, setRefreshKey] = useState(0)

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  const handleAttendanceSuccess = () => {
    setRefreshKey((prev) => prev + 1)
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <MapPin className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-bold text-foreground">Absensi App</h1>
              <p className="text-xs text-muted-foreground">Sistem Absensi Online</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2">
              <Avatar className="w-8 h-8">
                <AvatarFallback className="bg-secondary text-secondary-foreground text-xs">
                  {getInitials(user.nama)}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium text-foreground">{user.nama}</span>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">Keluar</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* User Info Card */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <Avatar className="w-16 h-16">
                <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                  {getInitials(user.nama)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-foreground">{user.nama}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <CreditCard className="w-4 h-4 text-primary" />
                  <span className="text-muted-foreground">NIP: {user.nip}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">ID: {user.id}</p>
              </div>
              <CurrentTime />
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="absensi" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 h-12">
            <TabsTrigger value="absensi" className="gap-2">
              <Clock className="w-4 h-4" />
              Absensi
            </TabsTrigger>
            <TabsTrigger value="riwayat" className="gap-2">
              <History className="w-4 h-4" />
              Riwayat
            </TabsTrigger>
          </TabsList>

          <TabsContent value="absensi" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary" />
                  Absensi Kehadiran
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AttendanceButton user={user} onSuccess={handleAttendanceSuccess} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="riwayat">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="w-5 h-5 text-primary" />
                  Riwayat Absensi
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AttendanceHistory userId={user.id} key={refreshKey} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  )
}
