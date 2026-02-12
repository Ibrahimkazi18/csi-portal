"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { Users, UserPlus, X, Check } from "lucide-react"
import { Button } from "./button"
import { Drawer } from "vaul"

interface TeamMember {
  id: string
  name: string
  role?: string
  avatar?: string
}

interface TeamAccessCardProps {
  teamName: string
  members: TeamMember[]
  maxMembers?: number
  onInvite?: (email: string) => Promise<void>
  onRemove?: (memberId: string) => Promise<void>
  className?: string
}

export function TeamAccessCard({
  teamName,
  members,
  maxMembers = 10,
  onInvite,
  onRemove,
  className
}: TeamAccessCardProps) {
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false)
  const [inviteEmail, setInviteEmail] = React.useState("")
  const [isInviting, setIsInviting] = React.useState(false)

  const handleInvite = async () => {
    if (!inviteEmail || !onInvite) return
    
    setIsInviting(true)
    try {
      await onInvite(inviteEmail)
      setInviteEmail("")
      setIsDrawerOpen(false)
    } catch (error) {
      console.error("Failed to invite:", error)
    } finally {
      setIsInviting(false)
    }
  }

  return (
    <div className={cn("rounded-xl border bg-card p-6 shadow-sm bg-radial-gradient", className)}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">{teamName}</h3>
            <p className="text-sm text-muted-foreground">
              {members.length} / {maxMembers} members
            </p>
          </div>
        </div>

        <Drawer.Root open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
          <Drawer.Trigger asChild>
            <Button size="sm" disabled={members.length >= maxMembers}>
              <UserPlus className="h-4 w-4 mr-2" />
              Invite
            </Button>
          </Drawer.Trigger>

          <Drawer.Portal>
            <Drawer.Overlay className="fixed inset-0 bg-black/40 z-50" />
            <Drawer.Content className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t rounded-t-xl">
              <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-muted my-4" />
              
              <div className="p-6 space-y-4">
                <Drawer.Title className="text-lg font-semibold">
                  Invite Team Member
                </Drawer.Title>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email Address</label>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="member@example.com"
                    className="w-full px-3 py-2 rounded-md border bg-background"
                    onKeyDown={(e) => e.key === "Enter" && handleInvite()}
                  />
                </div>

                <div className="flex gap-2">
                  <Button 
                    onClick={handleInvite} 
                    disabled={!inviteEmail || isInviting}
                    className="flex-1"
                  >
                    {isInviting ? "Sending..." : "Send Invitation"}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setIsDrawerOpen(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </Drawer.Content>
          </Drawer.Portal>
        </Drawer.Root>
      </div>

      {/* Members List */}
      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {members.map((member, index) => (
            <motion.div
              key={member.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-center justify-between p-3 rounded-lg border bg-muted/20 hover:bg-muted/40 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                  {member.avatar ? (
                    <img src={member.avatar} alt={member.name} className="w-full h-full rounded-full" />
                  ) : (
                    <span className="text-sm font-medium">
                      {member.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium">{member.name}</p>
                  {member.role && (
                    <p className="text-xs text-muted-foreground">{member.role}</p>
                  )}
                </div>
              </div>

              {onRemove && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemove(member.id)}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {members.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No members yet</p>
          </div>
        )}
      </div>
    </div>
  )
}
