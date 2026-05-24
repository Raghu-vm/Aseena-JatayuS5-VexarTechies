'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RayMascot } from './ray-mascot'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { ChevronRight } from 'lucide-react'

interface Settings {
  notifications: boolean
  darkMode: boolean
  autoSave: boolean
  anonymizeData: boolean
  confidenceThreshold: number
  maxResults: number
}

interface SettingsPageProps {
  role?: 'admin' | 'executive' | 'employee'
}

export function SettingsPage({ role = 'employee' }: SettingsPageProps) {
  const [settings, setSettings] = useState<Settings>({
    notifications: true,
    darkMode: false,
    autoSave: true,
    anonymizeData: false,
    confidenceThreshold: 80,
    maxResults: 5,
  })

  const handleToggle = (key: keyof Omit<Settings, 'confidenceThreshold' | 'maxResults'>) => {
    setSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  const handleSliderChange = (key: 'confidenceThreshold' | 'maxResults', value: number[]) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value[0],
    }))
  }

  return (
    <div className="flex-1 overflow-y-auto p-8 bg-background">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header with RAY */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Settings</h1>
            <p className="text-muted-foreground">
              Configure RAY and customize your experience
            </p>
          </div>
          <RayMascot size="lg" role={role} />
        </div>

        {/* General Settings */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
            <span className="text-2xl">⚙️</span> General Settings
          </h2>
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 rounded-lg hover:bg-muted hover:bg-opacity-30 transition-colors">
              <div>
                <p className="font-medium text-foreground">Notifications</p>
                <p className="text-sm text-muted-foreground">
                  Receive updates about queries and system events
                </p>
              </div>
              <Switch
                checked={settings.notifications}
                onCheckedChange={() => handleToggle('notifications')}
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg hover:bg-muted hover:bg-opacity-30 transition-colors">
              <div>
                <p className="font-medium text-foreground">Dark Mode</p>
                <p className="text-sm text-muted-foreground">
                  Use dark theme for better visibility at night
                </p>
              </div>
              <Switch
                checked={settings.darkMode}
                onCheckedChange={() => handleToggle('darkMode')}
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg hover:bg-muted hover:bg-opacity-30 transition-colors">
              <div>
                <p className="font-medium text-foreground">Auto-Save</p>
                <p className="text-sm text-muted-foreground">
                  Automatically save chat history and preferences
                </p>
              </div>
              <Switch
                checked={settings.autoSave}
                onCheckedChange={() => handleToggle('autoSave')}
              />
            </div>
          </div>
        </Card>

        {/* Privacy Settings */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
            <span className="text-2xl">🔒</span> Privacy & Security
          </h2>
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 rounded-lg hover:bg-muted hover:bg-opacity-30 transition-colors">
              <div>
                <p className="font-medium text-foreground">Anonymize Data</p>
                <p className="text-sm text-muted-foreground">
                  Remove personally identifiable information from logs
                </p>
              </div>
              <Switch
                checked={settings.anonymizeData}
                onCheckedChange={() => handleToggle('anonymizeData')}
              />
            </div>

            <Button variant="outline" className="w-full justify-between">
              <span>Change Password</span>
              <ChevronRight className="h-4 w-4" />
            </Button>

            <Button variant="outline" className="w-full justify-between">
              <span>Two-Factor Authentication</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </Card>

        {/* AI Settings */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
            <span className="text-2xl">🤖</span> RAY AI Settings
          </h2>
          <div className="space-y-6">
            <div className="p-4 rounded-lg hover:bg-muted hover:bg-opacity-30 transition-colors">
              <div className="flex justify-between items-center mb-3">
                <label className="font-medium text-foreground">
                  Confidence Threshold
                </label>
                <span className="text-sm font-semibold text-primary">
                  {settings.confidenceThreshold}%
                </span>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                RAY will only show results above this confidence level
              </p>
              <Slider
                value={[settings.confidenceThreshold]}
                onValueChange={(value) =>
                  handleSliderChange('confidenceThreshold', value)
                }
                min={0}
                max={100}
                step={5}
                className="w-full"
              />
            </div>

            <div className="p-4 rounded-lg hover:bg-muted hover:bg-opacity-30 transition-colors">
              <div className="flex justify-between items-center mb-3">
                <label className="font-medium text-foreground">
                  Maximum Results
                </label>
                <span className="text-sm font-semibold text-primary">
                  {settings.maxResults}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                Number of sources to display per response
              </p>
              <Slider
                value={[settings.maxResults]}
                onValueChange={(value) =>
                  handleSliderChange('maxResults', value)
                }
                min={1}
                max={10}
                step={1}
                className="w-full"
              />
            </div>
          </div>
        </Card>

        {/* Support & About */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
            <span className="text-2xl">❓</span> Support & About
          </h2>
          <div className="space-y-3">
            <Button variant="outline" className="w-full justify-between">
              <span>Documentation</span>
              <ChevronRight className="h-4 w-4" />
            </Button>

            <Button variant="outline" className="w-full justify-between">
              <span>Contact Support</span>
              <ChevronRight className="h-4 w-4" />
            </Button>

            <Button variant="outline" className="w-full justify-between">
              <span>About RAY v1.0</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button className="flex-1 rounded-full">Save Settings</Button>
          <Button variant="outline" className="flex-1 rounded-full">
            Reset to Defaults
          </Button>
        </div>
      </div>
    </div>
  )
}
