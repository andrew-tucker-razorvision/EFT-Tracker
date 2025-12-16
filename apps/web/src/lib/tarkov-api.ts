/**
 * Client for fetching quest details from tarkov.dev GraphQL API
 */

const TARKOV_API_URL = "https://api.tarkov.dev/graphql";

// In-memory cache for quest details (session-scoped)
const questDetailsCache = new Map<string, TarkovQuestDetails>();

export interface TarkovItem {
  name: string;
  shortName: string;
  iconLink: string;
}

export interface TarkovTraderStanding {
  trader: {
    name: string;
  };
  standing: number;
}

export interface TarkovItemReward {
  item: TarkovItem;
  count: number;
}

export interface TarkovRewards {
  traderStanding: TarkovTraderStanding[];
  items: TarkovItemReward[];
}

export interface TarkovObjectiveItem {
  id: string;
  type: string;
  description: string;
  item?: TarkovItem;
  items?: TarkovItem[];
  count?: number;
  foundInRaid?: boolean;
}

export interface TarkovNeededKey {
  keys: TarkovItem[];
  map: {
    name: string;
  } | null;
}

export interface TarkovQuestDetails {
  id: string;
  name: string;
  experience: number;
  finishRewards: TarkovRewards;
  objectives: TarkovObjectiveItem[];
  neededKeys: TarkovNeededKey[];
}

const QUEST_DETAILS_QUERY = `
query GetQuestDetails($id: ID!) {
  task(id: $id) {
    id
    name
    experience
    finishRewards {
      traderStanding {
        trader {
          name
        }
        standing
      }
      items {
        item {
          name
          shortName
          iconLink
        }
        count
      }
    }
    objectives {
      id
      type
      description
      ... on TaskObjectiveItem {
        item {
          name
          shortName
          iconLink
        }
        items {
          name
          shortName
          iconLink
        }
        count
        foundInRaid
      }
    }
    neededKeys {
      keys {
        name
        shortName
        iconLink
      }
      map {
        name
      }
    }
  }
}
`;

export async function fetchQuestDetails(
  questId: string
): Promise<TarkovQuestDetails | null> {
  // Check cache first
  const cached = questDetailsCache.get(questId);
  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(TARKOV_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: QUEST_DETAILS_QUERY,
        variables: { id: questId },
      }),
    });

    if (!response.ok) {
      console.error(`Tarkov API error: ${response.status}`);
      return null;
    }

    const result = await response.json();

    if (result.errors) {
      console.error("Tarkov API GraphQL errors:", result.errors);
      return null;
    }

    const details = result.data?.task as TarkovQuestDetails | null;

    // Cache successful result
    if (details) {
      questDetailsCache.set(questId, details);
    }

    return details;
  } catch (error) {
    console.error("Failed to fetch quest details from tarkov.dev:", error);
    return null;
  }
}

/**
 * Clear the quest details cache (useful for testing or forced refresh)
 */
export function clearQuestDetailsCache(): void {
  questDetailsCache.clear();
}
