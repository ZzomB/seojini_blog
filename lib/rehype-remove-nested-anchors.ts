/**
 * rehype 플러그인: 중첩된 <a> 태그 제거
 * 
 * HTML에서 <a> 태그 안에 또 다른 <a> 태그가 있는 경우,
 * 내부 <a> 태그를 제거하고 텍스트만 유지하여 hydration 에러 방지
 */

import type { Root, Element } from 'hast';
import type { Plugin } from 'unified';
import { visit } from 'unist-util-visit';

/**
 * 중첩된 <a> 태그를 재귀적으로 제거하는 함수
 */
function flattenNestedAnchors(node: Element): boolean {
  if (!node.children) return false;

  let changed = false;
  const newChildren: Element['children'] = [];

  for (const child of node.children) {
    if (child.type === 'element' && child.tagName === 'a') {
      // 중첩된 <a> 태그 발견: 자식들을 직접 추가
      if (child.children) {
        // 먼저 자식들을 재귀적으로 처리
        flattenNestedAnchors(child);
        // 자식들을 직접 추가
        newChildren.push(...child.children);
      }
      changed = true;
      
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.log('🔧 중첩된 <a> 태그 제거됨:', child.properties?.href);
      }
    } else {
      newChildren.push(child);
      // 재귀적으로 처리
      if (child.type === 'element') {
        const childChanged = flattenNestedAnchors(child);
        if (childChanged) {
          changed = true;
        }
      }
    }
  }

  if (changed) {
    node.children = newChildren;
  }

  return changed;
}

/**
 * 중첩된 <a> 태그를 제거하는 rehype 플러그인
 */
export const rehypeRemoveNestedAnchors: Plugin<[], Root> = () => {
  return (tree) => {
    // 여러 번 반복하여 모든 중첩을 제거
    let hasChanges = true;
    let iterations = 0;
    const maxIterations = 10;

    while (hasChanges && iterations < maxIterations) {
      hasChanges = false;
      
      visit(tree, 'element', (node: Element) => {
        if (node.tagName === 'a' && node.children) {
          // 자식 중에 또 다른 <a> 태그가 있는지 확인
          const hasNested = node.children.some(
            (child) => child.type === 'element' && child.tagName === 'a'
          );

          if (hasNested) {
            const changed = flattenNestedAnchors(node);
            if (changed) {
              hasChanges = true;
            }
          }
        }
      });

      iterations++;
    }

    return tree;
  };
};
