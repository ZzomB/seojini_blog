import type { MDXComponents } from 'mdx/types';

// 제미나이 답변: MDX 파서의 특성을 고려한 컴포넌트 정의
// MDX가 <u>를 mdxJsxTextElement로 변환하는데,
// mdx-components.tsx에서 명시적으로 처리하면 rehype-sanitize와 무관하게 렌더링됨
const components: MDXComponents = {
  // <u> 태그를 만나면 실제 HTML <u> 태그로 렌더링하도록 강제
  u: ({ children, ...props }) => (
    <u style={{ textDecoration: 'underline' }} {...props}>
      {children}
    </u>
  ),
};

export function useMDXComponents(providedComponents?: MDXComponents): MDXComponents {
  return {
    ...components,
    ...providedComponents,
  };
}
