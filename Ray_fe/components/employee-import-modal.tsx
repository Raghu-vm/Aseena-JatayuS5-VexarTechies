'use client'

/**
 * Employee import modal.
 *
 * Two-screen flow:
 *   1) Upload   — drop zone + browse + template download
 *   2) Preview  — table of parsed rows, each editable, errors/dupes flagged,
 *                 user can skip rows or fix in-place before committing
 *
 * Returns the list of imported rows via onImport(). Parent owns the actual
 * append to its employee list — keeps this modal stateless about your data.
 */

import { useRef, useState } from 'react'
import { X, Upload, FileSpreadsheet, AlertCircle, CheckCircle2, Download, ArrowLeft } from 'lucide-react'
import {
  unifiedTheme,
  buttonStyles,
  inputStyle,
  badgeStyle,
  rayColors,
} from '@/lib/design-system'
import {
  parseEmployeeFile,
  flagDuplicates,
  downloadTemplate,
  TEMPLATE_HEADERS,
  type ImportRow,
} from '@/lib/employee-import'

interface EmployeeImportModalProps {
  open: boolean
  onClose: () => void
  /** existing emails + employeeIds, used for dedup */
  existing: { email: string; employeeId: string }[]
  /** called when user clicks "Import selected" — rows already filtered to shouldImport=true */
  onImport: (rows: ImportRow[]) => void
}

type Screen = 'upload' | 'preview'

