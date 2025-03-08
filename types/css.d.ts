declare module '*.css' {
  const content: { [className: string]: string };
  export default content;
}

// This file is needed to help TypeScript understand CSS imports
// and to prevent TypeScript errors related to CSS modules 