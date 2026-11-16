import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Join the hive — CreatHive',
  description: 'Request your CreatHive space: one link for your spoken word, poetry, dance, design and more.',
};

export default function JoinLayout({ children }: { children: React.ReactNode }) {
  return children;
}
