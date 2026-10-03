import { sql } from "@elements/app";
import { coverUrl, CoverSource } from "#app/shared/covers";
import { renderMarkdown } from "#app/shared/markdown";

export interface CampaignCard {
  id: string;
  slug: string;
  title: string;
  summary: string;
  organizerName: string;
  goalCents: number;
  raisedCents: number;
  donorCount: number;
  featured: boolean;
  coverUrl: string;
  createdAt: Date;
}

interface CampaignRow extends CoverSource {
  id: string;
  slug: string;
  title: string;
  summary: string;
  organizerName: string;
  goalCents: number;
  raisedCents: number;
  donorCount: number;
  featured: boolean;
  createdAt: Date;
}

function toCard(row: CampaignRow): CampaignCard {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    organizerName: row.organizerName,
    goalCents: row.goalCents,
    raisedCents: row.raisedCents,
    donorCount: row.donorCount,
    featured: row.featured,
    coverUrl: coverUrl(row),
    createdAt: row.createdAt,
  };
}

const CARD_SELECT = sql.raw(`
  select c.id, c.slug, c.title, c.summary, c.goalCents, c.featured, c.createdAt,
         c.coverAsset, c.coverImageId, i.hash as coverHash,
         u.name as organizerName,
         coalesce(t.raisedCents, 0)::int as raisedCents,
         coalesce(t.donorCount, 0)::int as donorCount
    from campaigns c
    join users u on u.id = c.organizerId
    left join images i on i.id = c.coverImageId
    left join lateral (
      select sum(amountCents) as raisedCents, count(*) as donorCount
        from donations d
       where d.campaignId = c.id
    ) t on true
`);

export function listCampaigns(): CampaignCard[] {
  return sql<CampaignRow>(`${CARD_SELECT} order by c.featured desc, c.createdAt desc`).all().map(toCard);
}

export function listOrganizerCampaigns(organizerId: string): CampaignCard[] {
  return sql<CampaignRow>(`${CARD_SELECT} where c.organizerId = ${organizerId} order by c.createdAt desc`).all().map(toCard);
}

/** @rpc */
export function searchCampaigns(query: string): CampaignCard[] {
  let q = query.trim().slice(0, 100);

  if (!q) {
    return listCampaigns();
  }

  let pattern = `%${q.replace(/[\\%_]/g, (m) => "\\" + m)}%`;

  return sql<CampaignRow>(`
    ${CARD_SELECT}
    where c.title ilike ${pattern} or c.summary ilike ${pattern} or c.story ilike ${pattern} or u.name ilike ${pattern}
    order by c.featured desc, c.createdAt desc
  `).all().map(toCard);
}

export interface CampaignUpdate {
  id: string;
  title: string;
  bodyHtml: string;
  createdAt: Date;
}

export interface CampaignDetail {
  id: string;
  slug: string;
  title: string;
  summary: string;
  storyHtml: string;
  goalCents: number;
  coverUrl: string;
  organizerId: string;
  organizerName: string;
  createdAt: Date;
  updates: CampaignUpdate[];
}

export function getCampaign(slug: string): CampaignDetail {
  let row = sql<CoverSource & { id: string; slug: string; title: string; summary: string; story: string; goalCents: number; organizerId: string; organizerName: string; createdAt: Date }>(`
    select c.id, c.slug, c.title, c.summary, c.story, c.goalCents, c.createdAt,
           c.coverAsset, c.coverImageId, i.hash as coverHash,
           c.organizerId, u.name as organizerName
      from campaigns c
      join users u on u.id = c.organizerId
      left join images i on i.id = c.coverImageId
     where c.slug = ${slug}
  `).firstOrThrow("That campaign does not exist.");

  let updates = sql<{ id: string; title: string; body: string; createdAt: Date }>(`
    select id, title, body, createdAt from updates where campaignId = ${row.id} order by createdAt desc
  `).all();

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    storyHtml: renderMarkdown(row.story),
    goalCents: row.goalCents,
    coverUrl: coverUrl(row),
    organizerId: row.organizerId,
    organizerName: row.organizerName,
    createdAt: row.createdAt,
    updates: updates.map((u) => ({ id: u.id, title: u.title, bodyHtml: renderMarkdown(u.body), createdAt: u.createdAt })),
  };
}
