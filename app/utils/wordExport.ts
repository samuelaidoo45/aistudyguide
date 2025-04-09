import { saveAs } from 'file-saver';
import sanitizeHtml from 'sanitize-html';

export async function exportToWord(content: string, filename: string) {
  try {
    // Sanitize the HTML content
    const sanitizedContent = sanitizeHtml(content);
    
    // Create a styled HTML document with the content
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>${filename}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 800px;
              margin: 0 auto;
              padding: 20px;
            }
            h1, h2, h3, h4, h5, h6 {
              color: #2d3748;
              margin-top: 1.5em;
              margin-bottom: 0.5em;
            }
            ul, ol {
              margin: 1em 0;
              padding-left: 2em;
            }
            li {
              margin-bottom: 0.5em;
            }
            p {
              margin: 1em 0;
            }
          </style>
        </head>
        <body>
          <h1>${filename}</h1>
          ${sanitizedContent}
        </body>
      </html>
    `;
    
    // Create a Blob with the content
    const blob = new Blob([htmlContent], { type: 'application/msword' });
    
    // Save the file
    saveAs(blob, `${filename}.doc`);
  } catch (error) {
    console.error('Error exporting to Word:', error);
    throw error;
  }
} 