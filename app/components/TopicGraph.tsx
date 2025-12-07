"use client";

import React, { useEffect, useState, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useTheme } from 'next-themes';

// Dynamically import ForceGraph2D with no SSR
const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-96 bg-gray-50 dark:bg-gray-900 rounded-xl"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>
});

interface TopicGraphProps {
  htmlContent: string;
  topicTitle: string;
  onNodeClick: (node: any) => void;
  height?: number;
}

interface GraphNode {
  id: string;
  name: string;
  val: number; // size
  group: string; // 'root' | 'chapter' | 'subtopic'
  color?: string;
}

interface GraphLink {
  source: string;
  target: string;
}

interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

export default function TopicGraph({ htmlContent, topicTitle, onNodeClick, height = 600 }: TopicGraphProps) {
  const [data, setData] = useState<GraphData>({ nodes: [], links: [] });
  const graphRef = useRef<any>();
  const { theme } = useTheme();
  const [containerDimensions, setContainerDimensions] = useState({ width: 800, height: 600 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse HTML content into graph data
  useEffect(() => {
    if (!htmlContent) return;

    // Create a temporary div to parse HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;

    const nodes: GraphNode[] = [];
    const links: GraphLink[] = [];

    // Add Root Node (Topic)
    const rootId = 'root';
    nodes.push({
      id: rootId,
      name: topicTitle,
      val: 20,
      group: 'root',
      color: '#4f46e5' // Indigo 600
    });

    // Find all chapters (section cards)
    const sections = tempDiv.querySelectorAll('.section-card');
    
    sections.forEach((section, index) => {
      const titleEl = section.querySelector('.section-title');
      if (!titleEl) return;
      
      const chapterTitle = titleEl.textContent?.trim() || `Chapter ${index + 1}`;
      // Clean up title (remove chevron if present in text)
      const cleanChapterTitle = chapterTitle.replace(/^\s*>\s*/, '').trim();
      
      const chapterId = `chapter-${index}`;
      
      nodes.push({
        id: chapterId,
        name: cleanChapterTitle,
        val: 10,
        group: 'chapter',
        color: '#0ea5e9' // Sky 500
      });

      links.push({
        source: rootId,
        target: chapterId
      });

      // Find subtopics within this chapter
      const subtopics = section.querySelectorAll('.subtopic-item');
      subtopics.forEach((subtopic, subIndex) => {
        const subtopicTitle = subtopic.textContent?.trim() || `Subtopic ${index + 1}.${subIndex + 1}`;
        const subtopicId = `subtopic-${index}-${subIndex}`;

        nodes.push({
          id: subtopicId,
          name: subtopicTitle,
          val: 5,
          group: 'subtopic',
          color: '#8b5cf6' // Violet 500
        });

        links.push({
          source: chapterId,
          target: subtopicId
        });
      });
    });

    setData({ nodes, links });
  }, [htmlContent, topicTitle]);

  // Handle container resizing
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setContainerDimensions({
          width: containerRef.current.offsetWidth,
          height: height
        });
      }
    };

    window.addEventListener('resize', updateDimensions);
    updateDimensions();

    return () => window.removeEventListener('resize', updateDimensions);
  }, [height]);

  const handleNodeClick = useCallback((node: any) => {
    // Center view on clicked node
    if (graphRef.current) {
      graphRef.current.centerAt(node.x, node.y, 1000);
      graphRef.current.zoom(2, 2000);
    }

    if (node.group === 'subtopic') {
      onNodeClick(node.name);
    }
  }, [onNodeClick]);

  // Determine text color based on theme
  const textColor = theme === 'dark' ? '#e2e8f0' : '#1e293b';
  const bgColor = theme === 'dark' ? '#0f172a' : '#ffffff';

  return (
    <div ref={containerRef} className="w-full rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-inner">
      <ForceGraph2D
        ref={graphRef}
        width={containerDimensions.width}
        height={containerDimensions.height}
        graphData={data}
        nodeLabel="name"
        backgroundColor={bgColor}
        nodeRelSize={6}
        linkDirectionalParticles={2}
        linkDirectionalParticleSpeed={0.005}
        linkColor={() => theme === 'dark' ? '#334155' : '#cbd5e1'}
        onNodeClick={handleNodeClick}
        nodeCanvasObject={(node: any, ctx, globalScale) => {
          const label = node.name;
          const fontSize = 12/globalScale;
          ctx.font = `${fontSize}px Sans-Serif`;
          const textWidth = ctx.measureText(label).width;
          const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.2); // some padding

          // Draw node circle
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.val, 0, 2 * Math.PI, false);
          ctx.fillStyle = node.color || '#ccc';
          ctx.fill();

          // Draw label
          if (globalScale > 1.5 || node.group === 'root') { // Only show labels when zoomed in or for root
            ctx.fillStyle = theme === 'dark' ? 'rgba(0, 0, 0, 0.6)' : 'rgba(255, 255, 255, 0.8)';
            ctx.fillRect(node.x - bckgDimensions[0] / 2, node.y - bckgDimensions[1] / 2 - node.val - fontSize, bckgDimensions[0], bckgDimensions[1]);

            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = node.color || textColor;
            ctx.fillText(label, node.x, node.y - node.val - fontSize);
          }
          
          // Draw highlighting ring if node is root
          if (node.group === 'root') {
             ctx.beginPath();
             ctx.arc(node.x, node.y, node.val + 2, 0, 2 * Math.PI, false);
             ctx.strokeStyle = node.color;
             ctx.lineWidth = 1;
             ctx.stroke();
          }
        }}
      />
    </div>
  );
}

