'use client';

import { Youtube, Github, BookOpen, Instagram } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import ProfileImage from '@/components/ProfileImage';

const socialLinks = [
  {
    icon: Youtube,
    href: '',
  },
  {
    icon: Github,
    href: '',
  },
  {
    icon: BookOpen,
    href: '',
  },
  {
    icon: Instagram,
    href: '',
  },
];

export default function ProfileSection() {
  return (
    <>
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex justify-center">
              <div className="bg-muted rounded-full p-2">
                <div className="h-36 w-36 overflow-hidden rounded-full">
                  <ProfileImage />
                </div>
              </div>
            </div>

            <div className="text-center">
              <h3 className="text-lg font-bold">JiniLog</h3>
              <p className="text-primary text-sm">Jini & Hoya</p>
            </div>

            <div className="flex justify-center gap-2">
              {socialLinks.map((item, index) => (
                <Button key={index} variant="ghost" className="bg-priamry/10" size="icon" asChild>
                  <a
                    href={item.href}
                    onClick={(e) => {
                      e.preventDefault();
                    }}
                  >
                    <item.icon className="h-4 w-4" />
                  </a>
                </Button>
              ))}
            </div>
            <p className="bg-primary/10 rounded p-2 text-center text-sm">The Cutest Cat</p>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
