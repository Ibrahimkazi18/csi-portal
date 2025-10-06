"use client"

import { useState, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Search, Plus, Edit, Trash2 } from "lucide-react"
import type { Member } from "@/types/auth"
import { getMembers, getPendingMembers } from "./actions"
import { toast } from "sonner"
import { AddMemberModal } from "./components/add-member-modal"
import { EditMemberModal } from "./components/edit-member-modal"
import { DeleteMemberDialog } from "./components/delete-member-modal"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export default function MembersPage() {
  const [members, setMembers] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState<"full_name" | "role" | "created_at">("full_name")
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)
  const [loadingData, setLoadingData] = useState(true)
  const [viewMode, setViewMode] = useState<"all" | "active" | "pending">("all")

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
  

  const filteredMembers = members
    .filter((member) => {
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
    .sort((a, b) => {
      if (sortBy === "created_at") {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      }
      return a[sortBy].localeCompare(b[sortBy])
    })

  const handleOpenEditModal = (member: Member) => {
    setSelectedMember(member)
    setIsEditModalOpen(true)
  }

  const handleOpenDeleteModal = (member: Member) => {
    setSelectedMember(member)
    setIsDeleteModalOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-neon">Members Management</h1>
          <p className="text-muted-foreground">Manage CSI members and their information</p>
        </div>
        <Button className="glow-blue" onClick={() => setIsAddModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Member
        </Button>
      </div>
      <Card className="bg-dark-surface border-border">
        <CardHeader>
          <CardTitle>All Members</CardTitle>
          <CardDescription>
            View and manage CSI members. Showing {filteredMembers.length} of {members.length} total members.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search members..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-input border-border"
              />
            </div>
            <Select value={sortBy} onValueChange={(value) =>
              setSortBy(value as "full_name" | "role" | "created_at")
            }>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="full_name">Sort by Name</SelectItem>
                <SelectItem value="role">Sort by Role</SelectItem>
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
              All Members
            </Button>
            <Button
              variant={viewMode === "active" ? "default" : "outline"}
              onClick={() => setViewMode("active")}
              className={viewMode === "active" ? "glow-blue" : ""}
            >
              Active Members
            </Button>
            <Button
              variant={viewMode === "pending" ? "default" : "outline"}
              onClick={() => setViewMode("pending")}
              className={viewMode === "pending" ? "glow-blue" : ""}
            >
              Pending Members
            </Button>
          </div>
          {loadingData ? (
            <div className="text-center py-8 text-muted-foreground">Loading members...</div>
          ) : (
            <div className="border border-border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Join Date</TableHead>
                    <TableHead>Status</TableHead> {/* Added Status column */}
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMembers.map((member) => (
                    <TableRow key={member.id} className="border-border">
                      <TableCell className="font-medium">{member.full_name}</TableCell>
                      <TableCell>{member.email}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="glow-purple capitalize">
                          {member.role}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(member.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
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
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleOpenEditModal(member)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handleOpenDeleteModal(member)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          {filteredMembers.length === 0 && !loadingData && (
            <div className="text-center py-8 text-muted-foreground">
              No members found matching your search criteria.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <AddMemberModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onSuccess={fetchAllMembers} />

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
