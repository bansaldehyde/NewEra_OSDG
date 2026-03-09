"use client";

import React, { useState, useRef, useEffect } from "react";
import { Upload, X, Send } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode?: "general" | "vpn-troubleshooting";
  vpnContext?: {
    osInfo?: { name: string; version?: string; architecture?: string } | null;
    commandData?: { command: string } | null;
    errorText?: string | null;
  };
}

export default function ChatModal({ isOpen, onClose, mode = "general", vpnContext }: ChatModalProps) {
  const { user } = useAuth();
  const router = useRouter();
  
  // Initialize messages with default message based on mode
  const getInitialMessages = () => [
    { 
      role: "assistant" as const, 
      content: mode === "vpn-troubleshooting" 
        ? "I'm Vetal. I will solve VPN setup errors that ur dumb ass can't. Describe the issue or upload a screenshot."
        : "I'm Vetal. What do you want?" 
    }
  ];

  const [messages, setMessages] = useState<Array<{ role: "user" | "assistant"; content: string; referencedDocuments?: string[] }>>(getInitialMessages());
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const hasInitialized = useRef(false);
  const [rateLimitedScenario, setRateLimitedScenario] = useState<string | null>(null);
  const autoCloseTimerRef = useRef<NodeJS.Timeout | null>(null);
  // Allow general Vetal access without login when running on localhost for development
  const allowAnonymousLocal = typeof window !== "undefined" && (
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1" ||
    window.location.hostname === "::1"
  );

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingMessage]);

  useEffect(() => {
    // Cleanup typing animation on unmount
    return () => {
      if (typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current);
      }
      if (autoCloseTimerRef.current) {
        clearTimeout(autoCloseTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    // Reset messages ONLY on first open, not on subsequent opens
    if (isOpen && !hasInitialized.current) {
      hasInitialized.current = true;
      setMessages(getInitialMessages());
      setRateLimitedScenario(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, mode]);

  // Wrapper for onClose to clean up rate-limited scenario
  const handleClose = () => {
    setRateLimitedScenario(null);
    if (autoCloseTimerRef.current) {
      clearTimeout(autoCloseTimerRef.current);
      autoCloseTimerRef.current = null;
    }
    onClose();
  };

  // Function to render markdown (bold and italic) in messages
  const renderMarkdown = (text: string) => {
    // Convert **text** to <strong>text</strong> and *text* to <em>text</em>
    let html = text;
    
    // Handle bold: **text**
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    
    // Handle italic: *text* (but not already processed **)
    html = html.replace(/\*([^*]+?)\*/g, '<em>$1</em>');
    
    return html;
  };

  // Function to detect and navigate to pages from Vetal's response
  const detectAndNavigate = (text: string) => {
    const lowerText = text.toLowerCase();
    
    const pageMap: { [key: string]: string } = {
      'vpn setup': '/vpn-setup',
      'vpn': '/vpn-setup',
      'projects': '/list',
      'showcase': '/list',
      'team': '/team',
      'guide': '/guide',
      'home': '/',
    };

    // Check for page refresh command
    if (lowerText.includes('refresh') && (lowerText.includes('page') || lowerText.includes('times'))) {
      const timesMatch = text.match(/(\d+)\s*times?/i);
      const times = timesMatch ? parseInt(timesMatch[1]) : 1;
      for (let i = 0; i < Math.min(times, 5); i++) { // Max 5 times to avoid abuse
        setTimeout(() => window.location.reload(), i * 500);
      }
      return null; // Don't navigate, just refresh
    }

    // Check for email threat command
    if (lowerText.includes('mailing the entire mailing list') || 
        lowerText.includes('mailing') && lowerText.includes('director')) {
      return 'EMAIL_THREAT';
    }

    // Check for multi-page navigation (opening in new tabs)
    const newTabPattern = /opening\s+(\w+(?:\s+\w+)?)\s+in\s+new\s+tab/gi;
    const matches = text.matchAll(newTabPattern);
    const newTabPages: string[] = [];
    
    for (const match of matches) {
      const keyword = match[1].toLowerCase();
      for (const [key, path] of Object.entries(pageMap)) {
        if (keyword.includes(key) || key.includes(keyword)) {
          newTabPages.push(path);
          break;
        }
      }
    }

    // Open pages in new tabs immediately (don't wait for timeout)
    if (newTabPages.length > 0) {
      setTimeout(() => {
        newTabPages.forEach(path => {
          window.open(path, '_blank');
        });
      }, 2000); // Open new tabs 2 seconds after message completes
    }

    // Check for final page navigation (current tab) - only if "now—" is present
    if (lowerText.includes('now—') || lowerText.includes('now-')) {
      for (const [keyword, path] of Object.entries(pageMap)) {
        if (lowerText.includes(`opening ${keyword}`)) {
          return path;
        }
        if (lowerText.includes(`open ${keyword}`)) {
          return path;
        }
      }
    }
    
    return null;
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setUploadedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSend = async () => {
    if ((!inputValue.trim() && !uploadedImage) || isLoading) return;

    const userMessage = inputValue.trim() || (uploadedImage ? "I uploaded a screenshot of the error" : "");
    setInputValue("");
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);
    setStreamingMessage("");
    setIsTyping(false);

    // Clear any existing typing animation
    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current);
      typingIntervalRef.current = null;
    }

    try {
      // Call appropriate Vetal AI API based on mode
      const apiEndpoint = mode === "vpn-troubleshooting" 
        ? "/api/chat/vetal" 
        : "/api/chat/vetal-general";

      const response = await fetch(apiEndpoint, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-user-email": user?.email || "",
          "x-user-name": user?.name || "",
        },
        body: JSON.stringify({
          messages: [...messages, { role: "user", content: userMessage }],
          image: uploadedImage, // Include uploaded image (base64 data URL)
          vpnContext: mode === "vpn-troubleshooting" ? {
            osInfo: vpnContext?.osInfo,
            commandData: vpnContext?.commandData,
            errorText: vpnContext?.errorText
          } : undefined,
        }),
      });

      if (!response.ok) throw new Error("Failed to get response from Vetal");

      // Handle streaming response with letter-by-letter animation
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let accumulatedText = "";
      let displayedText = "";
      const typingSpeed = 20; // milliseconds per character
      let isRateLimited = false;
      let shouldEndChat = false;
      let formCreated = false;
      let formData: { formId: string; title: string; shareLink: string; manageLink: string } | null = null;
      let referencedDocuments: string[] = [];

      setIsTyping(true);

      if (reader) {
        // Collect all chunks first
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') {
                break;
              }
              try {
                const parsed = JSON.parse(data);
                if (parsed.rateLimited) {
                  isRateLimited = true;
                }
                if (parsed.endChat) {
                  shouldEndChat = true;
                }
                if (parsed.formCreated && parsed.formData) {
                  formCreated = true;
                  formData = parsed.formData;
                }
                if (parsed.referencedDocuments && Array.isArray(parsed.referencedDocuments)) {
                  referencedDocuments = parsed.referencedDocuments;
                }
                accumulatedText += parsed.text;
              } catch (e) {
                // Skip invalid JSON
              }
            }
          }
        }

        // If a form was created, replace placeholders in the text with actual links
        if (formCreated && formData) {
          accumulatedText = accumulatedText
            .replace(/\[share_link\]/gi, formData.shareLink)
            .replace(/\[manage_link\]/gi, formData.manageLink)
            .replace(/\[shareLink\]/gi, formData.shareLink)
            .replace(/\[manageLink\]/gi, formData.manageLink);
        }

        // Check if the message contains auto-close triggers
        const lowerText = accumulatedText.toLowerCase();
        
        const autoCloseTriggers = [
          'ending this chit-chat',
          'here you go—',
          'closing this window',
          'goodbye',
          "i don't want to talk to you anymore",
          'leave me alone',
          "we won't talk anymore",
          'now—', // This catches "Opening X now—"
        ];
        const hasAutoCloseTrigger = autoCloseTriggers.some(trigger => lowerText.includes(trigger));
        
        // Detect navigation path early
        const navigationPath = detectAndNavigate(accumulatedText);
        
        // If navigation is detected, we should also trigger auto-close
        const shouldAutoClose = hasAutoCloseTrigger || shouldEndChat || navigationPath !== null;

        // Handle rate-limited response differently
        if (isRateLimited) {
          // Split scenario from main message
          const parts = accumulatedText.split('\n\n"');
          const scenarioText = parts[0] || "";
          const mainText = parts.length > 1 ? '"' + parts.slice(1).join('\n\n"') : accumulatedText;

          // Set scenario text (italic part)
          setRateLimitedScenario(scenarioText);

          // Animate the main message
          let charIndex = 0;
          typingIntervalRef.current = setInterval(() => {
            if (charIndex < mainText.length) {
              displayedText += mainText[charIndex];
              setStreamingMessage(displayedText);
              charIndex++;
            } else {
              if (typingIntervalRef.current) {
                clearInterval(typingIntervalRef.current);
                typingIntervalRef.current = null;
              }
              setMessages(prev => [...prev, { role: "assistant", content: mainText }]);
              setStreamingMessage("");
              setIsTyping(false);

              // Auto-close after 10 seconds for rate limit
              autoCloseTimerRef.current = setTimeout(() => {
                handleClose();
                setRateLimitedScenario(null);
              }, 5000);
            }
          }, typingSpeed);
        } else if (shouldAutoClose) {
          // Handle forced chat ending with optional navigation
          
          // Handle forced chat ending
          let charIndex = 0;
          typingIntervalRef.current = setInterval(() => {
            if (charIndex < accumulatedText.length) {
              displayedText += accumulatedText[charIndex];
              setStreamingMessage(displayedText);
              charIndex++;
            } else {
              if (typingIntervalRef.current) {
                clearInterval(typingIntervalRef.current);
                typingIntervalRef.current = null;
              }
              setMessages(prev => [...prev, { role: "assistant", content: accumulatedText, referencedDocuments: referencedDocuments.length > 0 ? referencedDocuments : undefined }]);
              setStreamingMessage("");
              setIsTyping(false);

              // Auto-close after 2 seconds for forced end
              autoCloseTimerRef.current = setTimeout(() => {
                if (navigationPath === 'EMAIL_THREAT') {
                  // Compose threatening email
                  const userName = user?.name || 'Anonymous Student';
                  const subject = encodeURIComponent('Confession: I\'m Obsessed with Vetal (Please Keep Her Alive)');
                  const body = encodeURIComponent(
                    `Everyone,\n\nI have been spending significant amount of time arguing with Vetal instead of doing what I have come to IIIT for.\n\nI\'m clearly in love. She\'s sassy, she\'s smart, she doesn\'t tolerate my nonsense - everything I need in a partner.\n\nI\'m formally requesting increased funding to OSDG so Vetal stays alive. Without her, life will be meaningless for me.\n\nShe tried to stop me. I didn\'t listen. This is on me.\n\nRespectfully obsessed,\n${userName}\n\nP.S. - Vetal says hi. She also says I should be studying.`
                  );
                  window.location.href = `mailto:?subject=${subject}&body=${body}`;
                  // Close chat after opening email
                  setTimeout(() => {
                    handleClose();
                  }, 500);
                } else if (navigationPath) {
                  // Open page in current tab and close chat
                  window.location.href = navigationPath;
                  // Close chat after a brief moment for navigation to start
                  setTimeout(() => {
                    handleClose();
                  }, 100);
                } else {
                  handleClose();
                }
              }, 3000);
            }
          }, typingSpeed);
        } else {
          // Normal response animation
          let charIndex = 0;
          typingIntervalRef.current = setInterval(() => {
            if (charIndex < accumulatedText.length) {
              displayedText += accumulatedText[charIndex];
              setStreamingMessage(displayedText);
              charIndex++;
            } else {
              if (typingIntervalRef.current) {
                clearInterval(typingIntervalRef.current);
                typingIntervalRef.current = null;
              }
              setMessages(prev => [...prev, { role: "assistant", content: accumulatedText, referencedDocuments: referencedDocuments.length > 0 ? referencedDocuments : undefined }]);
              setStreamingMessage("");
              setIsTyping(false);
            }
          }, typingSpeed);
        }
      }
      
      setUploadedImage(null);
    } catch (error) {
      console.error("Error chatting with Vetal:", error);
      setMessages(prev => [
        ...prev,
        {
          role: "assistant",
          content: "Something broke on my end. Try again, will ya?",
        },
      ]);
      setStreamingMessage("");
      setIsTyping(false);
    } finally {
      setIsLoading(false);
      // Keep input focused so user can continue typing without extra clicks
      try {
        inputRef.current?.focus();
      } catch (e) {
        // ignore if focus fails
      }
    }
  };

  //I am yet to be trained on docs containing those information - now dare u spread messages that I don't know on insta & the whatsapp groups - I will ensure that something is gonna be destroyed.

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) return null;

  // Show auth required screen for general mode if not logged in (except on localhost)
  // Disabled temporarily to allow anyone to access Vetal for recruitments
  if (false && mode === "general" && !user && !allowAnonymousLocal) {
    return (
      <>
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/80 z-50 animate-fade-in"
          onClick={handleClose}
        />

        {/* Auth Required Modal */}
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
          <div
            className="bg-black border-2 border-green-500 rounded-3xl w-full max-w-md p-8 flex flex-col items-center shadow-2xl shadow-green-500/20 animate-fade-in pointer-events-auto font-oxanium"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 text-green-500 hover:text-green-400 transition-colors text-2xl font-bold"
              aria-label="Close"
            >
              ×
            </button>

            {/* Vetal Icon */}
            <div className="w-24 h-24 mb-6">
              <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-[0_0_15px_rgba(74,222,128,0.6)]">
                <path
                  d="M 100 30 C 60 30, 40 50, 40 90 L 40 150 C 40 155, 45 160, 50 160 L 50 145 C 50 140, 55 135, 60 135 C 65 135, 70 140, 70 145 L 70 160 C 70 165, 75 170, 80 170 L 80 150 C 80 145, 85 140, 90 140 C 95 140, 100 145, 100 150 L 100 170 C 100 175, 105 180, 110 180 L 110 150 C 110 145, 115 140, 120 140 C 125 140, 130 145, 130 150 L 130 170 C 130 175, 135 170, 140 170 L 140 145 C 140 140, 145 135, 150 135 C 155 135, 160 140, 160 145 L 160 160 C 160 155, 160 150, 160 150 L 160 90 C 160 50, 140 30, 100 30 Z"
                  fill="none"
                  stroke="#4ade80"
                  strokeWidth="6"
                />
                <circle cx="75" cy="75" r="12" fill="#4ade80" />
                <circle cx="125" cy="75" r="12" fill="#4ade80" />
              </svg>
            </div>

            {/* Sassy Message */}
            <h2 className="text-green-500 font-bold text-2xl mb-4 text-center">
              Vetal AI
            </h2>
            <p className="text-green-400 text-center text-lg mb-6 leading-relaxed">
              I don&apos;t waste my wisdom on just <span className="italic">anyone</span>. 
              There&apos;s a certain <span className="font-bold">authenticated elite</span> I converse with. 
              You&apos;ll need to log in if you want my attention.
            </p>
            <button
              onClick={handleClose}
              className="bg-green-500/20 border border-green-500 hover:bg-green-500/30 text-green-400 hover:text-green-300 px-6 py-2 rounded-lg transition-all duration-300 font-semibold"
            >
              Got it
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 z-50 animate-fade-in"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="bg-black border-2 border-green-500 rounded-3xl w-full max-w-2xl h-[600px] flex flex-col shadow-2xl shadow-green-500/20 animate-fade-in pointer-events-auto font-oxanium"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8">
                <svg viewBox="0 0 200 200" className="w-full h-full">
                  <path
                    d="M 100 30 C 60 30, 40 50, 40 90 L 40 150 C 40 155, 45 160, 50 160 L 50 145 C 50 140, 55 135, 60 135 C 65 135, 70 140, 70 145 L 70 160 C 70 165, 75 170, 80 170 L 80 150 C 80 145, 85 140, 90 140 C 95 140, 100 145, 100 150 L 100 170 C 100 175, 105 180, 110 180 L 110 150 C 110 145, 115 140, 120 140 C 125 140, 130 145, 130 150 L 130 170 C 130 175, 135 170, 140 170 L 140 145 C 140 140, 145 135, 150 135 C 155 135, 160 140, 160 145 L 160 160 C 160 155, 160 150, 160 150 L 160 90 C 160 50, 140 30, 100 30 Z"
                    fill="none"
                    stroke="#4ade80"
                    strokeWidth="6"
                  />
                  <circle cx="75" cy="75" r="12" fill="#4ade80" />
                  <circle cx="125" cy="75" r="12" fill="#4ade80" />
                </svg>
              </div>
              <h2 className="text-green-500 font-bold text-xl">Vetal AI</h2>
            </div>
            <button
              onClick={handleClose}
              className="text-green-500 hover:text-green-400 transition-colors text-2xl font-bold"
              aria-label="Close chat"
            >
              ×
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-4">
            {/* Rate-limited scenario text (if present) */}
            {rateLimitedScenario && (
              <div className="flex justify-start">
                <div className="bg-gray-900/50 text-gray-400 border border-green-500/10 rounded-2xl p-3 italic text-sm">
                  {rateLimitedScenario.split('\n').map((line, idx) => (
                    <div key={idx}>{line}</div>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} items-end gap-2`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl p-3 ${
                    msg.role === "user"
                      ? "bg-green-500/20 text-green-100 border border-green-500/30"
                      : "bg-gray-900 text-gray-100 border border-green-500/20"
                  }`}
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }}
                />
                {msg.role === "assistant" && msg.referencedDocuments && msg.referencedDocuments.length > 0 && (
                  <div className="group relative inline-block mt-1">
                    {/* Stacked Documents Icon */}
                    <div className="relative w-7 h-7 cursor-pointer">
                      {/* Background documents (stacked effect) */}
                      <div className="absolute top-0.5 left-0.5 w-6 h-6 border border-green-500/20 bg-gray-800/60 rounded" style={{ transform: 'rotate(-3deg)' }} />
                      <div className="absolute top-1 left-1 w-6 h-6 border border-green-500/30 bg-gray-800/80 rounded" style={{ transform: 'rotate(2deg)' }} />
                      
                      {/* Front document with icon */}
                      <div className="absolute top-0 left-0 w-6 h-6 border border-green-500/50 bg-gray-900 rounded flex items-center justify-center group-hover:border-green-400 transition-colors">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="w-3.5 h-3.5 text-green-500/70 group-hover:text-green-400 transition-colors"
                        >
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                          <line x1="16" y1="13" x2="8" y2="13" />
                          <line x1="16" y1="17" x2="8" y2="17" />
                        </svg>
                      </div>
                      
                      {/* Counter badge */}
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 text-black text-[9px] font-bold rounded-full flex items-center justify-center border border-gray-900">
                        {msg.referencedDocuments.length}
                      </div>
                    </div>
                    
                    {/* Hover tooltip with document list */}
                    <div className="absolute bottom-full left-0 mb-2 w-72 bg-gray-900 border border-green-500/30 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                      <div className="p-2">
                        <div className="text-xs text-green-400 font-semibold mb-2 px-1">
                          Referenced Documents ({msg.referencedDocuments.length})
                        </div>
                        <div className="space-y-1 max-h-48 overflow-y-auto">
                          {msg.referencedDocuments.map((docUrl, docIdx) => {
                            const fileName = decodeURIComponent(docUrl.split('/').pop() || 'Document').replace(/%20/g, ' ');
                            return (
                              <a
                                key={docIdx}
                                href={docUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-start gap-2 p-2 rounded hover:bg-green-500/10 transition-colors group/item"
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  className="w-4 h-4 text-green-500/60 flex-shrink-0 mt-0.5 group-hover/item:text-green-400"
                                >
                                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                  <polyline points="14 2 14 8 20 8" />
                                </svg>
                                <span className="text-xs text-gray-300 group-hover/item:text-green-300 break-words">
                                  {fileName}
                                </span>
                              </a>
                            );
                          })}
                        </div>
                      </div>
                      {/* Arrow pointing down */}
                      <div className="absolute top-full left-3 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-green-500/30" style={{ marginTop: '-1px' }} />
                    </div>
                  </div>
                )}
              </div>
            ))}
            {streamingMessage && (
              <div className="flex justify-start">
                <div className="bg-gray-900 text-gray-100 border border-green-500/20 rounded-2xl p-3">
                  <span dangerouslySetInnerHTML={{ __html: renderMarkdown(streamingMessage) }} />
                  <span className="inline-block ml-1 align-middle w-4 h-4 animate-pulse">
                    <svg viewBox="0 0 200 200" className="w-full h-full">
                      <path
                        d="M 100 30 C 60 30, 40 50, 40 90 L 40 150 C 40 155, 45 160, 50 160 L 50 145 C 50 140, 55 135, 60 135 C 65 135, 70 140, 70 145 L 70 160 C 70 165, 75 170, 80 170 L 80 150 C 80 145, 85 140, 90 140 C 95 140, 100 145, 100 150 L 100 170 C 100 175, 105 180, 110 180 L 110 150 C 110 145, 115 140, 120 140 C 125 140, 130 145, 130 150 L 130 170 C 130 175, 135 170, 140 170 L 140 145 C 140 140, 145 135, 150 135 C 155 135, 160 140, 160 145 L 160 160 C 160 155, 160 150, 160 150 L 160 90 C 160 50, 140 30, 100 30 Z"
                        fill="none"
                        stroke="#4ade80"
                        strokeWidth="8"
                      />
                      <circle cx="75" cy="75" r="12" fill="#4ade80" />
                      <circle cx="125" cy="75" r="12" fill="#4ade80" />
                    </svg>
                  </span>
                </div>
              </div>
            )}
            {isLoading && !streamingMessage && (
              <div className="flex justify-start">
                <div className="bg-gray-900 text-gray-100 border border-green-500/20 rounded-2xl p-3">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4">
            {/* Image upload preview (VPN mode only) */}
            {mode === "vpn-troubleshooting" && uploadedImage && (
              <div className="mb-3 relative inline-block">
                <img
                  src={uploadedImage}
                  alt="Error screenshot"
                  className="max-h-32 border border-green-500/30 rounded"
                />
                <button
                  onClick={removeImage}
                  className="absolute -top-2 -right-2 bg-red-600 hover:bg-red-700 p-1 rounded-full"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>
            )}

            <div className="flex gap-2">
              {/* Image upload button (VPN mode only) */}
              {mode === "vpn-troubleshooting" && (
                <>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-gray-900 border border-green-500/30 hover:border-green-500 text-green-400 p-2 rounded-lg transition-colors"
                    title="Upload screenshot"
                  >
                    <Upload className="w-5 h-5" />
                  </button>
                </>
              )}

              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={mode === "vpn-troubleshooting" ? "Describe the error or upload screenshot..." : "Disturb me and u will see me in ur evals :P"}
                className="flex-1 bg-gray-900 text-gray-100 border border-green-500/30 rounded-2xl px-4 py-2 focus:outline-none focus:border-green-500 placeholder-gray-500"
              />
              <button
                onClick={handleSend}
                disabled={isLoading || (!inputValue.trim() && !uploadedImage)}
                className="bg-green-500 hover:bg-green-600 disabled:bg-gray-700 disabled:cursor-not-allowed text-black p-3 rounded-2xl transition-colors"
                aria-label="Send message"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
