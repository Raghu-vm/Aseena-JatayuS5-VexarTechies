'use client'

import React, { useMemo, useState } from 'react'
import { unifiedTheme, cardStyle, buttonStyles, inputStyle, badgeStyle, getRayTint } from '@/lib/design-system'
import { Plus, X, Trash2, Upload } from 'lucide-react'
import { EmployeeImportModal } from './employee-import-modal'
import type { ImportRow } from '@/lib/employee-import'

type Employee = {
  id: string
  name: string
  designation: string
  experience: number
  email: string
  mobile: string
  docsUploaded: number
  department: string
  employeeId: string
  lastAccess: {
    time: string
    location: string
  } | null
  hasAccess: boolean
  credentialsCreated: boolean
  createdAt: string
}

const initialEmployees: Employee[] = [
  {
    id: '1',
    name: 'Rajesh Kumar',
    designation: 'Senior UX Designer',
    experience: 7,
    email: 'rajesh.kumar@rayinc.com',
    mobile: '+91 98765 43210',
    docsUploaded: 8,
    department: 'Design',
    employeeId: 'EMP-001',
    lastAccess: { time: '09:24 AM', location: 'Bangalore, Karnataka' },
    hasAccess: true,
    credentialsCreated: true,
    createdAt: new Date().toLocaleString('en-IN'),
  },
  {
    id: '2',
    name: 'Priya Singh',
    designation: 'Backend Engineer',
    experience: 5,
    email: 'priya.singh@rayinc.com',
    mobile: '+91 98765 43211',
    docsUploaded: 12,
    department: 'Engineering',
    employeeId: 'EMP-002',
    lastAccess: { time: '01:10 PM', location: 'Hyderabad, Telangana' },
    hasAccess: true,
    credentialsCreated: false,
    createdAt: new Date().toLocaleString('en-IN'),
  },
  {
    id: '3',
    name: 'Vikram Patel',
    designation: 'Finance Analyst',
    experience: 4,
    email: 'vikram.patel@rayinc.com',
    mobile: '+91 98765 43212',
    docsUploaded: 10,
    department: 'Finance',
    employeeId: 'EMP-003',
    lastAccess: { time: '03:45 PM', location: 'Mumbai, Maharashtra' },
    hasAccess: true,
    credentialsCreated: true,
    createdAt: new Date().toLocaleString('en-IN'),
  },
  {
    id: '4',
    name: 'Anjali Sharma',
    designation: 'Product Manager',
    experience: 6,
    email: 'anjali.sharma@rayinc.com',
    mobile: '+91 98765 43213',
    docsUploaded: 9,
    department: 'Product',
    employeeId: 'EMP-004',
    lastAccess: { time: '10:15 AM', location: 'Delhi, NCR' },
    hasAccess: true,
    credentialsCreated: true,
    createdAt: new Date().toLocaleString('en-IN'),
  },
  {
    id: '5',
    name: 'Arjun Reddy',
    designation: 'DevOps Engineer',
    experience: 5,
    email: 'arjun.reddy@rayinc.com',
    mobile: '+91 98765 43214',
    docsUploaded: 11,
    department: 'Infrastructure',
    employeeId: 'EMP-005',
    lastAccess: { time: '02:30 PM', location: 'Pune, Maharashtra' },
    hasAccess: true,
    credentialsCreated: true,
    createdAt: new Date().toLocaleString('en-IN'),
  },
  {
    id: '6',
    name: 'Neha Gupta',
    designation: 'Frontend Developer',
    experience: 3,
    email: 'neha.gupta@rayinc.com',
    mobile: '+91 98765 43215',
    docsUploaded: 7,
    department: 'Engineering',
    employeeId: 'EMP-006',
    lastAccess: { time: '11:45 AM', location: 'Bangalore, Karnataka' },
    hasAccess: true,
    credentialsCreated: false,
    createdAt: new Date().toLocaleString('en-IN'),
  },
  {
    id: '7',
    name: 'Sanjay Verma',
    designation: 'Data Analyst',
    experience: 4,
    email: 'sanjay.verma@rayinc.com',
    mobile: '+91 98765 43216',
    docsUploaded: 10,
    department: 'Analytics',
    employeeId: 'EMP-007',
    lastAccess: { time: '04:20 PM', location: 'Indore, Madhya Pradesh' },
    hasAccess: true,
    credentialsCreated: true,
    createdAt: new Date().toLocaleString('en-IN'),
  },
  {
    id: '8',
    name: 'Divya Nair',
    designation: 'QA Engineer',
    experience: 3,
    email: 'divya.nair@rayinc.com',
    mobile: '+91 98765 43217',
    docsUploaded: 8,
    department: 'Quality Assurance',
    employeeId: 'EMP-008',
    lastAccess: { time: '02:15 PM', location: 'Kochi, Kerala' },
    hasAccess: true,
    credentialsCreated: true,
    createdAt: new Date().toLocaleString('en-IN'),
  },
  {
    id: '9',
    name: 'Rohit Joshi',
    designation: 'Business Analyst',
    experience: 5,
    email: 'rohit.joshi@rayinc.com',
    mobile: '+91 98765 43218',
    docsUploaded: 9,
    department: 'Business',
    employeeId: 'EMP-009',
    lastAccess: { time: '09:50 AM', location: 'Ahmedabad, Gujarat' },
    hasAccess: true,
    credentialsCreated: false,
    createdAt: new Date().toLocaleString('en-IN'),
  },
  {
    id: '10',
    name: 'Meera Kapoor',
    designation: 'HR Manager',
    experience: 7,
    email: 'meera.kapoor@rayinc.com',
    mobile: '+91 98765 43219',
    docsUploaded: 12,
    department: 'Human Resources',
    employeeId: 'EMP-010',
    lastAccess: { time: '05:30 PM', location: 'Chandigarh, Punjab' },
    hasAccess: true,
    credentialsCreated: true,
    createdAt: new Date().toLocaleString('en-IN'),
  },
]

