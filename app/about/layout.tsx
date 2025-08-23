import Link from 'next/link';
import type { ReactNode } from 'react';
import { User, Code2, Briefcase, GitBranch, FileText, Mail } from 'lucide-react';

export default function AboutLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const menuItems: Array<{
    href: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }> = [
    { href: '/about', label: '소개', icon: User },
    { href: '/about/profile', label: '프로필', icon: User },
    { href: '/about/skills', label: '기술 스택', icon: Code2 },
    { href: '/about/projects', label: '프로젝트', icon: Briefcase },
    { href: '/about/oss', label: '오픈소스', icon: GitBranch },
    { href: '/about/resume', label: '이력서', icon: FileText },
    { href: '/about/contact', label: '연락처', icon: Mail },
  ];

  return (
    <div className="container py-8">
      <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="bg-sidebar text-sidebar-foreground rounded-xl border">
            <div className="border-b px-4 py-3">
              <h2 className="text-sm font-semibold">개발자 메뉴</h2>
            </div>
            <nav aria-label="About navigation" className="px-2 py-2">
              <ul className="space-y-1">
                {menuItems.map(({ href, label, icon: Icon }) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors"
                    >
                      <Icon className="h-4 w-4" aria-hidden="true" />
                      <span>{label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </aside>

        <section className="min-w-0">{children}</section>
      </div>
    </div>
  );
}
