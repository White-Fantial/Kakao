import test from 'node:test';
import assert from 'node:assert/strict';

import {
  getNeighbourWarmthWeight,
  COMMUNITY_SCORE_BASE_DELTAS,
  COMMUNITY_SCORE_POST_AUTO_HOLD_THRESHOLD,
  COMMUNITY_SCORE_COMMENT_AUTO_HOLD_THRESHOLD,
} from '../lib/community-score/scoring.ts';

// ─── Weight formula ───────────────────────────────────────────────────────────

test('default warmth (36.5) gives weight ~1.0', () => {
  const weight = getNeighbourWarmthWeight(36.5);
  assert.ok(Math.abs(weight - 1.0) < 0.001);
});

test('warmth above baseline gives weight > 1.0', () => {
  const weight = getNeighbourWarmthWeight(60);
  assert.ok(weight > 1.0);
});

test('warmth below baseline gives weight < 1.0', () => {
  const weight = getNeighbourWarmthWeight(10);
  assert.ok(weight < 1.0);
});

test('weight is clamped at minimum 0.5', () => {
  const weight = getNeighbourWarmthWeight(0);
  assert.ok(weight >= 0.5);
  assert.equal(weight, 0.5);
});

test('weight is clamped at maximum 2.0', () => {
  const weight = getNeighbourWarmthWeight(100);
  assert.ok(weight <= 2.0);
  assert.equal(weight, 2.0);
});

// ─── Score thresholds ─────────────────────────────────────────────────────────

test('post auto-hold threshold is -8', () => {
  assert.equal(COMMUNITY_SCORE_POST_AUTO_HOLD_THRESHOLD, -8);
});

test('comment auto-hold threshold is -5', () => {
  assert.equal(COMMUNITY_SCORE_COMMENT_AUTO_HOLD_THRESHOLD, -5);
});

// ─── In-memory simulation ─────────────────────────────────────────────────────

type UserState = {
  id: string;
  neighbourWarmth: number;
};

type PostState = {
  id: string;
  authorId: string;
  status: 'PUBLISHED' | 'HELD' | 'DELETED';
  communityScore: number;
  bestCommentId: string | null;
};

type CommentState = {
  id: string;
  postId: string;
  authorId: string;
  status: 'PUBLISHED' | 'HELD' | 'DELETED';
  communityScore: number;
  body: string;
};

class InMemoryCommunityScore {
  private readonly users = new Map<string, UserState>();
  private readonly posts = new Map<string, PostState>();
  private readonly comments = new Map<string, CommentState>();
  private readonly postLikes = new Set<string>();
  private readonly commentLikes = new Set<string>();
  private readonly postReports = new Set<string>();
  private readonly commentReports = new Set<string>();

  addUser(id: string, warmth = 36.5) {
    this.users.set(id, { id, neighbourWarmth: warmth });
  }

  addPost(id: string, authorId: string) {
    this.posts.set(id, { id, authorId, status: 'PUBLISHED', communityScore: 0, bestCommentId: null });
  }

  addComment(id: string, postId: string, authorId: string) {
    this.comments.set(id, { id, postId, authorId, status: 'PUBLISHED', communityScore: 0, body: 'test body' });
  }

  getPost(id: string): PostState {
    const post = this.posts.get(id);
    if (!post) throw new Error('post not found');
    return post;
  }

  getComment(id: string): CommentState {
    const comment = this.comments.get(id);
    if (!comment) throw new Error('comment not found');
    return comment;
  }

  private applyScoreChange(
    targetType: 'POST' | 'COMMENT',
    targetId: string,
    actorId: string,
    baseDelta: number,
  ): boolean {
    const actor = this.users.get(actorId);
    if (!actor) throw new Error('actor not found');

    const weight = getNeighbourWarmthWeight(actor.neighbourWarmth);
    const finalDelta = baseDelta * weight;

    if (targetType === 'POST') {
      const post = this.posts.get(targetId);
      if (!post) throw new Error('post not found');
      post.communityScore += finalDelta;
      if (post.status === 'PUBLISHED' && post.communityScore < COMMUNITY_SCORE_POST_AUTO_HOLD_THRESHOLD) {
        post.status = 'HELD';
        return true;
      }
    } else {
      const comment = this.comments.get(targetId);
      if (!comment) throw new Error('comment not found');
      comment.communityScore += finalDelta;
      if (comment.status === 'PUBLISHED' && comment.communityScore < COMMUNITY_SCORE_COMMENT_AUTO_HOLD_THRESHOLD) {
        comment.status = 'HELD';
        return true;
      }
    }
    return false;
  }

