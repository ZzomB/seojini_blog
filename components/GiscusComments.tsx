'use client';
import Giscus from '@giscus/react';

{
  /* <script src="https://giscus.app/client.js"
        data-repo="ZzomB/notion-blog-nextjs-giscus"
        data-repo-id="R_kgDOPlCFdw"
        data-category="Announcements"
        data-category-id="DIC_kwDOPlCFd84Cup3o"
        data-mapping="pathname"
        data-strict="0"
        data-reactions-enabled="1"
        data-emit-metadata="0"
        data-input-position="top"
        data-theme="preferred_color_scheme"
        data-lang="ko"
        crossorigin="anonymous"
        async>
</script> */
}

export default function GiscusComments() {
  return (
    <Giscus
      repo="ZzomB/notion-blog-nextjs-giscus"
      repoId="R_kgDOPlCFdw"
      category="Announcements"
      categoryId="DIC_kwDOPlCFd84Cup3o"
      mapping="pathname"
      strict="0"
      reactions-enabled="1"
      emit-metadata="0"
      input-position="top"
      theme="preferred_color_scheme"
      lang="ko"
    />
  );
}
