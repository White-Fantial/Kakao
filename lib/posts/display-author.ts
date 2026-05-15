export type ResolvedDisplayAuthor = {
  displayName: string;
  profileImageUrl: string | null;
  isOperator: boolean;
};

export type OperatorProfileLookup = {
  displayName: string;
  avatarUrl: string | null;
};

type PostWithAuthorFields = {
  displayAuthorType: 'USER' | 'OPERATOR_PROFILE';
  displayAuthorId: string | null;
  author: {
    id: string;
    displayName: string;
    profileImageUrl: string | null;
  };
  displayAuthorProfile?: {
    displayName: string;
    avatarUrl: string | null;
  } | null;
};

export function resolveDisplayAuthor(post: PostWithAuthorFields): ResolvedDisplayAuthor {
  if (
    post.displayAuthorType === 'OPERATOR_PROFILE' &&
    post.displayAuthorProfile
  ) {
    return {
      displayName: post.displayAuthorProfile.displayName,
      profileImageUrl: post.displayAuthorProfile.avatarUrl ?? null,
      isOperator: true,
    };
  }

  return {
    displayName: post.author.displayName,
    profileImageUrl: post.author.profileImageUrl,
    isOperator: false,
  };
}
