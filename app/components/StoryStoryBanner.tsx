import React from 'react';
import { ChevronRight } from 'lucide-react';

export default function StoryStoryBanner() {
  return (
    <div className="mt-8 bg-indigo-600 rounded-2xl shadow-xl overflow-hidden border border-indigo-500">
      <div className="relative p-6 md:p-8">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2"></div>
        
        <div className="relative flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex-1 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start mb-2">
              <span className="text-2xl mr-2">✨</span>
              <span className="text-indigo-100 text-sm font-medium uppercase tracking-wider">Recommended</span>
            </div>
            <h3 className="text-2xl md:text-3xl font-bold text-white mb-3">
              Magical AI Storytelling for Kids
            </h3>
            <p className="text-indigo-100 text-base md:text-lg mb-4 max-w-xl">
              Create personalized, illustrated audiobooks featuring your child as the hero. Turn imagination into magical stories in seconds!
            </p>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 text-indigo-100 text-sm">
              <span className="flex items-center bg-indigo-700/50 px-3 py-1 rounded-full border border-indigo-500/50">
                <span className="mr-1">🎨</span> AI Illustrations
              </span>
              <span className="flex items-center bg-indigo-700/50 px-3 py-1 rounded-full border border-indigo-500/50">
                <span className="mr-1">🔊</span> Voice Narration
              </span>
              <span className="flex items-center bg-indigo-700/50 px-3 py-1 rounded-full border border-indigo-500/50">
                <span className="mr-1">📚</span> Personalized Stories
              </span>
            </div>
          </div>
          
          <div className="flex flex-col items-center gap-3">
            <a
              href="https://www.storystory.online/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-8 py-4 bg-white text-indigo-600 font-bold rounded-xl hover:bg-gray-50 transition-all transform hover:scale-105 shadow-lg"
            >
              <span className="mr-2">📖</span>
              Visit StoryStory
              <ChevronRight className="w-5 h-5 ml-1" />
            </a>
            <span className="text-indigo-200 text-xs">Free to start • Made with ❤️ for young minds</span>
          </div>
        </div>
      </div>
    </div>
  );
}

