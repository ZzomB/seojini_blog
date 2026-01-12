/**
 * rehype 플러그인: MDX 특수 노드를 일반 element로 변환
 * 
 * 보안: rehype-sanitize가 mdxJsxTextElement를 인식하지 못해 삭제하므로,
 * rehype-sanitize 전에 MDX 특수 노드를 일반 element로 변환
 */

import type { Root } from 'hast';
import type { Plugin } from 'unified';

/**
 * MDX 특수 노드 타입 정의
 */
interface MdxJsxNode {
  type: 'mdxJsxTextElement' | 'mdxJsxFlowElement';
  name?: string;
  attributes?: Array<{
    type?: string;
    name?: string;
    value?: unknown;
  }>;
  children?: unknown[];
  [key: string]: unknown;
}

/**
 * 재귀적으로 트리를 순회하여 MDX 특수 노드를 변환
 */
function transformNode(node: unknown): void {
  if (!node || typeof node !== 'object') return;
  
  const mdxNode = node as MdxJsxNode;
  
  // MDX 특수 노드 타입을 일반 element로 변환
  if (mdxNode.type === 'mdxJsxTextElement' || mdxNode.type === 'mdxJsxFlowElement') {
    // MDX JSX 요소를 일반 element로 변환
    mdxNode.type = 'element' as 'mdxJsxTextElement';
    // name 속성이 있으면 tagName으로 변환
    if (mdxNode.name && typeof mdxNode.name === 'string') {
      (mdxNode as { tagName?: string }).tagName = mdxNode.name;
      delete mdxNode.name;
    }
    // attributes가 있으면 properties로 변환
    if (mdxNode.attributes && Array.isArray(mdxNode.attributes)) {
      const properties: Record<string, unknown> = {};
      for (const attr of mdxNode.attributes) {
        if (attr && typeof attr === 'object' && attr.type === 'mdxJsxAttribute' && attr.name) {
          // 속성 값 처리
          if (attr.value !== null && attr.value !== undefined) {
            // 문자열 리터럴인 경우
            if (
              typeof attr.value === 'object' &&
              'type' in attr.value &&
              attr.value.type === 'mdxJsxAttributeValueExpression'
            ) {
              // 표현식은 안전하지 않을 수 있으므로 제거하거나 기본값 사용
              properties[attr.name] = true;
            } else if (typeof attr.value === 'string') {
              properties[attr.name] = attr.value;
            } else {
              properties[attr.name] = attr.value;
            }
          } else {
            // 속성만 있고 값이 없는 경우 (예: disabled)
            properties[attr.name] = true;
          }
        }
      }
      (mdxNode as { properties?: Record<string, unknown> }).properties = properties;
      delete mdxNode.attributes;
    }
  }
  
  // 자식 노드들도 재귀적으로 처리
  if (Array.isArray(mdxNode.children)) {
    for (const child of mdxNode.children) {
      transformNode(child);
    }
  }
}

/**
 * MDX 특수 노드를 일반 element로 변환하는 rehype 플러그인
 * rehype-sanitize가 이를 처리할 수 있도록 함
 * 
 * 보안: rehype-sanitize 전에 실행되어야 함
 */
export const rehypeMdxToElement: Plugin<[], Root> = () => {
  return (tree) => {
    transformNode(tree);
    return tree;
  };
};