  likePost(actorId: string, postId: string): boolean {
    const post = this.posts.get(postId);
    if (!post) throw new Error('post not found');
    const key = `${postId}:${actorId}`;
    if (this.postLikes.has(key)) return false;
    this.postLikes.add(key);
    if (post.authorId !== actorId) {
      this.applyScoreChange('POST', postId, actorId, COMMUNITY_SCORE_BASE_DELTAS.POST_LIKE_RECEIVED);
    }
    return true;
  }

  likeComment(actorId: string, commentId: string): boolean {
    const comment = this.comments.get(commentId);
    if (!comment) throw new Error('comment not found');
    const key = `${commentId}:${actorId}`;
    if (this.commentLikes.has(key)) return false;
    this.commentLikes.add(key);
    if (comment.authorId !== actorId) {
      this.applyScoreChange('COMMENT', commentId, actorId, COMMUNITY_SCORE_BASE_DELTAS.COMMENT_LIKE_RECEIVED);
    }
    return true;
  }

  reportPost(actorId: string, postId: string): boolean {
    const key = `${postId}:${actorId}`;
    if (this.postReports.has(key)) return false;
    this.postReports.add(key);
    this.applyScoreChange('POST', postId, actorId, COMMUNITY_SCORE_BASE_DELTAS.POST_REPORT_SUBMITTED);
    return true;
  }

  reportComment(actorId: string, commentId: string): boolean {
    const key = `${commentId}:${actorId}`;
    if (this.commentReports.has(key)) return false;
    this.commentReports.add(key);
    this.applyScoreChange('COMMENT', commentId, actorId, COMMUNITY_SCORE_BASE_DELTAS.COMMENT_REPORT_SUBMITTED);
    return true;
  }

  selectBestComment(actorId: string, postId: string, commentId: string) {
    const post = this.posts.get(postId);
    const comment = this.comments.get(commentId);
    if (!post || !comment) throw new Error('missing post or comment');
    if (post.authorId !== actorId) throw new Error('forbidden');
    const isNew = post.bestCommentId !== commentId && comment.authorId !== actorId;
    post.bestCommentId = commentId;
    if (isNew) {
      this.applyScoreChange('COMMENT', commentId, actorId, COMMUNITY_SCORE_BASE_DELTAS.BEST_COMMENT_SELECTED);
    }
  }

  restorePost(actorId: string, postId: string) {
    const post = this.posts.get(postId);
    if (!post) throw new Error('post not found');
    post.status = 'PUBLISHED';
    this.applyScoreChange('POST', postId, actorId, COMMUNITY_SCORE_BASE_DELTAS.COORDINATOR_RESTORES);
  }

  restoreComment(actorId: string, commentId: string) {
    const comment = this.comments.get(commentId);
    if (!comment) throw new Error('comment not found');
    comment.status = 'PUBLISHED';
    this.applyScoreChange('COMMENT', commentId, actorId, COMMUNITY_SCORE_BASE_DELTAS.COORDINATOR_RESTORES);
  }
}

