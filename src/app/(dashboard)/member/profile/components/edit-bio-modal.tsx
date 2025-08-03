"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { updateBio } from "../actions"

const bioSchema = z.object({
  bio: z.string().max(300, "Bio must be 300 characters or less").optional(),
})

type BioFormValues = z.infer<typeof bioSchema>

interface EditBioModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentBio: string
  onSuccess: () => void
}

export function EditBioModal({ open, onOpenChange, currentBio, onSuccess }: EditBioModalProps) {
  const [loading, setLoading] = useState(false)

  const form = useForm<BioFormValues>({
    resolver: zodResolver(bioSchema),
    defaultValues: {
      bio: currentBio,
    },
  })

  const watchedBio = form.watch("bio") || ""
  const wordCount = watchedBio
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0).length
  const charCount = watchedBio.length

  const onSubmit = async (values: BioFormValues) => {
    if (wordCount > 50) {
      toast.error("Bio must be 50 words or less")
      return
    }

    setLoading(true)
    try {
      const result = await updateBio(values.bio || "")

      if (result.success) {
        toast.success("Bio updated successfully!")
        onSuccess()
        onOpenChange(false)
        form.reset({ bio: values.bio })
      } else {
        toast.error("Failed to update bio", {
          description: result.message,
        })
      }
    } catch (error) {
      toast.error("An error occurred while updating bio")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] border-border">
        <DialogHeader>
          <DialogTitle>Edit Bio</DialogTitle>
          <DialogDescription>Tell others about yourself. Keep it short and engaging (max 50 words).</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bio</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Write something about yourself..."
                      className="min-h-[100px] bg-background border-border"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription className="flex justify-between text-xs">
                    <span className={wordCount > 50 ? "text-red-500" : "text-muted-foreground"}>
                      {wordCount}/50 words
                    </span>
                    <span className={charCount > 300 ? "text-red-500" : "text-muted-foreground"}>
                      {charCount}/300 characters
                    </span>
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading || wordCount > 50}>
                {loading ? "Updating..." : "Update Bio"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
