'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BarChart3, TrendingUp, AlertCircle, Users, Zap } from 'lucide-react'

export function OperationalIntelligence() {
  return (
    <div className="flex-1 h-full bg-background overflow-y-auto">
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">Operational Intelligence</h1>
          <p className="text-lg text-muted-foreground">Real-time system performance and operational metrics</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-6 border-0 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">System Uptime</h3>
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
            <p className="text-3xl font-bold text-foreground">99.8%</p>
            <p className="text-sm text-muted-foreground mt-2">Last 30 days</p>
          </Card>

          <Card className="p-6 border-0 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">Avg Response Time</h3>
              <Zap className="h-5 w-5 text-blue-600" />
            </div>
            <p className="text-3xl font-bold text-foreground">145ms</p>
            <p className="text-sm text-muted-foreground mt-2">↓ 12% improvement</p>
          </Card>

          <Card className="p-6 border-0 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">Active Users</h3>
              <Users className="h-5 w-5 text-purple-600" />
            </div>
            <p className="text-3xl font-bold text-foreground">1,248</p>
            <p className="text-sm text-muted-foreground mt-2">Currently online</p>
          </Card>

          <Card className="p-6 border-0 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">Incidents</h3>
              <AlertCircle className="h-5 w-5 text-red-600" />
            </div>
            <p className="text-3xl font-bold text-foreground">2</p>
            <p className="text-sm text-muted-foreground mt-2">In last 7 days</p>
          </Card>
        </div>

        {/* Performance Overview */}
        <Card className="p-6 border-0 shadow-sm">
          <h2 className="text-xl font-bold text-foreground mb-4">System Health</h2>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-foreground">API Servers</span>
                <span className="text-sm text-green-600 font-medium">Healthy</span>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-green-600 rounded-full" style={{ width: '100%' }} />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-foreground">Database</span>
                <span className="text-sm text-green-600 font-medium">Healthy</span>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-green-600 rounded-full" style={{ width: '100%' }} />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-foreground">Storage</span>
                <span className="text-sm text-yellow-600 font-medium">75% used</span>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-yellow-600 rounded-full" style={{ width: '75%' }} />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-foreground">Cache</span>
                <span className="text-sm text-green-600 font-medium">Healthy</span>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-green-600 rounded-full" style={{ width: '100%' }} />
              </div>
            </div>
          </div>
        </Card>

        {/* Recent Operations */}
        <Card className="p-6 border-0 shadow-sm">
          <h2 className="text-xl font-bold text-foreground mb-4">Recent Operations</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
              <div>
                <p className="font-medium text-foreground">System backup completed</p>
                <p className="text-sm text-muted-foreground">2 hours ago</p>
              </div>
              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">Success</span>
            </div>
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
              <div>
                <p className="font-medium text-foreground">Database migration scheduled</p>
                <p className="text-sm text-muted-foreground">Tomorrow at 02:00 AM</p>
              </div>
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">Scheduled</span>
            </div>
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
              <div>
                <p className="font-medium text-foreground">Security patch applied</p>
                <p className="text-sm text-muted-foreground">Yesterday at 11:30 PM</p>
              </div>
              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">Complete</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
