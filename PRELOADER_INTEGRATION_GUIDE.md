# Preloader Integration Guide

## Overview
This guide shows how to integrate the new preloader component across all dashboard pages and remove old skeleton loaders.

## Preloader Component
Location: `src/components/ui/preloader.tsx`
- Uses message categories from `src/lib/constants.ts`
- Supports `fullscreen` prop for auth pages
- Default is content-area only (for dashboard pages with sidebar)

## Integration Pattern

### For Dashboard Pages (with sidebar)

```tsx
"use client"

import { useState, useCallback } from "react"
import Preloader from "@/components/ui/preloader"
// ... other imports

export default function YourPage() {
  const [showPreloader, setShowPreloader] = useState(true)
  const [loading, setLoading] = useState(true)
  // ... other state

  const handlePreloaderComplete = useCallback(() => {
    setShowPreloader(false)
  }, [])

  // Your data loading logic
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    // ... fetch data
    setLoading(false)
  }

  // Show preloader first
  if (showPreloader) {
    return (
      <div className="relative w-full h-screen">
        <Preloader onComplete={handlePreloaderComplete} />
      </div>
    )
  }

  // Then show loading state if needed
  if (loading) {
    return <div className="text-center py-8">Loading...</div>
  }

  // Finally show content
  return (
    <div>
      {/* Your page content */}
    </div>
  )
}
```

### For Auth Pages (fullscreen)

```tsx
"use client"

import { useState, useCallback } from "react"
import Preloader from "@/components/ui/preloader"

export default function AuthPage() {
  const [showPreloader, setShowPreloader] = useState(true)

  const handlePreloaderComplete = useCallback(() => {
    setShowPreloader(false)
  }, [])

  if (showPreloader) {
    return <Preloader fullscreen onComplete={handlePreloaderComplete} />
  }

  return (
    <div>
      {/* Your auth page content */}
    </div>
  )
}
```

## Pages Updated

### ✅ Completed
1. `src/app/(dashboard)/member/events/page.tsx` - Added preloader
2. `src/app/(dashboard)/core/dashboard/page.tsx` - Added preloader
3. `src/app/(dashboard)/member/dashboard/page.tsx` - Added preloader
4. `src/app/(dashboard)/core/events/page.tsx` - Added preloader

### 📋 Remaining Pages to Update

#### Core Dashboard Pages
- [ ] `src/app/(dashboard)/core/announcements/page.tsx`
- [ ] `src/app/(dashboard)/core/members/page.tsx`
- [ ] `src/app/(dashboard)/core/workshops/page.tsx`
- [ ] `src/app/(dashboard)/core/workshops/[id]/page.tsx`
- [ ] `src/app/(dashboard)/core/workshops/[id]/attendance/page.tsx`
- [ ] `src/app/(dashboard)/core/workshops/[id]/registrations/page.tsx`
- [ ] `src/app/(dashboard)/core/events/[eventId]/page.tsx`
- [ ] `src/app/(dashboard)/core/events/[eventId]/live/page.tsx`
- [ ] `src/app/(dashboard)/core/events/[eventId]/registrations/page.tsx`
- [ ] `src/app/(dashboard)/core/events/[eventId]/result/page.tsx`
- [ ] `src/app/(dashboard)/core/tournament/page.tsx`
- [ ] `src/app/(dashboard)/core/tournament/[tournamentId]/page.tsx`
- [ ] `src/app/(dashboard)/core/tournament/[tournamentId]/leaderboard/page.tsx`
- [ ] `src/app/(dashboard)/core/guide/page.tsx`
- [ ] `src/app/(dashboard)/core/roles/page.tsx`

#### Member Dashboard Pages
- [ ] `src/app/(dashboard)/member/announcements/page.tsx`
- [ ] `src/app/(dashboard)/member/workshops/page.tsx`
- [ ] `src/app/(dashboard)/member/workshops/[id]/page.tsx`
- [ ] `src/app/(dashboard)/member/events/[eventId]/page.tsx`
- [ ] `src/app/(dashboard)/member/events/[eventId]/live/page.tsx`
- [ ] `src/app/(dashboard)/member/events/[eventId]/result/page.tsx`
- [ ] `src/app/(dashboard)/member/tournament/page.tsx`
- [ ] `src/app/(dashboard)/member/tournament/[tournamentId]/page.tsx`
- [ ] `src/app/(dashboard)/member/tournament/[tournamentId]/leaderboard/page.tsx`
- [ ] `src/app/(dashboard)/member/guide/page.tsx`
- [ ] `src/app/(dashboard)/member/profile/page.tsx`
- [ ] `src/app/(dashboard)/member/profile/[profileId]/page.tsx`
- [ ] `src/app/(dashboard)/member/notifications/page.tsx`

#### Auth Pages (use fullscreen prop)
- [ ] `src/app/(auth)/login/page.tsx`
- [ ] `src/app/(auth)/signup/page.tsx`

## Skeleton Files to Delete

After updating all pages, delete these skeleton component files:

```bash
# Event skeletons
src/app/(dashboard)/member/events/components/event-details-skeleton.tsx
src/app/(dashboard)/member/events/components/events-skeleton.tsx
src/app/(dashboard)/member/events/components/event-results-skeleton.tsx
src/app/(dashboard)/member/events/components/live-event-skeleton.tsx

# Guide skeleton
src/app/(dashboard)/member/guide/components/guide-skeleton.tsx

# Tournament skeletons
src/app/(dashboard)/member/tournament/components/tournament-skeleton.tsx

# Profile skeleton
src/app/(dashboard)/member/profile/components/profile-skeleton.tsx

# Announcements skeleton
src/app/(dashboard)/member/announcements/components/announcements-skeleton.tsx
```

**Keep this file:** `src/components/ui/skeleton.tsx` (base skeleton component, may be used elsewhere)

## Steps to Remove Skeleton Usage

1. Remove skeleton import:
```tsx
// Remove this
import { EventsPageSkeleton } from "./components/events-skeleton"
```

2. Remove skeleton return statement:
```tsx
// Remove this
if (loading) {
  return <EventsPageSkeleton />
}
```

3. Replace with simple loading message or remove entirely (preloader handles initial load):
```tsx
// Replace with this (optional, after preloader)
if (loading) {
  return <div className="text-center py-8">Loading...</div>
}
```

## Benefits

1. **Consistent UX**: All pages use the same loading animation
2. **Faster Performance**: No need to render complex skeleton components
3. **Engaging**: Fun, varied messages keep users entertained
4. **Cleaner Code**: Less skeleton component maintenance
5. **Smaller Bundle**: Fewer components to load

## Testing Checklist

After updating each page:
- [ ] Preloader shows on initial page load
- [ ] Preloader animates smoothly
- [ ] Content appears after preloader completes
- [ ] Sidebar remains visible (dashboard pages)
- [ ] No console errors
- [ ] Page functions normally after preloader

## Notes

- The preloader automatically selects random message categories
- Animation duration is ~3-4 seconds
- Sidebar stays visible on dashboard pages
- Fullscreen mode covers entire viewport (for auth pages)
- Messages are defined in `src/lib/constants.ts`
