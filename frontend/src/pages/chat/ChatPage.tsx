export default function ChatPage() {
  return (
    <div className="h-full flex">
      <div className="w-80 border-r bg-card">
        <div className="p-4 border-b">
          <h2 className="font-semibold">Messages</h2>
        </div>
        {/* Conversation list */}
      </div>
      <div className="flex-1 flex flex-col">
        <div className="flex-1 p-4">
          {/* Messages will be displayed here */}
          <p className="text-center text-muted-foreground">Select a conversation to start chatting</p>
        </div>
        <div className="p-4 border-t">
          <input type="text" placeholder="Type a message..." className="w-full px-4 py-2 border rounded-md" />
        </div>
      </div>
    </div>
  )
}
