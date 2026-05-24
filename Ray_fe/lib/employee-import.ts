/**
 * Employee Excel/CSV import utilities.
 *
 * Responsibilities split out of the component so the UI stays readable:
 *   - parse a File (xlsx, xls, csv) into a normalised row list
 *   - validate each row (required fields, email shape, experience int)
 *   - detect duplicates against an existing employee list
 *   - generate a blank .xlsx template with the right headers
 *
 * Uses SheetJS (xlsx package). All work runs in the browser; no upload.
 */

import * as XLSX from 'xlsx'

// ---------- Column schema ----------

export const TEMPLATE_HEADERS = [
  'Name',
  'Designation',
  'Experience',
  'Email',
  'Mobile',
  'Department',
  'Employee ID',
] as const

const FIELD_ALIASES: Record<string, keyof ParsedRow> = {
  // Canonical
  name: 'name',
  designation: 'designation',
  experience: 'experience',
  email: 'email',
  mobile: 'mobile',
  department: 'department',
  'employee id': 'employeeId',
  employeeid: 'employeeId',
  // Common variants
  'full name': 'name',
  fullname: 'name',
  role: 'designation',
  title: 'designation',
  'job title': 'designation',
  'years of experience': 'experience',
  yoe: 'experience',
  'years experience': 'experience',
  'email address': 'email',
  'e-mail': 'email',
  'mobile number': 'mobile',
  phone: 'mobile',
  'phone number': 'mobile',
  contact: 'mobile',
  dept: 'department',
  team: 'department',
  emp_id: 'employeeId',
  'emp id': 'employeeId',
  employee_id: 'employeeId',
}

const DEPARTMENTS = ['Engineering', 'Design', 'Finance', 'Product', 'HR', 'Operations',
                     'Infrastructure', 'Analytics', 'Quality Assurance', 'Business',
                     'Human Resources', 'Sales', 'IT Support', 'Marketing']

// ---------- Types ----------

export interface ParsedRow {
  name: string
  designation: string
  experience: string  // kept as string for the preview, parsed at commit
  email: string
  mobile: string
  department: string
  employeeId: string
}

export interface ImportRow extends ParsedRow {
  /** Source row number from the spreadsheet (1-indexed, ignoring the header) */
  rowNumber: number
  errors: string[]               // validation problems (blocking)
  warnings: string[]             // soft issues (non-blocking, just a notice)
  isDuplicate: boolean           // collision with existing data
  duplicateReason?: string
  shouldImport: boolean          // user toggle — defaults to true unless dup/error
}

export interface ParseResult {
  rows: ImportRow[]
  totalRows: number
  /** Headers we found in the sheet, in original case */
  detectedHeaders: string[]
  /** Headers we couldn't map to any known field */
  unmappedHeaders: string[]
  /** Top-level error if the file couldn't be parsed at all */
  fatalError?: string
}

// ---------- Validation ----------

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function validateRow(row: ParsedRow): string[] {
  const errors: string[] = []
  if (!row.name.trim()) errors.push('Name is required')
  if (!row.designation.trim()) errors.push('Designation is required')
  if (!row.email.trim()) {
    errors.push('Email is required')
  } else if (!EMAIL_RE.test(row.email.trim())) {
    errors.push('Email format looks invalid')
  }
  if (!row.mobile.trim()) errors.push('Mobile is required')
  if (row.experience.trim() && Number.isNaN(parseInt(row.experience, 10))) {
    errors.push('Experience must be a number')
  }
  return errors
}

function buildWarnings(row: ParsedRow): string[] {
  const warnings: string[] = []
  if (row.department.trim() && !DEPARTMENTS.some(
    (d) => d.toLowerCase() === row.department.trim().toLowerCase()
  )) {
    warnings.push(`Department "${row.department}" isn't one of the standard list (will still import)`)
  }
  return warnings
}

// ---------- Header mapping ----------

function mapHeaders(rawHeaders: string[]): {
  mapping: Record<number, keyof ParsedRow>
  unmapped: string[]
} {
  const mapping: Record<number, keyof ParsedRow> = {}
  const unmapped: string[] = []

  rawHeaders.forEach((raw, idx) => {
    if (!raw) return
    const key = String(raw).trim().toLowerCase().replace(/\s+/g, ' ')
    if (key in FIELD_ALIASES) {
      mapping[idx] = FIELD_ALIASES[key]
    } else {
      unmapped.push(String(raw))
    }
  })

  return { mapping, unmapped }
}

// ---------- Main parser ----------