export default function UserManagement() {
  const [employees, setEmployees] = useState<Employee[]>(initialEmployees)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [importedSummary, setImportedSummary] = useState<string>('')
  const [formData, setFormData] = useState({
    name: '',
    designation: '',
    experience: '',
    email: '',
    mobile: '',
    department: 'Engineering',
    employeeId: '',
  })

  const stats = useMemo(
    () => ({
      total: employees.length,
      active: employees.filter((emp) => emp.hasAccess).length,
      departments: new Set(employees.map((emp) => emp.department)).size,
      pendingDocs: employees.filter((emp) => emp.docsUploaded < 10).length,
    }),
    [employees]
  )

  const createEmployee = () => {
    if (!formData.name || !formData.designation || !formData.email || !formData.mobile) {
      alert('Please fill all required fields')
      return
    }
    const newEmployee: Employee = {
      id: `${Date.now()}`,
      name: formData.name,
      designation: formData.designation,
      experience: parseInt(formData.experience) || 1,
      email: formData.email,
      mobile: formData.mobile,
      docsUploaded: 0,
      department: formData.department,
      employeeId: formData.employeeId || `EMP-${String(employees.length + 1).padStart(3, '0')}`,
      lastAccess: null,
      hasAccess: false,
      credentialsCreated: false,
      createdAt: new Date().toLocaleString('en-IN'),
    }
    setEmployees((prev) => [newEmployee, ...prev])
    setFormData({ name: '', designation: '', experience: '', email: '', mobile: '', department: 'Engineering', employeeId: '' })
    setShowCreateForm(false)
  }

  const deleteEmployee = (id: string) => {
    setEmployees((prev) => prev.filter((employee) => employee.id !== id))
  }

  const handleImport = (rows: ImportRow[]) => {
    // Convert ImportRow → Employee and prepend.
    // We do one final dedup pass against the CURRENT employees state
    // (in case state changed between modal open and commit).
    const existingEmails = new Set(employees.map((e) => e.email.toLowerCase().trim()))
    const existingIds = new Set(employees.map((e) => e.employeeId.toLowerCase().trim()))

    const now = new Date()
    const ts = now.toLocaleString('en-IN')
    let skippedAtCommit = 0
    const nextIdNum = employees.length + 1

    const newEmployees: Employee[] = []
    rows.forEach((row, idx) => {
      const email = row.email.toLowerCase().trim()
      const id = row.employeeId.toLowerCase().trim()
      if (existingEmails.has(email) || (id && existingIds.has(id))) {
        skippedAtCommit++
        return
      }
      existingEmails.add(email)
      if (id) existingIds.add(id)
      newEmployees.push({
        id: `${now.getTime()}-${idx}`,
        name: row.name.trim(),
        designation: row.designation.trim(),
        experience: parseInt(row.experience, 10) || 1,
        email: row.email.trim(),
        mobile: row.mobile.trim(),
        docsUploaded: 0,
        department: row.department.trim() || 'Engineering',
        employeeId: row.employeeId.trim() || `EMP-${String(nextIdNum + idx).padStart(3, '0')}`,
        lastAccess: null,
        hasAccess: false,
        credentialsCreated: false,
        createdAt: ts,
      })
    })

    setEmployees((prev) => [...newEmployees, ...prev])

    const parts: string[] = []
    parts.push(`${newEmployees.length} imported`)
    if (skippedAtCommit > 0) parts.push(`${skippedAtCommit} skipped (duplicate)`)
    setImportedSummary(parts.join(' · '))
    // Auto-clear the toast after 6s
    setTimeout(() => setImportedSummary(''), 6000)
  }

  const createCredentials = (id: string) => {
    setEmployees((prev) =>
      prev.map((employee) =>
        employee.id === id
          ? { ...employee, credentialsCreated: true, hasAccess: true, lastAccess: { time: new Date().toLocaleTimeString('en-IN'), location: 'Office' } }
          : employee
      )
    )
  }

  return (
    <section style={{ minHeight: '100%', padding: 28, fontFamily: unifiedTheme.typography.family, color: unifiedTheme.text.primary, background: getRayTint('admin').pageBackground }}>
      <div style={{ maxWidth: 1320, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
        
        {/* Header */}
        <header style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: 18 }}>
          <div>
            <p style={{ margin: 0, fontSize: 11, letterSpacing: 1.6, textTransform: 'uppercase', color: unifiedTheme.text.secondary, fontWeight: 700 }}>People Management</p>
            <h1 style={{ margin: '10px 0 0', fontSize: 36, lineHeight: 1.05, fontWeight: 900 }}>Employee Directory</h1>
            <p style={{ margin: '12px 0 0', color: unifiedTheme.text.secondary, maxWidth: 640, lineHeight: 1.6, fontSize: 13 }}>Manage employee records, credentials, and access with professional efficiency.</p>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button
              style={{ ...buttonStyles.secondary, minWidth: 140, padding: '12px 20px', fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 8 }}
              onClick={() => setShowImportModal(true)}
            >
              <Upload size={14} />
              Import from Excel
            </button>
            <button style={{ ...buttonStyles.primary, minWidth: 150, padding: '12px 24px', fontSize: 13 }} onClick={() => setShowCreateForm(true)}>
              + Add Employee
            </button>
          </div>
        </header>

        {/* Stats Cards */}
        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
          <div style={{ ...cardStyle, borderLeft: `3px solid ${unifiedTheme.colors.primary.main}` }}>
            <p style={{ margin: 0, color: unifiedTheme.text.muted, fontSize: 11, textTransform: 'uppercase', fontWeight: 700, letterSpacing: 0.8 }}>Total Employees</p>
            <p style={{ margin: '12px 0 0', fontSize: 28, fontWeight: 900 }}>{stats.total}</p>
          </div>
          <div style={{ ...cardStyle, borderLeft: `3px solid ${unifiedTheme.colors.accent.main}` }}>
            <p style={{ margin: 0, color: unifiedTheme.text.muted, fontSize: 11, textTransform: 'uppercase', fontWeight: 700, letterSpacing: 0.8 }}>Active Access</p>
            <p style={{ margin: '12px 0 0', fontSize: 28, fontWeight: 900 }}>{stats.active}</p>
          </div>
          <div style={{ ...cardStyle, borderLeft: `3px solid ${unifiedTheme.colors.secondary.main}` }}>
            <p style={{ margin: 0, color: unifiedTheme.text.muted, fontSize: 11, textTransform: 'uppercase', fontWeight: 700, letterSpacing: 0.8 }}>Departments</p>
            <p style={{ margin: '12px 0 0', fontSize: 28, fontWeight: 900 }}>{stats.departments}</p>
          </div>
          <div style={{ ...cardStyle, borderLeft: `3px solid ${unifiedTheme.colors.warning.main}` }}>
            <p style={{ margin: 0, color: unifiedTheme.text.muted, fontSize: 11, textTransform: 'uppercase', fontWeight: 700, letterSpacing: 0.8 }}>Pending Docs</p>
            <p style={{ margin: '12px 0 0', fontSize: 28, fontWeight: 900 }}>{stats.pendingDocs}</p>
          </div>
        </section>

        {/* Create Form */}
        {showCreateForm && (
          <section style={{ ...cardStyle, padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>Create employee record</h2>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: unifiedTheme.text.secondary }} onClick={() => setShowCreateForm(false)}>
                <X size={20} />
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 16 }}>
              <input style={inputStyle} placeholder="Full name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
              <input style={inputStyle} placeholder="Designation" value={formData.designation} onChange={(e) => setFormData({ ...formData, designation: e.target.value })} />
              <input style={inputStyle} type="number" placeholder="Experience (years)" value={formData.experience} onChange={(e) => setFormData({ ...formData, experience: e.target.value })} />
              <input style={inputStyle} placeholder="Email address" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
              <input style={inputStyle} placeholder="Mobile number" value={formData.mobile} onChange={(e) => setFormData({ ...formData, mobile: e.target.value })} />
              <select style={inputStyle} value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value })}>
                <option>Engineering</option>
                <option>Design</option>
                <option>Finance</option>
                <option>Product</option>
                <option>HR</option>
                <option>Operations</option>
              </select>
              <input style={inputStyle} placeholder="Employee ID" value={formData.employeeId} onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button style={{ ...buttonStyles.secondary, padding: '10px 20px', fontSize: 13 }} onClick={() => setShowCreateForm(false)}>Cancel</button>
              <button style={{ ...buttonStyles.primary, padding: '10px 20px', fontSize: 13 }} onClick={createEmployee}>Create employee</button>
            </div>
          </section>
        )}

        {/* Employee Table */}
        <section style={cardStyle}>
          <div style={{ padding: '18px 20px', borderBottom: `1px solid ${unifiedTheme.borders.light}` }}>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>Employee Directory</h2>
            <p style={{ margin: '6px 0 0', color: unifiedTheme.text.secondary, fontSize: 12 }}>{employees.length} employee{employees.length !== 1 ? 's' : ''} in system</p>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1100 }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['Name', 'Designation', 'Experience', 'Email', 'Mobile', 'Department', 'Employee ID', 'Access', 'Actions'].map((h) => (
                    <th key={h} style={{ padding: '14px 16px', textAlign: 'left', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: unifiedTheme.text.muted, letterSpacing: 0.8, borderBottom: `1px solid ${unifiedTheme.borders.light}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {employees.length > 0 ? employees.map((employee, idx) => (
                  <tr key={employee.id} style={{ borderBottom: `1px solid ${unifiedTheme.borders.light}`, background: idx % 2 ? '#f8fafc' : '#fff' }}>
                    <td style={{ padding: '14px 16px', fontWeight: 700, fontSize: 13 }}>{employee.name}</td>
                    <td style={{ padding: '14px 16px', color: unifiedTheme.text.secondary, fontSize: 12 }}>{employee.designation}</td>
                    <td style={{ padding: '14px 16px', color: unifiedTheme.text.secondary, fontSize: 12 }}>{employee.experience} yrs</td>
                    <td style={{ padding: '14px 16px', color: unifiedTheme.colors.primary.main, fontSize: 12 }}>{employee.email}</td>
                    <td style={{ padding: '14px 16px', color: unifiedTheme.text.secondary, fontSize: 12 }}>{employee.mobile}</td>
                    <td style={{ padding: '14px 16px' }}><span style={badgeStyle('#F4EFFF', '#4A2FCC')}>{employee.department}</span></td>
                    <td style={{ padding: '14px 16px', color: unifiedTheme.text.secondary, fontSize: 11, fontFamily: 'var(--font-mono)' }}>{employee.employeeId}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ ...badgeStyle(employee.hasAccess ? '#dcfce7' : '#fee2e2', employee.hasAccess ? '#15803d' : '#b91c1c'), fontSize: 11 }}>
                        {employee.hasAccess ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <button style={{ ...buttonStyles.secondary, padding: '6px 12px', fontSize: 11 }} onClick={() => createCredentials(employee.id)}>
                        {employee.credentialsCreated ? 'Creds ✓' : 'Add Creds'}
                      </button>
                      <button style={{ background: '#fff3f3', border: '1px solid #fca5a5', color: '#b91c1c', padding: '6px 12px', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer' }} onClick={() => deleteEmployee(employee.id)}>
                        <Trash2 size={12} style={{ display: 'inline', marginRight: 4 }} />
                        Delete
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={9} style={{ padding: '32px', textAlign: 'center', color: unifiedTheme.text.muted, fontSize: 13 }}>No employees found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

      </div>

      {/* Import success toast — appears briefly after a successful import */}
      {importedSummary && (
        <div
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            background: '#fff',
            border: `1px solid ${unifiedTheme.borders.medium}`,
            borderLeft: `3px solid ${unifiedTheme.colors.secondary.main}`,
            borderRadius: 10,
            padding: '12px 16px',
            boxShadow: '0 8px 24px rgba(45, 27, 92, 0.15)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            zIndex: 999,
            fontSize: 13,
            fontWeight: 500,
            color: unifiedTheme.text.primary,
          }}
        >
          <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: unifiedTheme.colors.secondary.main }} />
          {importedSummary}
        </div>
      )}

      {/* Excel import modal */}
      <EmployeeImportModal
        open={showImportModal}
        onClose={() => setShowImportModal(false)}
        existing={employees.map((e) => ({ email: e.email, employeeId: e.employeeId }))}
        onImport={handleImport}
      />
    </section>
  )
}
