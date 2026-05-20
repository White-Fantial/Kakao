import { prisma } from '@/lib/db/prisma';
import { shouldShowOperatorBadge } from '@/lib/account-type';
import type { AdFeedItem, AdLayout, AdSize, AdPlacementType } from './types';

const BODY_PREVIEW_LENGTH = 220;

type RawCampaign = {
  id: string;
  postId: string;
  landingUrl: string | null;
  priority: number;
  adProduct: {
    placementType: string;
    size: string;
    layout: string;
  };
  post: {
    id: string;
    title: string | null;
    body: string;
    status: string;
    createdAt: Date;
    images: { url: string }[];
    category: { name: string; type: string; color: string | null };
    city: { name: string } | null;
    author: {
      displayName: string;
      profileImageUrl: string | null;
      accountType: 'REAL_USER' | 'PERSONA' | 'OPERATOR' | 'SYSTEM';
      neighbourWarmth: number;
    };
  };
};

function toAdFeedItem(campaign: RawCampaign): AdFeedItem {
  return {
    id: campaign.post.id,
    title: campaign.post.title,
    bodyPreview: campaign.post.body.slice(0, BODY_PREVIEW_LENGTH),
    href: campaign.landingUrl ?? `/posts/${campaign.post.id}`,
    createdAt: campaign.post.createdAt.toISOString(),
    thumbnailUrl: campaign.post.images[0]?.url ?? null,
    category: campaign.post.category,
    city: campaign.post.city,
    author: {
      displayName: campaign.post.author.displayName,
      profileImageUrl: campaign.post.author.profileImageUrl,
      isOperator: shouldShowOperatorBadge(campaign.post.author),
    },
    isAd: true,
    adCampaignId: campaign.id,
    adPostId: campaign.post.id,
    adLayout: campaign.adProduct.layout as AdLayout,
    adSize: campaign.adProduct.size as AdSize,
    adPlacementType: campaign.adProduct.placementType as AdPlacementType,
  };
}

export type ActiveAdSlots = {
  topFixed: AdFeedItem | null;
  inline: AdFeedItem[];
};

