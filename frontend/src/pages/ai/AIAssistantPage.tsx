export default function AIAssistantPage() {
  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="text-center text-muted-foreground py-8">
          <h2 className="text-xl font-semibold mb-2">AI Mental Health Assistant</h2>
          <p>Start a conversation with our AI companion for support and guidance.</p>
        </div>
        {/* Chat messages will be displayed here */}
      </div>
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <input type="text" placeholder="Type your message..." className="flex-1 px-4 py-2 border rounded-md" />
          <button className="bg-primary text-primary-foreground px-6 py-2 rounded-md">Send</button>
        </div>
      </div>
    </div>
  )
}
