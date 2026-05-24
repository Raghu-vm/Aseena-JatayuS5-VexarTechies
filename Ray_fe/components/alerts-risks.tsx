'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertTriangle, AlertCircle, CheckCircle, XCircle, ArrowRight } from 'lucide-react'

export function AlertsRisks() {
  return (
    <div className="flex-1 h-full bg-background overflow-y-auto">
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">Alerts & Risks</h1>
          <p className="text-lg text-muted-foreground">Monitor system risks and critical alerts</p>
        </div>

        {/* Risk Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-6 border-0 shadow-sm border-l-4 border-red-600">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-foreground">Critical</h3>
              <XCircle className="h-5 w-5 text-red-600" />
            </div>
            <p className="text-3xl font-bold text-red-600">3</p>
            <p className="text-xs text-muted-foreground mt-2">Requires immediate action</p>
          </Card>

          <Card className="p-6 border-0 shadow-sm border-l-4 border-yellow-600">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-foreground">High</h3>
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
            </div>
            <p className="text-3xl font-bold text-yellow-600">7</p>
            <p className="text-xs text-muted-foreground mt-2">Should be addressed soon</p>
          </Card>

          <Card className="p-6 border-0 shadow-sm border-l-4 border-blue-600">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-foreground">Medium</h3>
              <AlertCircle className="h-5 w-5 text-blue-600" />
            </div>
            <p className="text-3xl font-bold text-blue-600">12</p>
            <p className="text-xs text-muted-foreground mt-2">Monitor regularly</p>
          </Card>

          <Card className="p-6 border-0 shadow-sm border-l-4 border-green-600">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-foreground">Resolved</h3>
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <p className="text-3xl font-bold text-green-600">28</p>
            <p className="text-xs text-muted-foreground mt-2">In current period</p>
          </Card>
        </div>

        {/* Critical Alerts */}
        <Card className="p-6 border-0 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-foreground">Critical Alerts</h2>
            <Button variant="outline" size="sm">View All</Button>
          </div>
          <div className="space-y-3">
            {[
              { title: 'Database connection pool exhausted', severity: 'critical', time: '15 minutes ago' },
              { title: 'Memory usage at 94% on Server-03', severity: 'critical', time: '32 minutes ago' },
              { title: 'SSL certificate expires in 7 days', severity: 'critical', time: '2 hours ago' },
            ].map((alert, idx) => (
              <div key={idx} className="p-4 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <XCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-red-900 dark:text-red-100">{alert.title}</p>
                      <p className="text-sm text-red-700 dark:text-red-300 mt-1">{alert.time}</p>
                    </div>
                  </div>
                  <Button size="sm" variant="ghost" className="text-red-600 hover:text-red-700">
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* High Priority Alerts */}
        <Card className="p-6 border-0 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-foreground">High Priority Alerts</h2>
            <Button variant="outline" size="sm">View All</Button>
          </div>
          <div className="space-y-3">
            {[
              { title: 'Unusual login attempts detected (15 failed attempts)', time: '1 hour ago' },
              { title: 'API response time degradation detected', time: '3 hours ago' },
              { title: 'Backup job failed - disk space issue', time: '5 hours ago' },
              { title: 'Third-party service integration error', time: '6 hours ago' },
            ].map((alert, idx) => (
              <div key={idx} className="p-4 rounded-lg bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900/30">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-yellow-900 dark:text-yellow-100">{alert.title}</p>
                      <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">{alert.time}</p>
                    </div>
                  </div>
                  <Button size="sm" variant="ghost" className="text-yellow-600 hover:text-yellow-700">
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Risk Assessment */}
        <Card className="p-6 border-0 shadow-sm">
          <h2 className="text-xl font-bold text-foreground mb-4">Risk Assessment</h2>
          <div className="space-y-4">
            {[
              { area: 'Security', score: 72, status: 'Good' },
              { area: 'Performance', score: 65, status: 'Fair' },
              { area: 'Data Integrity', score: 88, status: 'Excellent' },
              { area: 'Compliance', score: 79, status: 'Good' },
            ].map((item) => (
              <div key={item.area} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-foreground">{item.area}</span>
                  <span className={`text-sm font-medium ${
                    item.score >= 80 ? 'text-green-600' : item.score >= 70 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {item.status} - {item.score}%
                  </span>
                </div>
                <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${item.score}%`,
                      backgroundColor: item.score >= 80 ? '#10b981' : item.score >= 70 ? '#f59e0b' : '#ef4444',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