export function EmployeeImportModal({ open, onClose, existing, onImport }: EmployeeImportModalProps) {
  const [screen, setScreen] = useState<Screen>('upload')
  const [isDragging, setIsDragging] = useState(false)
  const [isParsing, setIsParsing] = useState(false)
  const [rows, setRows] = useState<ImportRow[]>([])
  const [fileName, setFileName] = useState('')
  const [fatalError, setFatalError] = useState('')
  const [unmappedHeaders, setUnmappedHeaders] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!open) return null

  // ---------- Reset ----------
  const reset = () => {
    setScreen('upload')
    setRows([])
    setFileName('')
    setFatalError('')
    setUnmappedHeaders([])
    setIsParsing(false)
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  // ---------- File handling ----------
  const handleFile = async (file: File) => {
    setFileName(file.name)
    setFatalError('')
    setIsParsing(true)
    try {
      const result = await parseEmployeeFile(file)
      if (result.fatalError) {
        setFatalError(result.fatalError)
        setUnmappedHeaders(result.unmappedHeaders)
        setIsParsing(false)
        return
      }
      if (result.rows.length === 0) {
        setFatalError('The file has headers but no data rows.')
        setIsParsing(false)
        return
      }
      const flagged = flagDuplicates(result.rows, existing)
      setRows(flagged)
      setUnmappedHeaders(result.unmappedHeaders)
      setScreen('preview')
    } catch (err: any) {
      setFatalError(`Couldn't parse the file: ${err?.message || 'unknown error'}`)
    } finally {
      setIsParsing(false)
    }
  }

  // ---------- Drag/drop ----------
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }
  const handleBrowse = () => fileInputRef.current?.click()
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  // ---------- Row editing ----------
  const updateRow = (rowNumber: number, field: keyof ImportRow, value: string) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.rowNumber !== rowNumber) return r
        // Update field, re-run validation locally for this row
        const updated = { ...r, [field]: value }
        // Lightweight re-validate — copies the logic from validateRow
        const errors: string[] = []
        if (!updated.name.trim()) errors.push('Name is required')
        if (!updated.designation.trim()) errors.push('Designation is required')
        if (!updated.email.trim()) errors.push('Email is required')
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(updated.email.trim())) errors.push('Email format looks invalid')
        if (!updated.mobile.trim()) errors.push('Mobile is required')
        if (updated.experience.trim() && Number.isNaN(parseInt(updated.experience, 10))) errors.push('Experience must be a number')
        return { ...updated, errors, shouldImport: errors.length === 0 && !updated.isDuplicate }
      })
    )
  }

  const toggleShouldImport = (rowNumber: number) => {
    setRows((prev) =>
      prev.map((r) => (r.rowNumber === rowNumber ? { ...r, shouldImport: !r.shouldImport } : r))
    )
  }

  // ---------- Commit ----------
  const handleCommit = () => {
    const selected = rows.filter((r) => r.shouldImport && r.errors.length === 0)
    if (selected.length === 0) {
      alert('No rows selected for import.')
      return
    }
    onImport(selected)
    handleClose()
  }

  // ---------- Summary ----------
  const summary = {
    total: rows.length,
    valid: rows.filter((r) => r.errors.length === 0).length,
    errors: rows.filter((r) => r.errors.length > 0).length,
    duplicates: rows.filter((r) => r.isDuplicate).length,
    willImport: rows.filter((r) => r.shouldImport && r.errors.length === 0).length,
  }

  return (
    <div
      onClick={handleClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(45, 27, 92, 0.45)',
        backdropFilter: 'blur(4px)',
        zIndex: 1000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#fff',
          borderRadius: 14,
          maxWidth: screen === 'preview' ? 1200 : 600,
          width: '100%',
          maxHeight: '90vh',
          display: 'flex', flexDirection: 'column',
          fontFamily: unifiedTheme.typography.family,
          color: unifiedTheme.text.primary,
          boxShadow: '0 20px 50px rgba(45, 27, 92, 0.25)',
        }}
      >
        {/* Header */}
        <header style={{ padding: '20px 24px', borderBottom: `1px solid ${unifiedTheme.borders.light}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {screen === 'preview' && (
              <button
                onClick={() => reset()}
                aria-label="Back to upload"
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: unifiedTheme.text.secondary, padding: 4, display: 'flex' }}
              >
                <ArrowLeft size={18} />
              </button>
            )}
            <div>
              <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>
                {screen === 'upload' ? 'Import employees from Excel' : 'Review before importing'}
              </h2>
              <p style={{ margin: '3px 0 0', fontSize: 12, color: unifiedTheme.text.secondary }}>
                {screen === 'upload'
                  ? '.xlsx, .xls, or .csv — up to a few thousand rows'
                  : `${fileName} · ${summary.total} row${summary.total !== 1 ? 's' : ''} parsed`}
              </p>
            </div>
          </div>
          <button onClick={handleClose} aria-label="Close" style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: unifiedTheme.text.secondary, padding: 4, display: 'flex' }}>
            <X size={20} />
          </button>
        </header>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
          {screen === 'upload' ? (
            <UploadScreen
              isDragging={isDragging}
              isParsing={isParsing}
              fatalError={fatalError}
              unmappedHeaders={unmappedHeaders}
              fileName={fileName}
              fileInputRef={fileInputRef}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onBrowse={handleBrowse}
              onFileInput={handleFileInput}
            />
          ) : (
            <PreviewScreen
              rows={rows}
              summary={summary}
              unmappedHeaders={unmappedHeaders}
              onUpdate={updateRow}
              onToggleSkip={toggleShouldImport}
            />
          )}
        </div>

        {/* Footer */}
        <footer style={{ padding: '14px 24px', borderTop: `1px solid ${unifiedTheme.borders.light}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          {screen === 'upload' ? (
            <>
              <button
                onClick={downloadTemplate}
                style={{ background: 'transparent', border: 'none', color: rayColors.purple600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, padding: 0 }}
              >
                <Download size={14} />
                Download template
              </button>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={handleClose} style={{ ...buttonStyles.secondary, padding: '8px 18px', fontSize: 13 }}>Cancel</button>
              </div>
            </>
          ) : (
            <>
              <p style={{ margin: 0, fontSize: 12, color: unifiedTheme.text.secondary }}>
                <strong style={{ color: rayColors.cyan600 }}>{summary.willImport}</strong> will be imported
                {summary.errors > 0 && <> · <strong style={{ color: rayColors.danger }}>{summary.errors}</strong> with errors</>}
                {summary.duplicates > 0 && <> · <strong style={{ color: rayColors.warning }}>{summary.duplicates}</strong> duplicates</>}
              </p>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={handleClose} style={{ ...buttonStyles.secondary, padding: '8px 18px', fontSize: 13 }}>Cancel</button>
                <button
                  onClick={handleCommit}
                  disabled={summary.willImport === 0}
                  style={{
                    ...buttonStyles.primary,
                    padding: '8px 18px',
                    fontSize: 13,
                    opacity: summary.willImport === 0 ? 0.5 : 1,
                    cursor: summary.willImport === 0 ? 'not-allowed' : 'pointer',
                  }}
                >
                  Import {summary.willImport} employee{summary.willImport !== 1 ? 's' : ''}
                </button>
              </div>
            </>
          )}
        </footer>
      </div>
    </div>
  )
}

// ============================================================
// SCREEN 1 — Upload
// ============================================================

