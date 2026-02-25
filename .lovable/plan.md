
# Add Direct Messaging to Communication Panel

## Overview
Add a messaging feature alongside the existing Announcements tab within the Communication section of the sidebar. Users will be able to send direct messages to teammates within the same company. The UI will use tabs to switch between "Announcements" and "Messages."

## Database Changes

### New `messages` table
- `id` (uuid, PK, default gen_random_uuid())
- `company_id` (uuid, NOT NULL) -- scoped to company
- `sender_id` (uuid, NOT NULL) -- the user sending
- `receiver_id` (uuid, NOT NULL) -- the recipient
- `content` (text, NOT NULL)
- `is_read` (boolean, default false)
- `created_at` (timestamptz, default now())

### RLS Policies for `messages`
- **SELECT**: Users can see messages where they are the sender or receiver
- **INSERT**: Authenticated users can send messages (sender_id must match auth.uid())
- **UPDATE**: Receiver can mark messages as read (receiver_id = auth.uid())

### Enable Realtime
- Add `messages` table to `supabase_realtime` publication for live updates

## New Files

### `src/hooks/useMessages.ts`
- `useConversations(companyId)` -- fetches distinct conversation partners with latest message and unread count
- `useConversationMessages(companyId, partnerId)` -- fetches messages between current user and a partner, ordered by created_at
- `useSendMessage()` -- mutation to insert a new message
- `useMarkMessagesRead(partnerId)` -- mutation to mark all messages from a partner as read

### `src/components/dashboard/MessagesPanel.tsx`
- Two views: **conversation list** and **active conversation**
- Conversation list shows each teammate with their last message preview and unread badge
- Active conversation view shows message history with a text input to send new messages
- Back button to return to conversation list
- Auto-scroll to latest message
- Real-time subscription for new incoming messages

## Modified Files

### `src/components/dashboard/CommunicationPanel.tsx`
- Wrap content in Tabs component (from radix) with two tabs: "Announcements" and "Messages"
- Announcements tab keeps existing content
- Messages tab renders the new `MessagesPanel`
- Show unread badge on Messages tab

### `src/components/dashboard/DashboardNav.tsx`
- No structural changes needed -- CommunicationPanel already handles the content

## Technical Details

- Messages are company-scoped so users can only message teammates within the same organization
- The teammate picker will use the existing `useMembers` pattern (profiles + company_memberships) to list available recipients
- Realtime subscription ensures messages appear instantly without manual refresh
- Conversation list is derived by grouping messages by the "other" user (sender or receiver that isn't the current user)
- A "New Message" button opens a teammate selector to start a new conversation
