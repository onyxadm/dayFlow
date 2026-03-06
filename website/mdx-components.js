/* eslint-disable @next/next/no-img-element */
import { useMDXComponents as getDocsMDXComponents } from 'nextra-theme-docs';

import { FrameworkInstall } from './components/FrameworkInstall';
import { FrameworkTabs } from './components/FrameworkTabs';
import { withBasePath } from './utils/basePath';

const docsComponents = getDocsMDXComponents();

// DocImg is used instead of <img> in MDX files because explicit JSX <img> elements
// bypass the useMDXComponents override (only markdown ![]() goes through it).
// Using an uppercase component name ensures MDX routes it through the components system.
// Plain <img> is used instead of next/image because images.unoptimized is true and
// next/image requires explicit width/height for static exports.
function DocImg({ src, alt, ...props }) {
  return (
    <img
      {...props}
      src={withBasePath(src)}
      alt={alt || ''}
      style={{ maxWidth: '100%', height: 'auto', ...props.style }}
    />
  );
}

export function useMDXComponents(components) {
  return {
    ...docsComponents,
    img: ({ src, alt, ...props }) => (
      <img
        {...props}
        src={withBasePath(src)}
        alt={alt || ''}
        style={{ maxWidth: '100%', height: 'auto', ...props.style }}
      />
    ),
    DocImg,
    FrameworkInstall,
    FrameworkTabs,
    ...components,
  };
}
