import { PostListSkeleton } from '@/components/ui/post-list-skeleton';

export default function PostsLoading() {
  return <PostListSkeleton cardCount={3} showFilterSkeleton />;
}
