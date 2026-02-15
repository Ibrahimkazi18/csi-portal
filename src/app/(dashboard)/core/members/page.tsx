"use client"

import { useState, useCallback, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Search, Plus, Edit, Trash2, Crown, Mail, User } from "lucide-react"
import type { Member } from "@/types/auth"
import { getMembers, getPendingMembers } from "./actions"
import { toast } from "sonner"
import { AddMemberModal } from "./components/add-member-modal"
import { EditMemberModal } from "./components/edit-member-modal"
import { DeleteMemberDialog } from "./components/delete-member-modal"
import { NumberedPagination } from "@/components/ui/numbered-pagination"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import Preloader from "@/components/ui/preloader"

const ITEMS_PER_PAGE = 10

// Role hierarchy for sorting
const ROLE_ORDER: { [key: string]: number } = {
  'president': 1,
  'secretary': 2,
  'treasurer': 3,
  'technicals': 4,
  'social media': 5,
  'documentation': 6,
  'creatives': 7,
  'none': 8,
}

export default function MembersPage() {
  const [showPreloader, setShowPreloader] = useState(true)
  const [members, setMembers] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState<"full_name" | "role" | "created_at" | "member_role">("member_role")
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)
  const [loadingData, setLoadingData] = useState(true)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [viewMode, setViewMode] = useState<"all" | "active" | "pending">("all")
  const [currentPage, setCurrentPage] = useState(1)

  const fetchAllMembers = useCallback(async () => {
    setLoadingData(true)
    try {
      const [activeMembers, pendingMembers] = await Promise.all([getMembers(), getPendingMembers()])

      const combinedMembers: Member[] = [
        ...activeMembers,
        ...pendingMembers.map((p) => ({ ...p, isPending: true, id: p.email })), // Use email as fallback ID for pending
      ]
      setMembers(combinedMembers);

    } catch (error) {
        console.error("Failed to fetch members:", error)
        toast.error("Error", {
          description: "Failed to load members. Please try again.",
        });

    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    fetchAllMembers()
  }, [fetchAllMembers]);

  const handlePreloaderComplete = useCallback(() => {
    setShowPreloader(false)
  }, [])

  // Filter and sort members - MUST be before any conditional returns
  const filteredAndSortedMembers = useMemo(() => {
    let filtered = members.filter((member) => {
      const matchesSearch =
        member.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.role.toLowerCase().includes(searchTerm.toLowerCase())

      if (viewMode === "active") {
        return matchesSearch && !member.isPending
      }
      if (viewMode === "pending") {
        return matchesSearch && member.isPending
      }
      return matchesSearch
    })

    // Sort based on selected option
    if (sortBy === "member_role") {
      filtered = filtered.sort((a, b) => {
        const roleA = (a.member_role || 'none').toLowerCase()
        const roleB = (b.member_role || 'none').toLowerCase()
        const orderA = ROLE_ORDER[roleA] || 999
        const orderB = ROLE_ORDER[roleB] || 999
        
        if (orderA !== orderB) {
          return orderA - orderB
        }
        
        // If same role, sort by name
        return a.full_name.localeCompare(b.full_name)
      })
    } else if (sortBy === "created_at") {
      filtered = filtered.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
    } else {
      filtered = filtered.sort((a, b) => a[sortBy].localeCompare(b[sortBy]))
    }

    return filtered
  }, [members, searchTerm, viewMode, sortBy])

  // Paginate members
  const totalPages = Math.ceil(filteredAndSortedMembers.length / ITEMS_PER_PAGE)
  const paginatedMembers = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredAndSortedMembers.slice(startIndex, startIndex + ITEMS_PER_PAGE)
  }, [filteredAndSortedMembers, currentPage])

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, viewMode, sortBy])

  if (showPreloader) {
    return (
      <div className="relative w-full h-screen">
        <Preloader onComplete={handlePreloaderComplete} />
      </div>
    )
  }

  const handleOpenEditModal = (member: Member) => {
    setSelectedMember(member)
    setIsEditModalOpen(true)
  }

  const handleOpenDeleteModal = (member: Member) => {
    setSelectedMember(member)
    setIsDeleteModalOpen(true)
  }

  return (
    <div className="max-h-screen h-screen space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-neon">Members Management</h1>
          <p className="text-muted-foreground">Manage CSI members and their information</p>
        </div>
        <AddMemberModal onSuccess={fetchAllMembers} />
      </div>
      <Card className="bg-dark-surface border-border">
        <CardHeader>
          <CardTitle>All Members</CardTitle>
          <CardDescription>
            View and manage CSI members. Showing {paginatedMembers.length} of {filteredAndSortedMembers.length} members
            {filteredAndSortedMembers.length !== members.length && ` (${members.length} total)`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or role..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-input border-border"
              />
            </div>
            <Select value={sortBy} onValueChange={(value) =>
              setSortBy(value as "full_name" | "role" | "created_at" | "member_role")
            }>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="member_role">Sort by Member Role</SelectItem>
                <SelectItem value="full_name">Sort by Name</SelectItem>
                <SelectItem value="role">Sort by Account Role</SelectItem>
                <SelectItem value="created_at">Sort by Join Date</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Button
              variant={viewMode === "all" ? "default" : "outline"}
              onClick={() => setViewMode("all")}
              className={viewMode === "all" ? "glow-blue" : ""}
            >
              All Members ({members.length})
            </Button>
            <Button
              variant={viewMode === "active" ? "default" : "outline"}
              onClick={() => setViewMode("active")}
              className={viewMode === "active" ? "glow-blue" : ""}
            >
              Active ({members.filter(m => !m.isPending).length})
            </Button>
            <Button
              variant={viewMode === "pending" ? "default" : "outline"}
              onClick={() => setViewMode("pending")}
              className={viewMode === "pending" ? "glow-blue" : ""}
            >
              Pending ({members.filter(m => m.isPending).length})
            </Button>
          </div>
          {loadingData ? (
            <div className="text-center py-8 text-muted-foreground">Loading members...</div>
          ) : (
            <>
              <div className="border border-border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                      <TableHead className="font-semibold py-4 px-6">#</TableHead>
                      <TableHead className="font-semibold py-4 px-6">Name</TableHead>
                      <TableHead className="font-semibold py-4 px-6">Email</TableHead>
                      <TableHead className="font-semibold py-4 px-6">Member Role</TableHead>
                      <TableHead className="font-semibold py-4 px-6">Status</TableHead>
                      <TableHead className="font-semibold py-4 px-6">Join Date</TableHead>
                      <TableHead className="text-right font-semibold py-4 px-6">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedMembers.map((member, index) => {
                      const globalIndex = (currentPage - 1) * ITEMS_PER_PAGE + index + 1
                      return (
                        <TableRow key={member.id} className="border-border hover:bg-muted/30 transition-colors">
                          <TableCell className="font-medium text-muted-foreground py-4 px-6">
                            {globalIndex}
                          </TableCell>
                          <TableCell className="py-4 px-6">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">{member.full_name}</span>
                              {member.role === "core" && (
                                <Crown className="h-4 w-4 text-yellow-500" />
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="py-4 px-6">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Mail className="h-3 w-3" />
                              {member.email}
                            </div>
                          </TableCell>
                          <TableCell className="py-4 px-6">
                            <Badge 
                              variant={
                                member.member_role === 'president' ? 'default' :
                                member.member_role === 'secretary' ? 'default' :
                                member.member_role === 'treasurer' ? 'default' :
                                'secondary'
                              }
                              className="capitalize"
                            >
                              {member.member_role || 'Member'}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-4 px-6">
                            {member.isPending ? (
                              <Badge variant="outline" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                                Pending
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/30">
                                Active
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground py-4 px-6">
                            {new Date(member.created_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </TableCell>
                          <TableCell className="text-right py-4 px-6">
                            <div className="flex justify-end gap-3">
                              <Button size="sm" variant="outline" onClick={() => handleOpenEditModal(member)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => handleOpenDeleteModal(member)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center pt-6">
                  <NumberedPagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    paginationItemsToDisplay={5}
                    onPageChange={setCurrentPage}
                  />
                </div>
              )}
            </>
          )}
          {filteredAndSortedMembers.length === 0 && !loadingData && (
            <div className="text-center py-8 text-muted-foreground">
              No members found matching your search criteria.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <EditMemberModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        member={selectedMember}
        onSuccess={fetchAllMembers}
      />
      <DeleteMemberDialog
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        member={selectedMember}
        onSuccess={fetchAllMembers}
      />
    </div>
  )
}
