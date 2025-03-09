"use client";

import DashboardLayout from '@/app/components/DashboardLayout';
import { Mail, ExternalLink } from 'lucide-react';

export default function ContactPage() {
  return (
    <DashboardLayout>
      <div className="py-6 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Contact Us
          </h1>
          <p className="mt-2 text-gray-600">
            Have a question or feedback? We'd love to hear from you.
          </p>
        </div>
        
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
          <div className="flex items-center mb-6">
            <Mail className="w-6 h-6 mr-2 text-indigo-600" />
            <h2 className="text-xl font-semibold text-gray-900">
              Contact Information
            </h2>
          </div>
          
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Email</h3>
              <div className="flex flex-wrap items-center gap-3">
                <p className="text-lg font-semibold text-indigo-600">
                  samuelaidoo45@gmail.com
                </p>
                <a 
                  href="mailto:samuelaidoo45@gmail.com" 
                  className="inline-flex items-center text-sm text-indigo-600 hover:text-indigo-800"
                >
                  <ExternalLink className="w-4 h-4 mr-1" />
                  Open in email client
                </a>
              </div>
              <p className="mt-2 text-gray-600">
                Please include your name and a detailed description of your question or feedback.
              </p>
            </div>
            
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <p className="text-gray-700 font-medium">
                We typically respond to emails within 1-2 business days. Thank you for your patience.
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
} 