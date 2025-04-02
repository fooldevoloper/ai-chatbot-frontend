import { Eye, MessageSquare } from "lucide-react";
import { useState } from "react";
import { ChatInput } from "./components/ChatInput";
import { ChatMessage } from "./components/ChatMessage";
import { ChatState, Message } from "./types/chat";

function App() {
  const [chatState, setChatState] = useState<ChatState>({
    messages: [],
    isLoading: false,
  });
  const [activeTab, setActiveTab] = useState<"chat" | "preview">("chat");

  const determineTool = (content: string) => {
    if (/weather|temperature|forecast/i.test(content)) {
      return "get_current_weather";
    }
    if (/city|location|place info/i.test(content)) {
      return "get_current_location_info";
    }
    if (/hacker news|latest news|tech news/i.test(content)) {
      return "get_latest_hacker_news";
    }
    return "unknown_tool";
  };

  const handleSendMessage = async (content: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      role: "user",
      timestamp: new Date(),
    };

    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      content: "",
      role: "assistant",
      timestamp: new Date(),
    };

    setChatState((prev) => ({
      ...prev,
      messages: [...prev.messages, userMessage, assistantMessage],
      isLoading: true,
    }));

    const selectedTool = determineTool(content);
    let additionalContext = "";

    try {
      if (selectedTool === "get_current_weather") {
        const weatherResponse = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?q=New York&units=metric&appid=YOUR_API_KEY`
        );
        const weatherData = await weatherResponse.json();

        additionalContext = `The current weather in ${weatherData.name} is ${weatherData.weather[0].description} with a temperature of ${weatherData.main.temp}°C.`;
      }

      if (selectedTool === "get_current_location_info") {
        const locationResponse = await fetch(
          `https://geocode.xyz/New York?json=1`
        );
        const locationData = await locationResponse.json();

        additionalContext = `New York is located at latitude ${locationData.latt} and longitude ${locationData.longt}.`;
      }

      if (selectedTool === "get_latest_hacker_news") {
        const newsResponse = await fetch(
          `https://hacker-news.firebaseio.com/v0/topstories.json`
        );
        const topStoryIds = await newsResponse.json();
        const topStoryId = topStoryIds[0];

        const storyResponse = await fetch(
          `https://hacker-news.firebaseio.com/v0/item/${topStoryId}.json`
        );
        const storyData = await storyResponse.json();

        additionalContext = `The latest Hacker News story is titled "${storyData.title}" and can be read at ${storyData.url}.`;
      }

      const response = await fetch("http://localhost:11434/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "deepseek-r1:1.5b",
          prompt: `${content}\n\n${additionalContext}`,
          stream: true,
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error("Failed to connect to the chat API.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const json = JSON.parse(line);
            if (json.response) {
              assistantContent += json.response;
            }
          } catch (error) {
            console.warn("Error parsing JSON:", error, "Chunk:", line);
          }
        }

        setChatState((prev) => ({
          ...prev,
          messages: prev.messages.map((msg) =>
            msg.id === assistantMessage.id
              ? { ...msg, content: assistantContent }
              : msg
          ),
        }));
      }
    } catch (error) {
      console.error("Error:", error);
      setChatState((prev) => ({
        ...prev,
        messages: prev.messages.map((msg) =>
          msg.id === assistantMessage.id
            ? { ...msg, content: "Error fetching real-time data." }
            : msg
        ),
      }));
    } finally {
      setChatState((prev) => ({
        ...prev,
        isLoading: false,
      }));
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <header className="bg-white border-b px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-blue-500" />
            <h1 className="text-xl font-semibold">AI Chat Assistant</h1>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("chat")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === "chat"
                  ? "bg-blue-100 text-blue-700"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <MessageSquare size={16} />
              Chat
            </button>
            <button
              onClick={() => setActiveTab("preview")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === "preview"
                  ? "bg-blue-100 text-blue-700"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <Eye size={16} />
              Preview
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-hidden">
        {activeTab === "chat" ? (
          <div className="h-full flex flex-col">
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
            <ChatInput
              onSend={handleSendMessage}
              isLoading={chatState.isLoading}
            />
          </div>
        ) : (
          <div className="h-full">"Feature not Implemented"</div>
        )}
      </div>
    </div>
  );
}

export default App;
