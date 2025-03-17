import { Bot, User } from "lucide-react";
import { Message } from "../types/chat";
import { CodeBlock } from "./CodeBlock";

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";

  const renderContent = (content: string) => {
    const parts = content.split(/(```[\s\S]*?```)/);
    return parts.map((part, index) => {
      if (part.startsWith("```") && part.endsWith("```")) {
        // Extract language and code
        const match = part.match(/```(\w+)?\n([\s\S]*?)```/);
        if (match) {
          const [, language = "javascript", code] = match;
          return (
            <CodeBlock key={index} code={code.trim()} language={language} />
          );
        }
      }
      return (
        <p key={index} className="text-gray-700 whitespace-pre-wrap">
          {part}
        </p>
      );
    });
  };

  return (
    <div className={`flex gap-4 p-6 ${isUser ? "bg-white" : "bg-gray-50"}`}>
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center ${
          isUser ? "bg-blue-100" : "bg-green-100"
        }`}
      >
        {isUser ? (
          <User size={20} className="text-blue-600" />
        ) : (
          <Bot size={20} className="text-green-600" />
        )}
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-900 mb-1">
          {isUser ? "You" : "Assistant"}
        </p>
        <div className="space-y-2">{renderContent(message.content)}</div>
      </div>
    </div>
  );
}
