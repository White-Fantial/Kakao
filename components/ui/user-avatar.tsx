import Image from 'next/image';

type UserAvatarProps = {
  displayName: string;
  profileImageUrl?: string | null;
  className?: string;
  sizes?: string;
};

function getInitial(displayName: string) {
  const trimmed = displayName.trim();
  const firstChar = Array.from(trimmed)[0];
  return firstChar ? firstChar.toUpperCase() : '?';
}

export function UserAvatar({ displayName, profileImageUrl, className, sizes }: UserAvatarProps) {
  const avatarClassName = className ?? 'h-8 w-8';
  const resolvedProfileImageUrl = profileImageUrl?.replace(/^http:\/\/k\.kakaocdn\.net/i, 'https://k.kakaocdn.net');

  if (resolvedProfileImageUrl) {
    return (
      <span className={`relative overflow-hidden rounded-full bg-zinc-200 ${avatarClassName}`}>
        <Image
          src={resolvedProfileImageUrl}
          alt={displayName}
          fill
          sizes={sizes ?? '32px'}
          className="object-cover"
        />
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center justify-center rounded-full bg-zinc-200 text-xs font-semibold text-zinc-700 ${avatarClassName}`}>
      {getInitial(displayName)}
    </span>
  );
}