function UploadScreen({
  isDragging, isParsing, fatalError, unmappedHeaders, fileName,
  fileInputRef, onDragOver, onDragLeave, onDrop, onBrowse, onFileInput,
}: {
  isDragging: boolean
  isParsing: boolean
  fatalError: string
  unmappedHeaders: string[]
  fileName: string
  fileInputRef: React.RefObject<HTMLInputElement | null>
  onDragOver: (e: React.DragEvent) => void
  onDragLeave: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent) => void
  onBrowse: () => void
  onFileInput: (e: React.ChangeEvent<HTMLInputElement>) => void
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* Drop zone */}
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={onBrowse}
        style={{
          border: `2px dashed ${isDragging ? rayColors.purple500 : unifiedTheme.borders.medium}`,
          background: isDragging ? rayColors.purple50 : rayColors.paper,
          borderRadius: 12,
          padding: '48px 24px',
          textAlign: 'center',
          cursor: 'pointer',
          transition: 'all 150ms ease',
        }}
      >
        <FileSpreadsheet size={48} style={{ margin: '0 auto', color: rayColors.purple500, opacity: 0.8 }} />
        <p style={{ margin: '12px 0 4px', fontSize: 15, fontWeight: 600 }}>
          {isParsing ? 'Reading file…' : isDragging ? 'Drop the file here' : 'Drop Excel file or click to browse'}
        </p>
        <p style={{ margin: 0, fontSize: 12, color: unifiedTheme.text.secondary }}>
          .xlsx · .xls · .csv
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv"
          onChange={onFileInput}
          style={{ display: 'none' }}
        />
      </div>

      {/* Fatal error */}
      {fatalError && (
        <div style={{
          background: '#FEF2F2',
          border: `1px solid #FECACA`,
          borderRadius: 10,
          padding: 14,
          display: 'flex',
          gap: 10,
          alignItems: 'flex-start',
        }}>
          <AlertCircle size={18} style={{ color: rayColors.danger, flexShrink: 0, marginTop: 1 }} />
          <div>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: rayColors.danger }}>{fileName || 'File error'}</p>
            <p style={{ margin: '4px 0 0', fontSize: 12, color: '#7F1D1D' }}>{fatalError}</p>
          </div>
        </div>
      )}

      {/* Expected columns */}
      <div style={{ background: rayColors.purple50, borderRadius: 10, padding: 14 }}>
        <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: rayColors.purple700, textTransform: 'uppercase', letterSpacing: 0.8 }}>
          Expected columns
        </p>
        <p style={{ margin: '6px 0 10px', fontSize: 12, color: unifiedTheme.text.secondary, lineHeight: 1.6 }}>
          Headers are case-insensitive. Required columns are <strong>Name</strong>, <strong>Designation</strong>, <strong>Email</strong>, <strong>Mobile</strong>.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {TEMPLATE_HEADERS.map((h) => {
            const required = ['Name', 'Designation', 'Email', 'Mobile'].includes(h)
            return (
              <span
                key={h}
                style={{
                  ...badgeStyle(required ? rayColors.purple100 : '#fff', required ? rayColors.purple700 : unifiedTheme.text.secondary),
                  border: required ? 'none' : `1px solid ${unifiedTheme.borders.medium}`,
                  fontSize: 11,
                }}
              >
                {h}{required && ' *'}
              </span>
            )
          })}
        </div>

        {unmappedHeaders.length > 0 && (
          <p style={{ margin: '10px 0 0', fontSize: 11, color: unifiedTheme.text.secondary, lineHeight: 1.5 }}>
            <strong>Unmapped columns in your file:</strong> {unmappedHeaders.join(', ')} — these will be ignored.
          </p>
        )}
      </div>
    </div>
  )
}

// ============================================================
// SCREEN 2 — Preview
// ============================================================

