import { PostListSkeleton } from '@/components/ui/post-list-skeleton';

export default function RootLoading() {
  return <PostListSkeleton cardCount={3} showFilterSkeleton />;
}