export async function fetchActiveAdSlots(options: {
  countryId: string | null;
  cityId: string | null;
}): Promise<ActiveAdSlots> {
  const now = new Date();
  let campaigns: RawCampaign[] = [];

  try {
    campaigns = (await prisma.adCampaign.findMany({
      where: {
        status: 'ACTIVE',
        OR: [{ startAt: null }, { startAt: { lte: now } }],
        AND: [
          { OR: [{ endAt: null }, { endAt: { gt: now } }] },
          {
            OR: [
              { targetCountryId: null },
              ...(options.countryId ? [{ targetCountryId: options.countryId }] : []),
            ],
          },
          {
            OR: [
              { targetCityId: null },
              ...(options.cityId ? [{ targetCityId: options.cityId }] : []),
            ],
          },
        ],
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
      select: {
        id: true,
        postId: true,
        landingUrl: true,
        priority: true,
        adProduct: {
          select: {
            placementType: true,
            size: true,
            layout: true,
          },
        },
        post: {
          select: {
            id: true,
            title: true,
            body: true,
            status: true,
            createdAt: true,
            images: {
              select: { url: true },
              orderBy: { sortOrder: 'asc' },
              take: 1,
            },
            category: { select: { name: true, type: true, color: true } },
            city: { select: { name: true } },
            author: {
              select: {
                displayName: true,
                profileImageUrl: true,
                accountType: true,
                neighbourWarmth: true,
              },
            },
          },
        },
      },
    })) as RawCampaign[];
  } catch (error) {
    if (isMissingAdSchemaError(error)) {
      return { topFixed: null, inline: [] };
    }

    throw error;
  }

  // Only show ads for published posts
  const activeCampaigns = campaigns.filter(
    (c) => c.post.status === 'PUBLISHED',
  ) as RawCampaign[];

  const topFixedCampaigns = activeCampaigns.filter(
    (c) => c.adProduct.placementType === 'TOP_FIXED',
  );
  const inlineCampaigns = activeCampaigns.filter(
    (c) => c.adProduct.placementType === 'FEED_INLINE',
  );

  return {
    topFixed: topFixedCampaigns[0] ? toAdFeedItem(topFixedCampaigns[0]) : null,
    inline: inlineCampaigns.map(toAdFeedItem),
  };
}

export type InlinePlacementRule = {
  insertAfter: number;
  repeatInterval: number;
  maxPerPage: number;
};

const DEFAULT_INLINE_RULE: InlinePlacementRule = {
  insertAfter: 5,
  repeatInterval: 10,
  maxPerPage: 2,
};

const AD_SCHEMA_TOKENS = [
  'AdCampaign',
  'AdProduct',
  'AdPlacementRule',
  'AdImpression',
  'AdClick',
  'AdDailyStat',
];

function isMissingAdSchemaError(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const knownError = error as {
    code?: unknown;
    meta?: unknown;
    message?: unknown;
  };
  const code = typeof knownError.code === 'string' ? knownError.code : '';

  if (code !== 'P2021' && code !== 'P2022') {
    return false;
  }

  const meta =
    knownError.meta && typeof knownError.meta === 'object'
      ? (knownError.meta as Record<string, unknown>)
      : undefined;
  const tableName = typeof meta?.table === 'string' ? meta.table : '';
  const columnName = typeof meta?.column === 'string' ? meta.column : '';
  const message = typeof knownError.message === 'string' ? knownError.message : '';
  const details = `${tableName} ${columnName} ${message}`;

  return AD_SCHEMA_TOKENS.some((token) => details.includes(token));
}

export async function getInlinePlacementRule(): Promise<InlinePlacementRule> {
  let rule: {
    insertAfter: number;
    repeatInterval: number;
    maxPerPage: number;
    isActive: boolean;
  } | null = null;

  try {
    rule = await prisma.adPlacementRule.findUnique({
      where: { placementType: 'FEED_INLINE' },
      select: { insertAfter: true, repeatInterval: true, maxPerPage: true, isActive: true },
    });
  } catch (error) {
    if (!isMissingAdSchemaError(error)) {
      throw error;
    }
  }

  if (!rule || !rule.isActive) {
    return DEFAULT_INLINE_RULE;
  }

  return {
    insertAfter: rule.insertAfter,
    repeatInterval: rule.repeatInterval,
    maxPerPage: rule.maxPerPage,
  };
}

/**
 * Insert ad items into a post feed at positions defined by the placement rule.
 *
 * @param posts        Array of post items (each has at minimum `id`)
 * @param ads          Top-fixed and inline ads to insert
 * @param rule         Where to insert inline ads
 * @param isFirstPage  True when showing the first page (no cursor) — shows top-fixed ad
 */
export function insertAdsIntoFeed<T>(
  posts: T[],
  ads: ActiveAdSlots,
  rule: InlinePlacementRule,
  isFirstPage: boolean,
): (T | AdFeedItem)[] {
  const result: (T | AdFeedItem)[] = [];

  if (isFirstPage && ads.topFixed) {
    result.push(ads.topFixed);
  }

  if (ads.inline.length === 0) {
    return [...result, ...posts];
  }

  let adsInserted = 0;
  let inlineAdIndex = 0;

  for (let i = 0; i < posts.length; i++) {
    result.push(posts[i]);

    const postPosition = i + 1; // 1-indexed
    const isAfterFirstSlot = postPosition === rule.insertAfter;
    const isAtRepeatSlot =
      postPosition > rule.insertAfter &&
      (postPosition - rule.insertAfter) % rule.repeatInterval === 0;

    if (
      adsInserted < rule.maxPerPage &&
      (isAfterFirstSlot || isAtRepeatSlot)
    ) {
      result.push(ads.inline[inlineAdIndex % ads.inline.length]);
      inlineAdIndex++;
      adsInserted++;
    }
  }

  return result;
}