function PreviewScreen({
  rows, summary, unmappedHeaders, onUpdate, onToggleSkip,
}: {
  rows: ImportRow[]
  summary: { total: number; valid: number; errors: number; duplicates: number; willImport: number }
  unmappedHeaders: string[]
  onUpdate: (rowNumber: number, field: keyof ImportRow, value: string) => void
  onToggleSkip: (rowNumber: number) => void
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Summary chips */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        <SummaryChip label="Total rows" value={summary.total} color={rayColors.inkSoft} />
        <SummaryChip label="Ready to import" value={summary.willImport} color={rayColors.cyan600} />
        <SummaryChip label="With errors" value={summary.errors} color={rayColors.danger} dimIfZero />
        <SummaryChip label="Duplicates" value={summary.duplicates} color={rayColors.warning} dimIfZero />
      </div>

      {unmappedHeaders.length > 0 && (
        <p style={{ margin: 0, fontSize: 11, color: unifiedTheme.text.secondary, padding: '8px 12px', background: rayColors.purple50, borderRadius: 8 }}>
          <strong>Ignored columns:</strong> {unmappedHeaders.join(', ')}
        </p>
      )}

      {/* Table */}
      <div style={{ border: `1px solid ${unifiedTheme.borders.light}`, borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto', maxHeight: '50vh' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1100 }}>
            <thead style={{ position: 'sticky', top: 0, background: rayColors.purple50, zIndex: 1 }}>
              <tr>
                {['', 'Row', 'Name', 'Designation', 'Exp', 'Email', 'Mobile', 'Department', 'Employee ID', 'Status'].map((h, i) => (
                  <th key={i} style={{
                    padding: '10px 10px',
                    textAlign: 'left',
                    fontSize: 10,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    color: rayColors.purple700,
                    letterSpacing: 0.6,
                    borderBottom: `1px solid ${unifiedTheme.borders.medium}`,
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const hasErrors = row.errors.length > 0
                const dim = !row.shouldImport
                const rowBg = hasErrors ? '#FEF2F2' : row.isDuplicate ? '#FFFBEB' : '#fff'
                return (
                  <tr
                    key={row.rowNumber}
                    style={{
                      borderBottom: `1px solid ${unifiedTheme.borders.light}`,
                      background: rowBg,
                      opacity: dim ? 0.5 : 1,
                    }}
                  >
                    <td style={cellStyle}>
                      <input
                        type="checkbox"
                        checked={row.shouldImport}
                        onChange={() => onToggleSkip(row.rowNumber)}
                        disabled={hasErrors}
                        style={{ width: 16, height: 16, cursor: hasErrors ? 'not-allowed' : 'pointer', accentColor: rayColors.purple500 }}
                      />
                    </td>
                    <td style={{ ...cellStyle, color: unifiedTheme.text.secondary, fontSize: 11, fontFamily: 'var(--font-mono)' }}>{row.rowNumber}</td>
                    <EditableCell value={row.name} onChange={(v) => onUpdate(row.rowNumber, 'name', v)} />
                    <EditableCell value={row.designation} onChange={(v) => onUpdate(row.rowNumber, 'designation', v)} />
                    <EditableCell value={row.experience} onChange={(v) => onUpdate(row.rowNumber, 'experience', v)} width={50} />
                    <EditableCell value={row.email} onChange={(v) => onUpdate(row.rowNumber, 'email', v)} />
                    <EditableCell value={row.mobile} onChange={(v) => onUpdate(row.rowNumber, 'mobile', v)} />
                    <EditableCell value={row.department} onChange={(v) => onUpdate(row.rowNumber, 'department', v)} />
                    <EditableCell value={row.employeeId} onChange={(v) => onUpdate(row.rowNumber, 'employeeId', v)} />
                    <td style={{ ...cellStyle, minWidth: 180 }}>
                      <StatusCell row={row} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

const cellStyle: React.CSSProperties = {
  padding: '6px 8px',
  fontSize: 12,
  verticalAlign: 'top',
}

function EditableCell({ value, onChange, width }: { value: string; onChange: (v: string) => void; width?: number }) {
  return (
    <td style={cellStyle}>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: width || '100%',
          minWidth: width || 100,
          padding: '5px 8px',
          fontSize: 12,
          border: `1px solid ${unifiedTheme.borders.light}`,
          borderRadius: 6,
          background: '#fff',
          color: unifiedTheme.text.primary,
          fontFamily: 'inherit',
          outline: 'none',
        }}
        onFocus={(e) => { e.currentTarget.style.borderColor = rayColors.purple400 }}
        onBlur={(e) => { e.currentTarget.style.borderColor = unifiedTheme.borders.light }}
      />
    </td>
  )
}

function StatusCell({ row }: { row: ImportRow }) {
  if (row.errors.length > 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {row.errors.map((err, i) => (
          <span key={i} style={{ fontSize: 11, color: rayColors.danger, display: 'flex', alignItems: 'center', gap: 4 }}>
            <AlertCircle size={12} />
            {err}
          </span>
        ))}
      </div>
    )
  }
  if (row.isDuplicate) {
    return (
      <span style={{ fontSize: 11, color: rayColors.warning, lineHeight: 1.4 }}>
        <strong>Duplicate</strong> · {row.duplicateReason}
      </span>
    )
  }
  if (row.warnings.length > 0) {
    return (
      <span style={{ fontSize: 11, color: unifiedTheme.text.secondary, lineHeight: 1.4 }}>
        {row.warnings.join(' · ')}
      </span>
    )
  }
  return (
    <span style={{ fontSize: 11, color: rayColors.cyan600, display: 'flex', alignItems: 'center', gap: 4 }}>
      <CheckCircle2 size={12} />
      Ready
    </span>
  )
}

function SummaryChip({ label, value, color, dimIfZero }: { label: string; value: number; color: string; dimIfZero?: boolean }) {
  const dimmed = dimIfZero && value === 0
  return (
    <div style={{
      background: '#fff',
      border: `1px solid ${unifiedTheme.borders.light}`,
      borderRadius: 10,
      padding: '8px 14px',
      display: 'flex',
      alignItems: 'baseline',
      gap: 8,
      opacity: dimmed ? 0.5 : 1,
    }}>
      <span style={{ fontSize: 18, fontWeight: 700, color: dimmed ? unifiedTheme.text.muted : color }}>{value}</span>
      <span style={{ fontSize: 11, color: unifiedTheme.text.secondary, textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: 600 }}>{label}</span>
    </div>
  )
}
