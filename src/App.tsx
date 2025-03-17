// import { MessageSquare } from "lucide-react";
// import { useState } from "react";
// import { ChatInput } from "./components/ChatInput";
// import { ChatMessage } from "./components/ChatMessage";
// import { ChatState, Message } from "./types/chat";

// function App() {
//   const [chatState, setChatState] = useState<ChatState>({
//     messages: [],
//     isLoading: false,
//   });

//   const handleSendMessage = async (content: string) => {
//     // Create new user message
//     const userMessage: Message = {
//       id: Date.now().toString(),
//       content,
//       role: "user",
//       timestamp: new Date(),
//     };

//     // Update messages with user message
//     setChatState((prev) => ({
//       ...prev,
//       messages: [...prev.messages, userMessage],
//       isLoading: true,
//     }));

//     try {
//       // Make API call to backend
//       const response = await fetch("/api/chat", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({ message: content }),
//       });

//       if (!response.ok) {
//         throw new Error("Failed to fetch response from server");
//       }

//       const data = await response.json();

//       // Create assistant message from API response
//       const assistantMessage: Message = {
//         id: (Date.now() + 1).toString(),
//         content: data.response || "No response from server",
//         role: "assistant",
//         timestamp: new Date(),
//       };

//       // Update messages with assistant response
//       setChatState((prev) => ({
//         ...prev,
//         messages: [...prev.messages, assistantMessage],
//         isLoading: false,
//       }));
//     } catch (error) {
//       console.error("Error sending message:", error);

//       // Handle error case
//       const errorMessage: Message = {
//         id: (Date.now() + 2).toString(),
//         content: "Error: Unable to fetch response. Please try again later.",
//         role: "assistant",
//         timestamp: new Date(),
//       };

//       setChatState((prev) => ({
//         ...prev,
//         messages: [...prev.messages, errorMessage],
//         isLoading: false,
//       }));
//     }
//   };

//   return (
//     <div className="flex flex-col h-screen bg-gray-50">
//       {/* Header */}
//       <header className="bg-white border-b px-4 py-3">
//         <div className="max-w-3xl mx-auto flex items-center gap-2">
//           <MessageSquare className="w-6 h-6 text-blue-500" />
//           <h1 className="text-xl font-semibold">AI Chat Assistant</h1>
//         </div>
//       </header>

//       {/* Chat Messages */}
//       <div className="flex-1 overflow-y-auto">
//         <div className="max-w-3xl mx-auto">
//           {chatState.messages.length === 0 ? (
//             <div className="flex flex-col items-center justify-center h-full text-center p-8">
//               <MessageSquare className="w-12 h-12 text-gray-300 mb-4" />
//               <h2 className="text-xl font-semibold text-gray-700 mb-2">
//                 Welcome to AI Chat Assistant
//               </h2>
//               <p className="text-gray-500">
//                 Start a conversation by typing a message below.
//               </p>
//             </div>
//           ) : (
//             chatState.messages.map((message) => (
//               <ChatMessage key={message.id} message={message} />
//             ))
//           )}
//           {chatState.isLoading && (
//             <div className="p-6 text-center">
//               <div className="inline-block animate-bounce text-gray-500">
//                 ...
//               </div>
//             </div>
//           )}
//         </div>
//       </div>

//       {/* Chat Input */}
//       <ChatInput onSend={handleSendMessage} isLoading={chatState.isLoading} />
//     </div>
//   );
// }

// export default App;
import { MessageSquare } from "lucide-react";
import { useState } from "react";
import { ChatInput } from "./components/ChatInput";
import { ChatMessage } from "./components/ChatMessage";
import { ChatState, Message } from "./types/chat";

function App() {
  const [chatState, setChatState] = useState<ChatState>({
    messages: [],
    isLoading: false,
  });

  const handleSendMessage = async (content: string) => {
    // Create new user message
    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      role: "user",
      timestamp: new Date(),
    };

    // Create a placeholder for assistant's message
    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      content: "",
      role: "assistant",
      timestamp: new Date(),
    };

    // Update messages with user message and empty assistant message
    setChatState((prev) => ({
      ...prev,
      messages: [...prev.messages, userMessage, assistantMessage],
      isLoading: true,
    }));

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: content }),
      });

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      // Create a new ReadableStream from the response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error("Response body reader not available");
      }

      // Read the stream
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        // Decode the chunk and parse the SSE data
        const text = decoder.decode(value);
        const lines = text.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              // Update the assistant's message with the new chunk
              setChatState((prev) => ({
                ...prev,
                messages: prev.messages.map((msg) =>
                  msg.id === assistantMessage.id
                    ? { ...msg, content: msg.content + data.text }
                    : msg
                ),
              }));
            } catch (e) {
              console.error("Error parsing SSE data:", e);
            }
          }
        }
      }
    } catch (error) {
      console.error("Error:", error);
      // Update the assistant's message with the error
      setChatState((prev) => ({
        ...prev,
        messages: prev.messages.map((msg) =>
          msg.id === assistantMessage.id
            ? {
                ...msg,
                content:
                  "Sorry, an error occurred while processing your request.",
              }
            : msg
        ),
      }));
    } finally {
      // Set loading to false when done
      setChatState((prev) => ({
        ...prev,
        isLoading: false,
      }));
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center gap-2">
          <MessageSquare className="w-6 h-6 text-blue-500" />
          <h1 className="text-xl font-semibold">AI Chat Assistant</h1>
        </div>
      </header>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto">
          {chatState.messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <MessageSquare className="w-12 h-12 text-gray-300 mb-4" />
              <h2 className="text-xl font-semibold text-gray-700 mb-2">
                Welcome to AI Chat Assistant
              </h2>
              <p className="text-gray-500">
                Start a conversation by typing a message below.
              </p>
            </div>
          ) : (
            chatState.messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))
          )}
        </div>
      </div>

      {/* Chat Input */}
      <ChatInput onSend={handleSendMessage} isLoading={chatState.isLoading} />
    </div>
  );
}

export default App;