function createFixture() {
  const store = new InMemoryCommunityScore();
  store.addUser('post-author', 36.5);
  store.addUser('comment-author', 36.5);
  store.addUser('user-a', 36.5);
  store.addUser('user-b', 36.5);
  store.addUser('user-c', 36.5);
  store.addUser('coordinator', 80);
  store.addUser('low-trust', 0);
  store.addPost('post-1', 'post-author');
  store.addComment('comment-1', 'post-1', 'comment-author');
  return store;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

test('post like increases post communityScore', () => {
  const store = createFixture();
  const before = store.getPost('post-1').communityScore;
  store.likePost('user-a', 'post-1');
  const after = store.getPost('post-1').communityScore;
  assert.ok(after > before);
});

test('comment like increases comment communityScore', () => {
  const store = createFixture();
  const before = store.getComment('comment-1').communityScore;
  store.likeComment('user-a', 'comment-1');
  const after = store.getComment('comment-1').communityScore;
  assert.ok(after > before);
});

test('report decreases post communityScore', () => {
  const store = createFixture();
  const before = store.getPost('post-1').communityScore;
  store.reportPost('user-a', 'post-1');
  const after = store.getPost('post-1').communityScore;
  assert.ok(after < before);
});

test('report decreases comment communityScore', () => {
  const store = createFixture();
  const before = store.getComment('comment-1').communityScore;
  store.reportComment('user-a', 'comment-1');
  const after = store.getComment('comment-1').communityScore;
  assert.ok(after < before);
});

test('high warmth actor has stronger score impact', () => {
  const storeDefault = createFixture();
  const storeHigh = createFixture();

  storeDefault.reportPost('user-a', 'post-1'); // 36.5 warmth
  storeHigh.reportPost('coordinator', 'post-1'); // 80 warmth

  const defaultScore = storeDefault.getPost('post-1').communityScore;
  const highScore = storeHigh.getPost('post-1').communityScore;

  // high warmth reporter causes more negative score
  assert.ok(highScore < defaultScore);
});

test('low warmth actor has weaker score impact', () => {
  const storeDefault = createFixture();
  const storeLow = createFixture();

  storeDefault.reportPost('user-a', 'post-1'); // 36.5 warmth
  storeLow.reportPost('low-trust', 'post-1'); // 0 warmth

  const defaultScore = storeDefault.getPost('post-1').communityScore;
  const lowScore = storeLow.getPost('post-1').communityScore;

  // low warmth reporter causes less negative score (closer to 0)
  assert.ok(lowScore > defaultScore);
});

test('duplicate post reports do not double-apply score', () => {
  const store = createFixture();
  store.reportPost('user-a', 'post-1');
  const afterFirst = store.getPost('post-1').communityScore;
  const didApply = store.reportPost('user-a', 'post-1');
  const afterSecond = store.getPost('post-1').communityScore;
  assert.equal(didApply, false);
  assert.equal(afterFirst, afterSecond);
});

test('duplicate comment reports do not double-apply score', () => {
  const store = createFixture();
  store.reportComment('user-a', 'comment-1');
  const afterFirst = store.getComment('comment-1').communityScore;
  const didApply = store.reportComment('user-a', 'comment-1');
  const afterSecond = store.getComment('comment-1').communityScore;
  assert.equal(didApply, false);
  assert.equal(afterFirst, afterSecond);
});

test('duplicate post likes do not double-apply score', () => {
  const store = createFixture();
  store.likePost('user-a', 'post-1');
  const afterFirst = store.getPost('post-1').communityScore;
  const didApply = store.likePost('user-a', 'post-1');
  const afterSecond = store.getPost('post-1').communityScore;
  assert.equal(didApply, false);
  assert.equal(afterFirst, afterSecond);
});

test('duplicate comment likes do not double-apply score', () => {
  const store = createFixture();
  store.likeComment('user-a', 'comment-1');
  const afterFirst = store.getComment('comment-1').communityScore;
  const didApply = store.likeComment('user-a', 'comment-1');
  const afterSecond = store.getComment('comment-1').communityScore;
  assert.equal(didApply, false);
  assert.equal(afterFirst, afterSecond);
});

test('low communityScore moves post to HELD (auto hold)', () => {
  const store = createFixture();

  // With default warmth (1.0 weight), each report gives -2.0. Need 4+ reports to exceed -8
  store.reportPost('user-a', 'post-1');
  store.reportPost('user-b', 'post-1');
  store.reportPost('user-c', 'post-1');
  assert.equal(store.getPost('post-1').status, 'PUBLISHED');

  // 4th reporter with coordinator-level (2.0 weight) to push past -8
  store.addUser('user-d', 80);
  store.reportPost('user-d', 'post-1');
  // At this point score should be well below -8
  assert.equal(store.getPost('post-1').status, 'HELD');
});

test('low communityScore moves comment to HELD (auto hold)', () => {
  const store = createFixture();

  // With default warmth (1.0), each report gives -2.5. Need 3 to push past -5
  store.reportComment('user-a', 'comment-1');
  store.reportComment('user-b', 'comment-1');
  assert.equal(store.getComment('comment-1').status, 'PUBLISHED');

  store.reportComment('user-c', 'comment-1');
  assert.equal(store.getComment('comment-1').status, 'HELD');
});

test('HELD post is not included in normal post list (simulated filter)', () => {
  const store = createFixture();
  store.reportComment('user-a', 'comment-1');
  store.reportComment('user-b', 'comment-1');

  // Simulate: public feeds only show PUBLISHED posts
  const allPosts = [store.getPost('post-1')];
  const publicPosts = allPosts.filter((p) => p.status === 'PUBLISHED');
  assert.equal(publicPosts.length, 1);

  // Now hold the post
  store.reportPost('user-a', 'post-1');
  store.reportPost('user-b', 'post-1');
  store.reportPost('user-c', 'post-1');
  store.addUser('user-d', 80);
  store.reportPost('user-d', 'post-1');

  const allPostsAfter = [store.getPost('post-1')];
  const publicPostsAfter = allPostsAfter.filter((p) => p.status === 'PUBLISHED');
  assert.equal(publicPostsAfter.length, 0);
});

test('HELD comment shows as hidden to normal users (simulated)', () => {
  const store = createFixture();
  store.reportComment('user-a', 'comment-1');
  store.reportComment('user-b', 'comment-1');
  store.reportComment('user-c', 'comment-1');

  const comment = store.getComment('comment-1');
  assert.equal(comment.status, 'HELD');

  // Simulate: normal users see placeholder for HELD comments
  const displayBody = (c: CommentState, isCoordinator: boolean) =>
    c.status === 'HELD' && !isCoordinator ? '운영 검토 중인 댓글입니다.' : c.body;

  assert.equal(displayBody(comment, false), '운영 검토 중인 댓글입니다.');
});

test('coordinator can view full HELD comment content', () => {
  const store = createFixture();
  store.reportComment('user-a', 'comment-1');
  store.reportComment('user-b', 'comment-1');
  store.reportComment('user-c', 'comment-1');

  const comment = store.getComment('comment-1');
  assert.equal(comment.status, 'HELD');

  const displayBody = (c: CommentState, isCoordinator: boolean) =>
    c.status === 'HELD' && !isCoordinator ? '운영 검토 중인 댓글입니다.' : c.body;

  // Coordinator sees real body
  assert.equal(displayBody(comment, true), comment.body);
});

test('coordinator can restore HELD post', () => {
  const store = createFixture();
  // Force post to HELD
  store.reportPost('user-a', 'post-1');
  store.reportPost('user-b', 'post-1');
  store.reportPost('user-c', 'post-1');
  store.addUser('user-d', 80);
  store.reportPost('user-d', 'post-1');
  assert.equal(store.getPost('post-1').status, 'HELD');

  store.restorePost('coordinator', 'post-1');
  assert.equal(store.getPost('post-1').status, 'PUBLISHED');
});

test('coordinator can restore HELD comment', () => {
  const store = createFixture();
  store.reportComment('user-a', 'comment-1');
  store.reportComment('user-b', 'comment-1');
  store.reportComment('user-c', 'comment-1');
  assert.equal(store.getComment('comment-1').status, 'HELD');

  store.restoreComment('coordinator', 'comment-1');
  assert.equal(store.getComment('comment-1').status, 'PUBLISHED');
});

test('restore increases communityScore', () => {
  const store = createFixture();
  store.reportComment('user-a', 'comment-1');
  store.reportComment('user-b', 'comment-1');
  store.reportComment('user-c', 'comment-1');
  const scoreBefore = store.getComment('comment-1').communityScore;

  store.restoreComment('coordinator', 'comment-1');
  const scoreAfter = store.getComment('comment-1').communityScore;
  assert.ok(scoreAfter > scoreBefore);
});

test('self-like does not generate positive score change for post', () => {
  const store = createFixture();
  const before = store.getPost('post-1').communityScore;
  store.likePost('post-author', 'post-1'); // self-like
  const after = store.getPost('post-1').communityScore;
  assert.equal(before, after);
});

test('self-like does not generate positive score change for comment', () => {
  const store = createFixture();
  const before = store.getComment('comment-1').communityScore;
  store.likeComment('comment-author', 'comment-1'); // self-like
  const after = store.getComment('comment-1').communityScore;
  assert.equal(before, after);
});

test('best comment selection increases communityScore', () => {
  const store = createFixture();
  const before = store.getComment('comment-1').communityScore;
  store.selectBestComment('post-author', 'post-1', 'comment-1');
  const after = store.getComment('comment-1').communityScore;
  assert.ok(after > before);
});

test('best comment by self does not increase score', () => {
  const store = createFixture();
  store.addComment('self-comment', 'post-1', 'post-author');
  const before = store.getComment('self-comment').communityScore;
  store.selectBestComment('post-author', 'post-1', 'self-comment');
  const after = store.getComment('self-comment').communityScore;
  assert.equal(before, after);
});
