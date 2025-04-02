import { Bot, Code, Eye, User } from "lucide-react";
import { useState } from "react";
import { Message } from "../types/chat";
import { CodeBlock } from "./CodeBlock";

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";
  const [activeTab, setActiveTab] = useState<"code" | "preview">("code");

  const renderContent = (content: string) => {
    const parts = content.split(/(```[\s\S]*?```)/);

    const renderedParts = parts.map((part, index) => {
      if (part.startsWith("```") && part.endsWith("```")) {
        // Extract language and code
        const match = part.match(/```(\w+)?\n([\s\S]*?)```/);
        if (match) {
          const [, language = "javascript", code] = match;
          const isReactCode =
            code.includes("React") ||
            code.includes("jsx") ||
            code.includes("<div");

          if (isReactCode) {
            return (
              <div key={index} className="w-full">
                <div className="border rounded-lg overflow-hidden">
                  <div className="flex border-b bg-gray-50">
                    <button
                      className={`flex items-center gap-2 px-4 py-2 text-sm font-medium ${
                        activeTab === "code"
                          ? "bg-white text-blue-600 border-b-2 border-blue-600"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                      onClick={() => setActiveTab("code")}
                    >
                      <Code size={16} />
                      Code
                    </button>
                    <button
                      className={`flex items-center gap-2 px-4 py-2 text-sm font-medium ${
                        activeTab === "preview"
                          ? "bg-white text-blue-600 border-b-2 border-blue-600"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                      onClick={() => setActiveTab("preview")}
                    >
                      <Eye size={16} />
                      Preview
                    </button>
                  </div>
                  <div className="bg-white">
                    {<CodeBlock code={code.trim()} language={language} />}
                  </div>
                </div>
              </div>
            );
          }

          return (
            <div key={index} className="w-full">
              <CodeBlock code={code.trim()} language={language} />
            </div>
          );
        }
      }

      return (
        <p key={index} className="text-gray-700 whitespace-pre-wrap">
          {part}
        </p>
      );
    });

    return <div className="space-y-4">{renderedParts}</div>;
  };

  return (
    <div className={`flex gap-4 p-6 ${isUser ? "bg-white" : "bg-gray-50"}`}>
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
          isUser ? "bg-blue-100" : "bg-green-100"
        }`}
      >
        {isUser ? (
          <User size={20} className="text-blue-600" />
        ) : (
          <Bot size={20} className="text-green-600" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 mb-1">
          {isUser ? "You" : "Assistant"}
        </p>
        {renderContent(message.content)}
      </div>
    </div>
  );
}
