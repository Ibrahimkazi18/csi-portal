"use client";

import { useCallback, useEffect, useState } from "react"
import { getAllMembers } from "../actions";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import { DialogDescription, DialogTitle } from "@radix-ui/react-dialog";
import { Users } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";

interface SearcgProfileModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}


const SearcgProfileModal = ({open, onOpenChange} : SearcgProfileModalProps) => {
  const [loading, setLoading] = useState(false);
  const [availableMembers, setAvailableMembers] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState("");
  
  const router = useRouter();

  const loadAvailableMembers = useCallback(async () => {
    setLoading(true);

    try {
      const response = await getAllMembers()
      if (!response.success) {
        throw new Error(response.message || "Failed to load members")
      }
      setAvailableMembers(response.data || [])
    } catch (error: any) {
      toast.error("Error", {
        description: error.message || "Failed to load available members",
      })
    } finally {
        setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAvailableMembers()
  }, [loadAvailableMembers]);

  const handleSearchMember = (id : string) => {
    router.push(`/member/profile/${id}`)
  }

  const filteredMembers = availableMembers.filter(
    (member) =>
      member.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto border-border text-foreground">
            <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Search For Profiles
                </DialogTitle>

                <DialogDescription>
                    Search For Other Members to view their profile and their achievements
                </DialogDescription>
            </DialogHeader>

            <div className="space-y-2">
              <Label htmlFor="member-search">
                Search For Profile
              </Label>
              <Input
                id="member-search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-input border-border"
                placeholder="Search members by name or email..."
              />
            </div>

            {/* Available Members Dropdown */}
            {searchTerm && (
              <div className="max-h-40 overflow-y-auto border border-border rounded-lg bg-muted/20">
                {filteredMembers.length === 0 ? (
                  <div className="p-3 text-sm text-muted-foreground text-center">
                    No members found matching "{searchTerm}"
                  </div>
                ) : (
                  filteredMembers.map((member) => (
                    <div
                      key={member.id}
                      className="p-3 hover:bg-muted/40 cursor-pointer border-b border-border last:border-b-0"
                      onClick={() => handleSearchMember(member.id)}
                    >
                      <div className="font-medium">{member.full_name}</div>
                      <div className="text-sm text-muted-foreground">{member.email}</div>
                    </div>
                  ))
                )}
              </div>
            )}
        </DialogContent>
    </Dialog>
  )
}

export default SearcgProfileModal