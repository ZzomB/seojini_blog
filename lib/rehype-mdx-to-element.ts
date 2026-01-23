/**
 * rehype 플러그인: MDX 특수 노드를 일반 element로 변환
 * 
 * 보안: rehype-sanitize가 mdxJsxTextElement를 인식하지 못해 삭제하므로,
 * rehype-sanitize 전에 MDX 특수 노드를 일반 element로 변환
 */

import type { Root, Element } from 'hast';
import type { Plugin } from 'unified';
import { visit } from 'unist-util-visit';

/**
 * MDX 특수 노드를 일반 element로 변환하는 rehype 플러그인
 * rehype-sanitize가 이를 처리할 수 있도록 함
 * 
 * 보안: rehype-sanitize 전에 실행되어야 함
 */
export const rehypeMdxToElement: Plugin<[], Root> = () => {
  return (tree) => {
    // 역순으로 방문하여 자식부터 부모로 변환 (안전한 변환 보장)
    visit(tree, (node, index, parent) => {
      // MDX JSX 요소 노드인지 확인
      if (
        node.type === 'mdxJsxTextElement' ||
        node.type === 'mdxJsxFlowElement'
      ) {
        const mdxNode = node as {
          type: string;
          name?: string;
          attributes?: Array<{
            type?: string;
            name?: string;
            value?: unknown;
          }>;
          children?: unknown[];
        };

        // 새로운 element 노드 생성
        const elementNode: Element = {
          type: 'element',
          tagName: (mdxNode.name && typeof mdxNode.name === 'string') ? mdxNode.name : 'div',
          properties: {},
          children: [],
        };

        // attributes를 properties로 변환 (직렬화 가능한 값만 포함)
        if (mdxNode.attributes && Array.isArray(mdxNode.attributes)) {
          const properties: Record<string, string | number | boolean> = {};
          for (const attr of mdxNode.attributes) {
            if (
              attr &&
              typeof attr === 'object' &&
              attr.type === 'mdxJsxAttribute' &&
              attr.name &&
              typeof attr.name === 'string'
            ) {
              // 속성 값 처리 - 직렬화 가능한 값만 허용
              if (attr.value !== null && attr.value !== undefined) {
                // 표현식인 경우 안전하지 않을 수 있으므로 제거
                if (
                  typeof attr.value === 'object' &&
                  'type' in attr.value &&
                  attr.value.type === 'mdxJsxAttributeValueExpression'
                ) {
                  properties[attr.name] = true;
                } else if (typeof attr.value === 'string') {
                  properties[attr.name] = attr.value;
                } else if (typeof attr.value === 'number') {
                  properties[attr.name] = attr.value;
                } else if (typeof attr.value === 'boolean') {
                  properties[attr.name] = attr.value;
                }
                // 복잡한 객체나 함수는 제외 (직렬화 불가능)
              } else {
                // 속성만 있고 값이 없는 경우 (예: disabled)
                properties[attr.name] = true;
              }
            }
          }
          elementNode.properties = properties;
        }

        // children은 그대로 유지 (이미 올바른 형식)
        if (mdxNode.children && Array.isArray(mdxNode.children)) {
          elementNode.children = mdxNode.children as Element['children'];
        }

        // 부모 노드의 children 배열에서 기존 노드를 새 노드로 교체
        if (parent && Array.isArray(parent.children) && typeof index === 'number') {
          parent.children[index] = elementNode;
        }
      }
    });

    return tree;
  };
};
