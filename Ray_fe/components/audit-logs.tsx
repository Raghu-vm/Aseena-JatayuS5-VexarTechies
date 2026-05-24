'use client'

import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, Download, Filter } from 'lucide-react'

export function AuditLogs() {
  return (
    <div className="flex-1 h-full bg-background overflow-y-auto">
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">Audit Logs</h1>
          <p className="text-lg text-muted-foreground">Complete system activity and user action history</p>
        </div>

        {/* Filters */}
        <Card className="p-6 border-0 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search logs..."
                className="pl-10"
              />
            </div>
            <select className="px-4 py-2 rounded-lg border border-border bg-background text-foreground">
              <option>All Users</option>
              <option>Admin Users</option>
              <option>System</option>
              <option>API</option>
            </select>
            <select className="px-4 py-2 rounded-lg border border-border bg-background text-foreground">
              <option>All Actions</option>
              <option>Create</option>
              <option>Update</option>
              <option>Delete</option>
              <option>Login</option>
            </select>
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              Filter
            </Button>
          </div>
        </Card>

        {/* Audit Log Table */}
        <Card className="p-6 border-0 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-foreground">Recent Activity</h2>
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-semibold text-foreground">Timestamp</th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">User</th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">Action</th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">Resource</th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">Details</th>
                </tr>
              </thead>
              <tbody>
                {[
                  {
                    timestamp: 'Jun 19, 2024 14:32:45',
                    user: 'admin@company.com',
                    action: 'User Login',
                    resource: 'Authentication',
                    status: 'Success',
                    details: 'From 192.168.1.100',
                  },
                  {
                    timestamp: 'Jun 19, 2024 14:15:22',
                    user: 'john.doe@company.com',
                    action: 'Update User Profile',
                    resource: 'User #1234',
                    status: 'Success',
                    details: 'Changed email address',
                  },
                  {
                    timestamp: 'Jun 19, 2024 13:45:10',
                    user: 'system',
                    action: 'Backup Completed',
                    resource: 'Database',
                    status: 'Success',
                    details: '2.4 GB backed up',
                  },
                  {
                    timestamp: 'Jun 19, 2024 13:22:33',
                    user: 'admin@company.com',
                    action: 'Create New Role',
                    resource: 'Roles',
                    status: 'Success',
                    details: 'Created "Analyst" role',
                  },
                  {
                    timestamp: 'Jun 19, 2024 12:55:18',
                    user: 'sarah.smith@company.com',
                    action: 'Export Data',
                    resource: 'Reports #567',
                    status: 'Success',
                    details: 'CSV format, 1500 records',
                  },
                  {
                    timestamp: 'Jun 19, 2024 12:30:44',
                    user: 'admin@company.com',
                    action: 'Delete User',
                    resource: 'User #5678',
                    status: 'Success',
                    details: 'Inactive user removed',
                  },
                  {
                    timestamp: 'Jun 19, 2024 11:45:12',
                    user: 'mike.johnson@company.com',
                    action: 'Access Denied',
                    resource: 'Admin Panel',
                    status: 'Failed',
                    details: 'Insufficient permissions',
                  },
                  {
                    timestamp: 'Jun 19, 2024 11:22:55',
                    user: 'system',
                    action: 'API Call',
                    resource: '/api/reports',
                    status: 'Success',
                    details: 'Response time: 245ms',
                  },
                ].map((log, idx) => (
                  <tr key={idx} className="border-b border-border hover:bg-muted/50 transition-colors">
                    <td className="py-3 px-4 text-muted-foreground">{log.timestamp}</td>
                    <td className="py-3 px-4 text-foreground">{log.user}</td>
                    <td className="py-3 px-4 text-foreground font-medium">{log.action}</td>
                    <td className="py-3 px-4 text-foreground">{log.resource}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          log.status === 'Success'
                            ? 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-100'
                            : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-100'
                        }`}
                      >
                        {log.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground text-xs">{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-6 border-0 shadow-sm">
            <p className="text-sm text-muted-foreground mb-1">Total Logs (30 days)</p>
            <p className="text-3xl font-bold text-foreground">24,582</p>
            <p className="text-xs text-muted-foreground mt-2">Average 819 per day</p>
          </Card>

          <Card className="p-6 border-0 shadow-sm">
            <p className="text-sm text-muted-foreground mb-1">Successful Actions</p>
            <p className="text-3xl font-bold text-green-600">99.8%</p>
            <p className="text-xs text-muted-foreground mt-2">49 failed attempts</p>
          </Card>

          <Card className="p-6 border-0 shadow-sm">
            <p className="text-sm text-muted-foreground mb-1">Active Users Logged</p>
            <p className="text-3xl font-bold text-foreground">287</p>
            <p className="text-xs text-muted-foreground mt-2">In last 30 days</p>
          </Card>
        </div>
      </div>
    </div>
  )
}
