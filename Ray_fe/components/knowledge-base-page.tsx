'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { RayMascot } from './ray-mascot'
import {
  Upload,
  Trash2,
  Eye,
  Search,
  FileText,
  Loader2,
} from 'lucide-react'
import { getRayTint } from '@/lib/design-system'

interface Document {
  id: string
  name: string
  size: string
  uploaded: string
  pages: number
  tags?: string[]
  summary?: string
  searchScore?: number
  versions?: number
  lastModified?: string
}

interface KnowledgeBasePageProps {
  role?: 'admin' | 'executive' | 'employee'
}

export function KnowledgeBasePage({ role = 'employee' }: KnowledgeBasePageProps) {
  const [documents, setDocuments] = useState<Document[]>([
    {
      id: '1',
      name: 'Workflow Documentation.pdf',
      size: '2.4 MB',
      uploaded: '2024-02-20',
      pages: 45,
      tags: ['workflows', 'processes', 'automation'],
      summary: 'Complete guide to business workflows and automation processes',
      versions: 3,
      lastModified: '2024-02-22',
    },
    {
      id: '2',
      name: 'API Reference Guide.pdf',
      size: '1.8 MB',
      uploaded: '2024-02-21',
      pages: 32,
      tags: ['api', 'integration', 'technical'],
      summary: 'Technical documentation for all API endpoints',
      versions: 5,
      lastModified: '2024-02-21',
    },
    {
      id: '3',
      name: 'User Manual.pdf',
      size: '3.2 MB',
      uploaded: '2024-02-21',
      pages: 67,
      tags: ['user-guide', 'getting-started', 'features'],
      summary: 'Comprehensive guide for end users',
      versions: 2,
      lastModified: '2024-02-20',
    },
    {
      id: '4',
      name: 'Best Practices.pdf',
      size: '1.1 MB',
      uploaded: '2024-02-22',
      pages: 28,
      tags: ['best-practices', 'guidelines', 'standards'],
      summary: 'Industry best practices and standards',
      versions: 1,
      lastModified: '2024-02-22',
    },
  ])
  const [searchQuery, setSearchQuery] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [searchType, setSearchType] = useState<'keyword' | 'semantic'>('semantic')

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    handleFileUpload(e.dataTransfer.files)
  }

  const handleFileUpload = async (files: FileList) => {
    if (files.length === 0) return

    setIsUploading(true)
    await new Promise((resolve) => setTimeout(resolve, 1500))

    const newDocs = Array.from(files).map((file) => ({
      id: `doc-${Date.now()}`,
      name: file.name,
      size: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
      uploaded: new Date().toISOString().split('T')[0],
      pages: Math.floor(Math.random() * 100) + 10,
    }))

    setDocuments((prev) => [...prev, ...newDocs])
    setIsUploading(false)
  }

  const handleDelete = (id: string) => {
    setDocuments((prev) => prev.filter((doc) => doc.id !== id))
  }

  const filteredDocuments = documents
    .filter((doc) => {
      const query = searchQuery.toLowerCase()
      if (searchType === 'keyword') {
        return (
          doc.name.toLowerCase().includes(query) ||
          doc.tags?.some((tag) => tag.includes(query))
        )
      } else {
        // Semantic search - simulate relevance scoring
        const nameMatch = doc.name.toLowerCase().includes(query)
        const tagMatch = doc.tags?.some((tag) => tag.includes(query))
        const summaryMatch = doc.summary?.toLowerCase().includes(query)
        return nameMatch || tagMatch || summaryMatch
      }
    })
    .map((doc) => {
      // Calculate search score for semantic search
      if (searchType === 'semantic' && searchQuery) {
        const query = searchQuery.toLowerCase()
        let score = 0
        if (doc.name.toLowerCase().includes(query)) score += 0.5
        if (doc.tags?.some((tag) => tag.includes(query))) score += 0.3
        if (doc.summary?.toLowerCase().includes(query)) score += 0.2
        return { ...doc, searchScore: Math.min(score, 1) }
      }
      return doc
    })
    .sort((a, b) => (b.searchScore || 0) - (a.searchScore || 0))

  return (
    <div
      className="flex-1 overflow-y-auto p-8"
      style={{ background: getRayTint(role).pageBackground }}
    >
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header with RAY */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Knowledge Base
            </h1>
            <p className="text-muted-foreground">
              Manage documents that RAY uses to answer your questions
            </p>
          </div>
          <RayMascot size="lg" role={role} />
        </div>

        {/* Upload Area */}
        <div
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`relative rounded-2xl border-2 border-dashed p-12 text-center transition-all ${
            isDragging
              ? 'border-primary bg-primary bg-opacity-5'
              : 'border-border'
          }`}
        >
          <input
            type="file"
            multiple
            onChange={(e) => handleFileUpload(e.target.files!)}
            className="hidden"
            id="file-input"
            disabled={isUploading}
          />
          <label htmlFor="file-input" className="cursor-pointer">
            <div className="space-y-2">
              {isUploading ? (
                <>
                  <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                  <p className="text-muted-foreground">
                    Processing your files...
                  </p>
                </>
              ) : (
                <>
                  <Upload className="h-8 w-8 text-primary mx-auto" />
                  <p className="text-foreground font-medium">
                    Drag and drop your documents here
                  </p>
                  <p className="text-sm text-muted-foreground">
                    or click to browse (PDF, TXT, DOCX)
                  </p>
                </>
              )}
            </div>
          </label>
        </div>

        {/* Search with Type Toggle */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSearchType('semantic')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                searchType === 'semantic'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-foreground hover:bg-muted/80'
              }`}
            >
              Semantic Search
            </button>
            <button
              onClick={() => setSearchType('keyword')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                searchType === 'keyword'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-foreground hover:bg-muted/80'
              }`}
            >
              Keyword Search
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder={searchType === 'semantic' ? 'Search by meaning or content...' : 'Search document names and tags...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 rounded-full"
            />
          </div>
        </div>
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-6 text-center">
            <p className="text-muted-foreground mb-2">Total Documents</p>
            <p className="text-3xl font-bold text-foreground">
              {documents.length}
            </p>
          </Card>
          <Card className="p-6 text-center">
            <p className="text-muted-foreground mb-2">Total Pages</p>
            <p className="text-3xl font-bold text-foreground">
              {documents.reduce((sum, doc) => sum + doc.pages, 0)}
            </p>
          </Card>
          <Card className="p-6 text-center">
            <p className="text-muted-foreground mb-2">Total Size</p>
            <p className="text-3xl font-bold text-foreground">
              {(
                documents.reduce(
                  (sum, doc) =>
                    sum + parseFloat(doc.size.split(' ')[0]),
                  0
                ) / 1
              ).toFixed(1)}{' '}
              MB
            </p>
          </Card>
        </div>
        {/* Documents Table */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted bg-opacity-30">
                  <th className="text-left py-4 px-6 font-semibold text-foreground">
                    Document
                  </th>
                  <th className="text-left py-4 px-6 font-semibold text-foreground">
                    Size / Pages
                  </th>
                  <th className="text-left py-4 px-6 font-semibold text-foreground">
                    Tags
                  </th>
                  <th className="text-left py-4 px-6 font-semibold text-foreground">
                    Versions
                  </th>
                  {searchQuery && searchType === 'semantic' && (
                    <th className="text-left py-4 px-6 font-semibold text-foreground">
                      Relevance
                    </th>
                  )}
                  <th className="text-left py-4 px-6 font-semibold text-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredDocuments.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center">
                      <div className="space-y-3">
                        <FileText className="h-12 w-12 text-muted-foreground mx-auto opacity-30" />
                        <p className="text-muted-foreground">
                          {searchQuery
                            ? 'No documents match your search'
                            : 'No documents yet'}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredDocuments.map((doc) => (
                    <tr
                      key={doc.id}
                      className="border-b border-border hover:bg-muted hover:bg-opacity-30 transition-colors"
                    >
                      <td className="py-4 px-6">
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <FileText className="h-5 w-5 text-primary flex-shrink-0" />
                            <p className="font-medium text-foreground">
                              {doc.name}
                            </p>
                          </div>
                          {doc.summary && (
                            <p className="text-xs text-muted-foreground ml-8">
                              {doc.summary}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-muted-foreground">
                        <div className="text-sm">
                          <div>{doc.size}</div>
                          <div className="text-xs">{doc.pages} pages</div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        {doc.tags && doc.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {doc.tags.map((tag) => (
                              <span
                                key={tag}
                                className="inline-block px-2 py-1 text-xs bg-primary/10 text-primary rounded"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-6 text-muted-foreground">
                        <div className="text-sm">
                          <div>{doc.versions} versions</div>
                          <div className="text-xs">{doc.lastModified}</div>
                        </div>
                      </td>
                      {searchQuery && searchType === 'semantic' && (
                        <td className="py-4 px-6">
                          {doc.searchScore !== undefined && (
                            <div className="flex items-center gap-2">
                              <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-primary rounded-full"
                                  style={{ width: `${doc.searchScore * 100}%` }}
                                />
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {(doc.searchScore * 100).toFixed(0)}%
                              </span>
                            </div>
                          )}
                        </td>
                      )}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="gap-1"
                            onClick={() => {
                              /* View action */
                            }}
                          >
                            <Eye className="h-4 w-4" />
                            View
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(doc.id)}
                            className="text-destructive hover:text-destructive hover:bg-destructive hover:bg-opacity-10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  )
}
