"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LoadingButton } from "@/components/ui/loading-button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Send, Users, Target, LogOut, Loader2, Paperclip, Mic, X, Download, Eye } from "lucide-react"
import { logout } from "@/lib/auth/actions"
import { uploadFileToStorage, validateFile, formatFileSize, getFileIcon } from "@/lib/storage/file-upload"
import { saveChatMessage, getChatHistory, type ChatMessage } from "@/lib/ai/chat-actions"
import Link from "next/link"
import Image from "next/image"

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  file_url?: string
  file_name?: string
  file_type?: string
  file_size?: number
}

interface FilePreview {
  file: File
  url: string
  name: string
  size: number
  type: string
}

interface AIMentorChatProps {
  user: any
}

export function AIMentorChat({ user }: AIMentorChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingHistory, setIsLoadingHistory] = useState(true)
  const [filePreview, setFilePreview] = useState<FilePreview | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Load chat history on component mount
  useEffect(() => {
    loadChatHistory()
  }, [])

  const loadChatHistory = async () => {
    try {
      const result = await getChatHistory(user.id)
      if (result.success && result.data.length > 0) {
        const historyMessages: Message[] = result.data.map((msg: any) => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          timestamp: new Date(msg.created_at),
          file_url: msg.file_url,
          file_name: msg.file_name,
          file_type: msg.file_type,
          file_size: msg.file_size
        }))
        setMessages(historyMessages)
      } else {
        // Show welcome message if no history
        setMessages([{
          id: '1',
          role: 'assistant',
          content: `Hi ${user.username || user.participant_id}, I'm Noni, your AI mentor at RE-Novate. I can help with your entrepreneurship journey, answer questions about business concepts, provide guidance on simulations, or discuss your goals. What would you like to talk about?`,
          timestamp: new Date()
        }])
      }
    } catch (error) {
      console.error('Error loading chat history:', error)
      // Show welcome message on error
      setMessages([{
        id: '1',
        role: 'assistant',
        content: `Hi ${user.username || user.participant_id}, I'm Noni, your AI mentor at RE-Novate. I can help with your entrepreneurship journey, answer questions about business concepts, provide guidance on simulations, or discuss your goals. What would you like to talk about?`,
        timestamp: new Date()
      }])
    } finally {
      setIsLoadingHistory(false)
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const validation = validateFile(file)
    if (!validation.valid) {
      alert(validation.error)
      return
    }

    const preview: FilePreview = {
      file,
      url: URL.createObjectURL(file),
      name: file.name,
      size: file.size,
      type: file.type
    }

    setFilePreview(preview)
  }

  const removeFilePreview = () => {
    if (filePreview) {
      URL.revokeObjectURL(filePreview.url)
      setFilePreview(null)
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSendMessage = async () => {
    if ((!inputMessage.trim() && !filePreview) || isLoading) return

    let fileUrl: string | undefined
    let fileName: string | undefined
    let fileType: string | undefined
    let fileSize: number | undefined

    // Upload file if present
    if (filePreview) {
      setIsUploading(true)
      const uploadResult = await uploadFileToStorage(filePreview.file, user.id)
      
      if (!uploadResult.success) {
        alert(`File upload failed: ${uploadResult.error}`)
        setIsUploading(false)
        return
      }

      fileUrl = uploadResult.url
      fileName = uploadResult.fileName
      fileType = uploadResult.fileType
      fileSize = uploadResult.fileSize
      setIsUploading(false)
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage.trim() || `Shared a file: ${fileName}`,
      timestamp: new Date(),
      file_url: fileUrl,
      file_name: fileName,
      file_type: fileType,
      file_size: fileSize
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage("")
    removeFilePreview()
    setIsLoading(true)

    // Save user message to database
    await saveChatMessage({
      userId: user.id,
      role: 'user',
      content: userMessage.content,
      fileUrl,
      fileName,
      fileType,
      fileSize
    })

    try {
      const response = await fetch('/api/ai/mentor-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: inputMessage.trim() || `User shared a file: ${fileName}`,
          userId: user.id,
          username: user.username || user.participant_id,
          careerPath: user.career_path,
          conversationHistory: messages.slice(-5), // Send last 5 messages for context
          fileUrl,
          fileName,
          fileType
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to get response from Noni')
      }

      const data = await response.json()
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, assistantMessage])

      // Save assistant message to database
      await saveChatMessage({
        userId: user.id,
        role: 'assistant',
        content: assistantMessage.content
      })
    } catch (error) {
      console.error('Error sending message:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I'm sorry, I'm having trouble connecting right now. Please try again in a moment! 😊",
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleMicrophoneClick = () => {
    setIsRecording(!isRecording)
    alert('Audio recording will be available soon')
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className="flex min-h-screen bg-white">
      {/* Sidebar - Hidden on mobile */}
      <div className="hidden lg:flex w-64 bg-black text-white p-6 flex-col">
        <div className="mb-8">
          <h2 className="text-xl font-bold">RE-Novate</h2>
          <p className="text-gray-400 text-sm">{user.username || user.participant_id}</p>
        </div>
        
        <nav className="flex-1 space-y-2">
          <Link href="/student/dashboard" className="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-800 text-gray-300 hover:text-white">
            <Target className="h-4 w-4" />
            Dashboard
          </Link>
          <Link href="/student/profile" className="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-800 text-gray-300 hover:text-white">
            <Users className="h-4 w-4" />
            Profile
          </Link>
          <Link href="/student/community" className="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-800 text-gray-300 hover:text-white">
            <Users className="h-4 w-4" />
            Community
          </Link>
          <a href="/student/mentor" className="flex items-center gap-3 px-3 py-2 rounded bg-white text-black font-medium">
            <div className="h-4 w-4 text-center">🤖</div>
            Noni AI Mentor
          </a>
        </nav>
        
        <form action={logout} className="mt-auto">
          <button className="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-800 text-gray-300 hover:text-white w-full text-left">
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </form>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b border-gray-200 p-4 lg:p-6">
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4">
            <Link href="/student/dashboard" className="lg:hidden">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <Link href="/student/dashboard" className="hidden lg:block">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 lg:w-10 lg:h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm lg:text-lg">
                🤖
              </div>
              <div>
                <h1 className="text-xl lg:text-2xl font-bold text-black">Noni AI Mentor</h1>
                <p className="text-gray-600 text-xs lg:text-sm">Your friendly entrepreneurship guide</p>
              </div>
            </div>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-4">
          {isLoadingHistory ? (
            <div className="flex justify-center items-center h-32">
              <div className="flex items-center gap-2 text-gray-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                <p className="text-sm">Loading chat history...</p>
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] rounded-lg p-4 ${
                    message.role === 'user'
                      ? 'bg-black text-white'
                      : 'bg-gray-100 text-black border border-gray-200'
                  }`}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                  
                  {/* File attachment display */}
                  {message.file_url && (
                    <div className="mt-3 p-3 bg-white/10 rounded-lg border border-white/20">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">{getFileIcon(message.file_type || '')}</span>
                        <span className="text-sm font-medium">{message.file_name}</span>
                        {message.file_size && (
                          <span className="text-xs opacity-70">({formatFileSize(message.file_size)})</span>
                        )}
                      </div>
                      
                      {/* Image preview */}
                      {message.file_type?.startsWith('image/') && (
                        <div className="mt-2">
                          <Image
                            src={message.file_url}
                            alt={message.file_name || 'Uploaded image'}
                            width={200}
                            height={150}
                            className="rounded-lg object-cover max-w-full h-auto"
                          />
                        </div>
                      )}
                      
                      <div className="flex gap-2 mt-2">
                        <a
                          href={message.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs hover:underline"
                        >
                          <Eye className="h-3 w-3" />
                          View
                        </a>
                        <a
                          href={message.file_url}
                          download={message.file_name}
                          className="flex items-center gap-1 text-xs hover:underline"
                        >
                          <Download className="h-3 w-3" />
                          Download
                        </a>
                      </div>
                    </div>
                  )}
                  
                  <p className={`text-xs mt-2 ${
                    message.role === 'user' ? 'text-gray-300' : 'text-gray-500'
                  }`}>
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))
          )}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 text-black border border-gray-200 rounded-lg p-4 max-w-[70%]">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <p className="text-sm">Noni is thinking...</p>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-200 p-4 lg:p-6">
          {/* File Preview */}
          {filePreview && (
            <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-gray-700">File to upload:</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={removeFilePreview}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="flex items-center gap-3">
                <span className="text-2xl">{getFileIcon(filePreview.type)}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{filePreview.name}</p>
                  <p className="text-xs text-gray-500">{formatFileSize(filePreview.size)}</p>
                </div>
                
                {/* Image preview */}
                {filePreview.type.startsWith('image/') && (
                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100">
                    <Image
                      src={filePreview.url}
                      alt="Preview"
                      width={64}
                      height={64}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex gap-3">
            {/* File input */}
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileSelect}
              className="hidden"
              accept="image/*,.pdf,.doc,.docx,.txt,.xls,.xlsx"
            />
            
            {/* File upload button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading || isUploading}
              className="shrink-0"
            >
              <Paperclip className="h-4 w-4" />
            </Button>

            {/* Microphone button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleMicrophoneClick}
              disabled={isLoading}
              className={`shrink-0 ${isRecording ? 'bg-red-100 text-red-600 border-red-300' : ''}`}
            >
              <Mic className="h-4 w-4" />
            </Button>

            {/* Message input */}
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask Noni anything about entrepreneurship, business, or your learning journey..."
              className="flex-1"
              disabled={isLoading || isUploading}
            />

            {/* Send button */}
            <Button 
              onClick={handleSendMessage}
              disabled={(!inputMessage.trim() && !filePreview) || isLoading || isUploading}
              className="bg-black hover:bg-gray-800 text-white shrink-0"
            >
              {isLoading || isUploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          
          <div className="flex items-center justify-between mt-2">
            <p className="text-xs text-gray-500">
              Try asking: "How do I improve my leadership skills?" or upload files for feedback
            </p>
            {isUploading && (
              <p className="text-xs text-blue-600">Uploading file...</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}