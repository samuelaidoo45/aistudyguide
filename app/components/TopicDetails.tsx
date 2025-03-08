'use client'

import { useState } from 'react'
import { Topic } from '../../types/topic'
import { Subtopic } from '../../types/subtopic'
import { Flashcard } from '../../types/flashcard'
import Link from 'next/link'
import { ArrowLeft, BookOpen, Clock, Calendar, BarChart } from 'lucide-react'

interface TopicDetailsProps {
  topic: Topic
  subtopics: Subtopic[]
  flashcards: Flashcard[]
  setTopic: (topic: Topic) => void
  setSubtopics: (subtopics: Subtopic[]) => void
  setFlashcards: (flashcards: Flashcard[]) => void
}

export default function TopicDetails({
  topic,
  subtopics,
  flashcards,
  setTopic,
  setSubtopics,
  setFlashcards
}: TopicDetailsProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'subtopics' | 'flashcards'>('overview')
  
  // Sanitize HTML content to prevent XSS attacks
  const sanitizeHtml = (html: string) => {
    if (!html) return '';
    
    return html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/on\w+="[^"]*"/g, '')
      .replace(/javascript:/g, '')
      .replace(/data:/g, 'data-safe:');
  };

  return (
    <div className="max-w-6xl mx-auto bg-white rounded-lg shadow-md overflow-hidden">
      {/* Topic Header */}
      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link href="/dashboard/topics" className="text-gray-500 hover:text-gray-700">
              <ArrowLeft size={20} />
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">{topic.title || topic.name || 'Untitled Topic'}</h1>
          </div>
          <div className="flex space-x-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {topic.category || 'General'}
            </span>
          </div>
        </div>
      </div>
      
      {/* Debug info in development mode */}
      {process.env.NODE_ENV === 'development' && (
        <div className="px-6 py-2 bg-yellow-50 border-b border-yellow-200 text-xs">
          <details>
            <summary className="cursor-pointer font-medium">Debug Info</summary>
            <div className="mt-2 p-2 bg-yellow-100 rounded">
              <p><strong>Topic ID:</strong> {topic.id}</p>
              <p><strong>Available fields:</strong> {Object.keys(topic).join(', ')}</p>
              <p><strong>Title field:</strong> {topic.title ? 'Present' : 'Missing'}</p>
              <p><strong>Name field:</strong> {topic.name ? 'Present' : 'Missing'}</p>
              <p><strong>Main outline:</strong> {topic.main_outline ? 'Present' : 'Missing'}</p>
            </div>
          </details>
        </div>
      )}
      
      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex -mb-px">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-6 py-3 text-sm font-medium ${
              activeTab === 'overview'
                ? 'border-b-2 border-indigo-500 text-indigo-600'
                : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('subtopics')}
            className={`px-6 py-3 text-sm font-medium ${
              activeTab === 'subtopics'
                ? 'border-b-2 border-indigo-500 text-indigo-600'
                : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Subtopics ({subtopics.length})
          </button>
          <button
            onClick={() => setActiveTab('flashcards')}
            className={`px-6 py-3 text-sm font-medium ${
              activeTab === 'flashcards'
                ? 'border-b-2 border-indigo-500 text-indigo-600'
                : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Flashcards ({flashcards.length})
          </button>
        </nav>
      </div>
      
      {/* Content */}
      <div className="p-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Topic stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="flex items-center">
                  <Calendar className="h-8 w-8 text-indigo-500 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Created On</p>
                    <p className="font-medium">
                      {new Date(topic.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="flex items-center">
                  <Clock className="h-8 w-8 text-indigo-500 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Last Accessed</p>
                    <p className="font-medium">
                      {topic.last_accessed ? new Date(topic.last_accessed).toLocaleDateString() : 'Never'}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="flex items-center">
                  <BarChart className="h-8 w-8 text-indigo-500 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Progress</p>
                    <div className="w-32 bg-gray-200 rounded-full h-2.5 mt-1.5">
                      <div
                        className="bg-indigo-600 h-2.5 rounded-full"
                        style={{ width: `${topic.progress || 0}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Description */}
            {topic.description && (
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <h2 className="text-lg font-medium mb-2">Description</h2>
                <p className="text-gray-600">{topic.description}</p>
              </div>
            )}
            
            {/* Main Outline - ensure it's always displayed when available */}
            {topic.main_outline && (
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <h2 className="text-lg font-medium mb-2">Study Outline</h2>
                
                {/* Debug info to understand main_outline */}
                {process.env.NODE_ENV === 'development' && (
                  <div className="bg-yellow-50 p-2 mb-4 text-xs rounded">
                    <p>
                      <strong>Raw outline length:</strong> {topic.main_outline.length} characters
                    </p>
                    <p>
                      <strong>First 50 chars:</strong> 
                      <code className="bg-yellow-100 p-1 rounded">
                        {topic.main_outline.substring(0, 50) + (topic.main_outline.length > 50 ? '...' : '')}
                      </code>
                    </p>
                    <details>
                      <summary className="cursor-pointer">View raw HTML</summary>
                      <pre className="bg-gray-100 p-2 mt-2 overflow-auto max-h-40 text-xs">
                        {topic.main_outline}
                      </pre>
                    </details>
                  </div>
                )}
                
                <div 
                  className="prose max-w-none"
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(topic.main_outline) }}
                ></div>
              </div>
            )}
            
            {/* Show a message if no main outline is available */}
            {!topic.main_outline && (
              <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
                <h2 className="text-lg font-medium mb-2">Study Outline</h2>
                <p className="text-gray-500 italic">No outline available for this topic.</p>
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'subtopics' && (
          <div>
            {subtopics.length > 0 ? (
              <div className="space-y-4">
                {subtopics.map((subtopic) => (
                  <div key={subtopic.id} className="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition">
                    <Link href={`/dashboard/subtopics/${subtopic.id}`} className="block">
                      <h3 className="text-lg font-medium text-indigo-600 mb-2">{subtopic.title}</h3>
                      <div className="text-sm text-gray-500 flex items-center justify-between">
                        <span>Created: {new Date(subtopic.created_at).toLocaleDateString()}</span>
                        {subtopic.last_accessed && (
                          <span>Last accessed: {new Date(subtopic.last_accessed).toLocaleDateString()}</span>
                        )}
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10">
                <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No subtopics yet</h3>
                <p className="mt-1 text-sm text-gray-500">Get started by creating a new subtopic.</p>
                <div className="mt-6">
                  <Link
                    href={`/dashboard/topics/${topic.id}/new-subtopic`}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    New Subtopic
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'flashcards' && (
          <div>
            {flashcards.length > 0 ? (
              <div className="space-y-4">
                {flashcards.map((card) => (
                  <div key={card.id} className="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition">
                    <div className="font-medium mb-2">Front:</div>
                    <p className="bg-gray-50 p-3 rounded mb-4">{card.front}</p>
                    <div className="font-medium mb-2">Back:</div>
                    <p className="bg-gray-50 p-3 rounded">{card.back}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10">
                <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No flashcards yet</h3>
                <p className="mt-1 text-sm text-gray-500">Get started by creating a new flashcard.</p>
                <div className="mt-6">
                  <Link
                    href={`/dashboard/topics/${topic.id}/new-flashcard`}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    New Flashcard
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
} 