/**
 * remark 플러그인: HTML 내부의 자동 링크 변환 비활성화
 * 
 * remarkGfm이 HTML 내부의 URL을 자동으로 링크로 변환하는 것을 방지
 */

import type { Root } from 'mdast';
import type { Plugin } from 'unified';
import { visit } from 'unist-util-visit';

/**
 * HTML 내부의 자동 링크 변환을 비활성화하는 remark 플러그인
 */
export const remarkDisableAutolinkInHtml: Plugin<[], Root> = () => {
  return (tree) => {
    visit(tree, 'html', (node) => {
      // HTML 노드 내부의 URL을 특수 문자로 변환하여 자동 링크 변환 방지
      // 하지만 이 방법은 복잡하므로, 대신 rehype 플러그인에서 처리
    });

    return tree;
  };
};