export async function parseEmployeeFile(file: File): Promise<ParseResult> {
  const data = await file.arrayBuffer()

  let workbook: XLSX.WorkBook
  try {
    workbook = XLSX.read(data, { type: 'array' })
  } catch (err: any) {
    return {
      rows: [], totalRows: 0, detectedHeaders: [], unmappedHeaders: [],
      fatalError: `Couldn't read file: ${err?.message || 'unknown error'}`,
    }
  }

  const sheetName = workbook.SheetNames[0]
  if (!sheetName) {
    return {
      rows: [], totalRows: 0, detectedHeaders: [], unmappedHeaders: [],
      fatalError: 'The file has no sheets.',
    }
  }
  const sheet = workbook.Sheets[sheetName]

  // Parse to a matrix so we can handle alias headers ourselves
  const matrix = XLSX.utils.sheet_to_json<any[]>(sheet, {
    header: 1,
    raw: false,
    defval: '',
  })

  if (matrix.length === 0) {
    return {
      rows: [], totalRows: 0, detectedHeaders: [], unmappedHeaders: [],
      fatalError: 'The sheet is empty.',
    }
  }

  const [headerRow, ...dataRows] = matrix
  const rawHeaders = headerRow.map((h) => String(h ?? '').trim())
  const { mapping, unmapped } = mapHeaders(rawHeaders)

  const mappedFields = new Set(Object.values(mapping))
  const required: (keyof ParsedRow)[] = ['name', 'designation', 'email', 'mobile']
  const missingRequired = required.filter((f) => !mappedFields.has(f))
  if (missingRequired.length > 0) {
    return {
      rows: [], totalRows: 0, detectedHeaders: rawHeaders, unmappedHeaders: unmapped,
      fatalError: `Missing required column${missingRequired.length > 1 ? 's' : ''}: ${missingRequired.join(', ')}. Download the template to see expected headers.`,
    }
  }

  // Convert each data row to a ParsedRow
  const rows: ImportRow[] = []
  let rowNum = 0
  for (const cells of dataRows) {
    rowNum++
    if (!cells || cells.every((c) => String(c ?? '').trim() === '')) continue  // skip empty rows

    const parsed: ParsedRow = {
      name: '', designation: '', experience: '', email: '',
      mobile: '', department: '', employeeId: '',
    }
    for (const [idxStr, field] of Object.entries(mapping)) {
      const idx = Number(idxStr)
      parsed[field] = String(cells[idx] ?? '').trim()
    }

    const errors = validateRow(parsed)
    const warnings = buildWarnings(parsed)
    rows.push({
      ...parsed,
      rowNumber: rowNum,
      errors,
      warnings,
      isDuplicate: false,
      shouldImport: errors.length === 0,
    })
  }

  return {
    rows,
    totalRows: rows.length,
    detectedHeaders: rawHeaders,
    unmappedHeaders: unmapped,
  }
}

// ---------- Duplicate detection ----------

export function flagDuplicates(
  rows: ImportRow[],
  existing: { email: string; employeeId: string }[],
): ImportRow[] {
  const existingEmails = new Set(existing.map((e) => e.email.toLowerCase().trim()))
  const existingIds = new Set(existing.map((e) => e.employeeId.toLowerCase().trim()))

  // Track duplicates within the import itself
  const seenEmails = new Set<string>()
  const seenIds = new Set<string>()

  return rows.map((row) => {
    const email = row.email.toLowerCase().trim()
    const id = row.employeeId.toLowerCase().trim()
    let dupReason: string | undefined

    if (email && existingEmails.has(email)) {
      dupReason = `Email "${row.email}" already exists in the directory`
    } else if (id && existingIds.has(id)) {
      dupReason = `Employee ID "${row.employeeId}" already exists in the directory`
    } else if (email && seenEmails.has(email)) {
      dupReason = `Email "${row.email}" appears earlier in this import`
    } else if (id && seenIds.has(id)) {
      dupReason = `Employee ID "${row.employeeId}" appears earlier in this import`
    }

    if (email) seenEmails.add(email)
    if (id) seenIds.add(id)

    return {
      ...row,
      isDuplicate: Boolean(dupReason),
      duplicateReason: dupReason,
      // Auto-uncheck duplicates so user has to opt in to importing them
      shouldImport: row.shouldImport && !dupReason,
    }
  })
}

// ---------- Template generation ----------

export function downloadTemplate(): void {
  // Tiny example row so users know what valid data looks like
  const example = {
    Name: 'Asha Iyer',
    Designation: 'Senior Engineer',
    Experience: 6,
    Email: 'asha.iyer@example.com',
    Mobile: '+91 98765 43210',
    Department: 'Engineering',
    'Employee ID': 'EMP-100',
  }

  const ws = XLSX.utils.json_to_sheet([example], { header: [...TEMPLATE_HEADERS] })

  // Widen columns so the example doesn't get clipped on first open
  ws['!cols'] = [
    { wch: 20 }, // Name
    { wch: 22 }, // Designation
    { wch: 12 }, // Experience
    { wch: 28 }, // Email
    { wch: 20 }, // Mobile
    { wch: 18 }, // Department
    { wch: 14 }, // Employee ID
  ]

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Employees')
  XLSX.writeFile(wb, 'ray-employee-import-template.xlsx')
}
