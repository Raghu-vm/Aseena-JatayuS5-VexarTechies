'use client'

import { useState, useEffect } from 'react'
import { getStoredUsers, saveUsers } from '@/lib/auth-data'
import { Plus, Trash2, Edit2 } from 'lucide-react'
import { ChatInterface } from '@/components/chat-interface'
import { unifiedTheme, cardStyle, buttonStyles, inputStyle, badgeStyle } from '@/lib/design-system'

export function AdminPanel() {
  const [activeTab, setActiveTab] = useState<'credentials' | 'people'>('people')
  const [users, setUsers] = useState<any[]>([])
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingUserId, setEditingUserId] = useState<string | null>(null)
  const [editingData, setEditingData] = useState<any>(null)
  const [newUser, setNewUser] = useState({
    username: '',
    password: '',
    email: '',
    department: '',
  })

  useEffect(() => {
    const stored = getStoredUsers()
    setUsers(stored)
  }, [])

  const handleCreateUser = () => {
    if (!newUser.username.trim() || !newUser.password.trim() || !newUser.email.trim() || !newUser.department.trim()) {
      return
    }

    const userId = String(Math.max(...users.map((u: any) => parseInt(u.id) || 0), 0) + 1)
    const createdUser = {
      id: userId,
      username: newUser.username,
      password: newUser.password,
      email: newUser.email,
      role: 'employee',
      department: newUser.department,
      createdAt: new Date(),
    }

    const updated = [...users, createdUser]
    setUsers(updated)
    saveUsers(updated)
    setNewUser({ username: '', password: '', email: '', department: '' })
    setShowCreateForm(false)
  }

  const handleDeleteUser = (userId: string) => {
    if (userId === '1') return
    const updated = users.filter((u) => u.id !== userId)
    setUsers(updated)
    saveUsers(updated)
  }

  const handleEditUser = (user: any) => {
    setEditingUserId(user.id)
    setEditingData({ ...user })
  }

  const handleSaveEdit = (userId: string) => {
    const updated = users.map((u) => (u.id === userId ? editingData : u))
    setUsers(updated)
    saveUsers(updated)
    setEditingUserId(null)
    setEditingData(null)
  }

  const handleCancelEdit = () => {
    setEditingUserId(null)
    setEditingData(null)
  }

  const departments = ['IT Support', 'HR', 'Finance', 'Sales', 'Operations', 'Marketing']
  const employeeCount = users.filter((u) => u.role === 'employee').length
  const enrichedUsers = users
    .filter((u) => u.role === 'employee')
    .map((u, i) => ({
      ...u,
      name: u.fullName || u.username,
      designation: 'Employee',
      yearsExperience: (i % 10) + 1,
      phone: `+91 98765 43${String(10 + i).slice(-2)}`,
      lastAccess: new Date(Date.now() - i * 60 * 60 * 1000).toLocaleString() + ' • Office',
    }))

  return (
    <div style={{ minHeight: '100%', background: unifiedTheme.backgrounds.page, fontFamily: unifiedTheme.typography.family, color: unifiedTheme.text.primary, padding: 28 }}>
      <div style={{ maxWidth: 1320, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
        <header style={{ ...cardStyle, display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 20, alignItems: 'center' }}>
          <div>
            <p style={{ margin: 0, color: unifiedTheme.text.muted, fontSize: 13, textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: 700 }}>Admin Panel</p>
            <h1 style={{ margin: '10px 0 0', fontSize: 36, fontWeight: 900 }}>People, credentials, and support governance</h1>
            <p style={{ margin: '12px 0 0', color: unifiedTheme.text.secondary, maxWidth: 620, lineHeight: 1.7 }}>A calm and consistent administration experience that mirrors the RAY Desk theme across every section.</p>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button style={{ ...buttonStyles.primary, minWidth: 160 }} onClick={() => setActiveTab('people')}>People & Culture</button>
            <button style={{ ...buttonStyles.secondary, minWidth: 160 }} onClick={() => setActiveTab('credentials')}>Create Employee</button>
          </div>
        </header>

        {activeTab === 'people' && (
          <>
            <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 18 }}>
              <div style={{ ...cardStyle, borderLeft: `4px solid ${unifiedTheme.colors.primary.main}` }}>
                <p style={{ margin: 0, color: unifiedTheme.text.muted, fontSize: 12, textTransform: 'uppercase', fontWeight: 700 }}>Total employees</p>
                <p style={{ margin: '14px 0 0', fontSize: 32, fontWeight: 900 }}>{employeeCount}</p>
              </div>
              <div style={{ ...cardStyle, borderLeft: `4px solid ${unifiedTheme.colors.secondary.main}` }}>
                <p style={{ margin: 0, color: unifiedTheme.text.muted, fontSize: 12, textTransform: 'uppercase', fontWeight: 700 }}>Total users</p>
                <p style={{ margin: '14px 0 0', fontSize: 32, fontWeight: 900 }}>{users.length}</p>
              </div>
              <div style={{ ...cardStyle, borderLeft: `4px solid ${unifiedTheme.colors.accent.main}` }}>
                <p style={{ margin: 0, color: unifiedTheme.text.muted, fontSize: 12, textTransform: 'uppercase', fontWeight: 700 }}>Departments</p>
                <p style={{ margin: '14px 0 0', fontSize: 32, fontWeight: 900 }}>{departments.length}</p>
              </div>
            </section>

            <section style={cardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 18 }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>Employee Directory</h2>
                  <p style={{ margin: '8px 0 0', color: unifiedTheme.text.secondary }}>Clean, compact records with quick actions and status details.</p>
                </div>
                <button style={buttonStyles.primary} onClick={() => setShowCreateForm(true)}>
                  <Plus className="h-4 w-4" />
                  New employee
                </button>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1000 }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', color: unifiedTheme.text.secondary, textTransform: 'uppercase' }}>
                      {['Name', 'Designation', 'Email', 'Department', 'Role', 'Last Access', 'Actions'].map((heading) => (
                        <th key={heading} style={{ padding: '16px 18px', textAlign: 'left', fontSize: 12, fontWeight: 700, letterSpacing: 0.8 }}>{heading}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {enrichedUsers.map((emp, idx) => (
                      <tr key={emp.id} style={{ background: idx % 2 ? '#ffffff' : '#f8fafc' }}>
                        <td style={{ padding: '16px 18px', fontWeight: 700 }}>{emp.name}</td>
                        <td style={{ padding: '16px 18px', color: unifiedTheme.text.secondary }}>{emp.designation}</td>
                        <td style={{ padding: '16px 18px', color: unifiedTheme.colors.primary.main }}>{emp.email}</td>
                        <td style={{ padding: '16px 18px' }}><span style={badgeStyle('#eef2ff', '#1d4ed8')}>{emp.department}</span></td>
                        <td style={{ padding: '16px 18px', color: unifiedTheme.text.secondary }}>{emp.role}</td>
                        <td style={{ padding: '16px 18px', color: unifiedTheme.text.muted }}>{emp.lastAccess}</td>
                        <td style={{ padding: '16px 18px', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                          <button style={{ ...buttonStyles.secondary, padding: '8px 14px', fontSize: 12 }} onClick={() => handleEditUser(emp)}>
                            <Edit2 size={14} /> Edit
                          </button>
                          <button style={{ ...buttonStyles.secondary, padding: '8px 14px', fontSize: 12, background: '#fff3f3', borderColor: '#fca5a5', color: '#b91c1c' }} onClick={() => handleDeleteUser(emp.id)}>
                            <Trash2 size={14} /> Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section style={cardStyle}>
              <div style={{ marginBottom: 18 }}>
                <h3 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>Admin assistant</h3>
                <p style={{ margin: '8px 0 0', color: unifiedTheme.text.secondary }}>Integrated support for quick operations and guidance.</p>
              </div>
              <div style={{ height: 520, borderRadius: unifiedTheme.radius.lg, overflow: 'hidden', border: `1px solid ${unifiedTheme.borders.light}` }}>
                <ChatInterface role="admin" />
              </div>
            </section>
          </>
        )}

        {activeTab === 'credentials' && (
          <section style={{ ...cardStyle, display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>Create new employee credentials</h2>
                <p style={{ margin: '8px 0 0', color: unifiedTheme.text.secondary }}>Add new users to the system with secure defaults and clear permissions.</p>
              </div>
              {!showCreateForm && (
                <button style={buttonStyles.primary} onClick={() => setShowCreateForm(true)}>
                  <Plus className="h-4 w-4" />
                  New employee
                </button>
              )}
            </div>

            {showCreateForm && (
              <div style={{ ...cardStyle, padding: 24, background: '#f8fafc' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 18, marginBottom: 24 }}>
                  <input style={inputStyle} placeholder="Username" value={newUser.username} onChange={(e) => setNewUser({ ...newUser, username: e.target.value })} />
                  <input style={inputStyle} type="email" placeholder="Email" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} />
                  <input style={inputStyle} type="password" placeholder="Password" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} />
                  <select style={inputStyle} value={newUser.department} onChange={(e) => setNewUser({ ...newUser, department: e.target.value })}>
                    <option value="">Select department</option>
                    {departments.map((dept) => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  <button style={{ ...buttonStyles.secondary, padding: '12px 24px' }} onClick={handleCancelEdit}>Cancel</button>
                  <button style={buttonStyles.primary} onClick={handleCreateUser}>Create user</button>
                </div>
              </div>
            )}

            <div style={{ display: 'grid', gap: 16 }}>
              {users.map((user) => (
                <div key={user.id} style={{ ...cardStyle, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                  <div style={{ minWidth: 260 }}>
                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                      <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>{user.username}</h3>
                      <span style={badgeStyle(user.role === 'admin' ? '#fee2e2' : '#dbeafe', user.role === 'admin' ? '#b91c1c' : '#1d4ed8')}>{user.role}</span>
                    </div>
                    <p style={{ margin: '8px 0 0', color: unifiedTheme.text.secondary }}>{user.email} • {user.department}</p>
                  </div>
                  {user.role !== 'admin' && (
                    <button style={{ ...buttonStyles.secondary, padding: '10px 18px', background: '#fff3f3', borderColor: '#fecaca', color: '#991b1b' }} onClick={() => handleDeleteUser(user.id)}>
                      Delete
                    </button>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
