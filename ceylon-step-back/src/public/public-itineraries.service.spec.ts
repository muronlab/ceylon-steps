import { NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PublicItinerariesService } from './public-itineraries.service';

describe('PublicItinerariesService', () => {
  const makeService = (prisma: unknown) =>
    new PublicItinerariesService(prisma as PrismaService);

  const guideRow = {
    id: 'it-guide',
    title: 'Sunrise safari',
    subtitle: '4 hr typical',
    tags: ['safari'],
    languagesOffered: ['English'],
    guideProfile: {
      id: 'g-1',
      displayName: 'Savindu Panagoda',
      fullName: 'Savindu P',
      profilePhotoUrl: null,
    },
    activityProviderProfile: null,
    safariJeep: null,
  };

  type FindManyArgs = {
    take: number;
    skip: number;
    where: Prisma.ItineraryWhereInput;
  };

  describe('search', () => {
    it('clamps take to [1, 60] and skip to >= 0, and attributes the owner', async () => {
      let captured: FindManyArgs | undefined;

      const prisma: any = {
        $transaction: jest.fn().mockResolvedValue([[guideRow], 1]),
        itinerary: {
          findMany: jest.fn((args: FindManyArgs) => {
            captured = args;
            return [guideRow];
          }),
          count: jest.fn().mockReturnValue(1),
        },
      };

      const res = await makeService(prisma).search({ take: 999, skip: -5 });

      expect(captured?.take).toBe(60);
      expect(captured?.skip).toBe(0);
      expect(res.total).toBe(1);
      // Owner relations are stripped and replaced with a single attribution.
      expect(res.items[0]).not.toHaveProperty('guideProfile');
      expect(res.items[0].owner).toEqual({
        type: 'GUIDE',
        id: 'g-1',
        profileId: 'g-1',
        name: 'Savindu Panagoda',
        photoUrl: null,
      });
    });

    it('only ever queries active itineraries owned by a visible partner', async () => {
      let captured: FindManyArgs | undefined;

      const prisma: any = {
        $transaction: jest.fn().mockResolvedValue([[], 0]),
        itinerary: {
          findMany: jest.fn((args: FindManyArgs) => {
            captured = args;
            return [];
          }),
          count: jest.fn().mockReturnValue(0),
        },
      };

      await makeService(prisma).search({});

      expect(captured?.where.isActive).toBe(true);
      // First AND clause is the eligibility OR across the three owner kinds.
      const and = captured?.where.AND as Prisma.ItineraryWhereInput[];
      const eligibility = and[0] as { OR: Prisma.ItineraryWhereInput[] };
      expect(eligibility.OR).toHaveLength(3);
    });
  });

  describe('topTags', () => {
    it('counts distinct itineraries per tag and returns them most-used first (ties alpha)', async () => {
      const prisma: any = {
        itinerary: {
          findMany: jest.fn().mockResolvedValue([
            { tags: ['beach', 'surf'] },
            { tags: ['surf', 'wildlife'] },
            { tags: ['surf'] },
            { tags: ['beach'] },
          ]),
        },
      };

      const { tags } = await makeService(prisma).topTags();

      expect(tags).toEqual([
        { tag: 'surf', count: 3 },
        { tag: 'beach', count: 2 },
        { tag: 'wildlife', count: 1 },
      ]);
    });

    it('caps the result at 20 tags', async () => {
      const rows = Array.from({ length: 30 }, (_, i) => ({ tags: [`tag-${i}`] }));
      const prisma: any = {
        itinerary: { findMany: jest.fn().mockResolvedValue(rows) },
      };

      const { tags } = await makeService(prisma).topTags();

      expect(tags).toHaveLength(20);
    });

    it('counts distinct guides per tag (a guide with two matching itineraries counts once)', async () => {
      const prisma: any = {
        itinerary: {
          findMany: jest.fn().mockResolvedValue([
            // Guide g1 has two itineraries both tagged "sigiriya" → counts once.
            { tags: ['sigiriya', 'hiking'], guideProfileId: 'g1' },
            { tags: ['sigiriya'], guideProfileId: 'g1' },
            // Guide g2 also uses "sigiriya".
            { tags: ['sigiriya'], guideProfileId: 'g2' },
          ]),
        },
      };

      const { tags } = await makeService(prisma).topTags('GUIDE');

      expect(tags).toEqual([
        { tag: 'sigiriya', count: 2 },
        { tag: 'hiking', count: 1 },
      ]);
    });

    it('narrows to one owner kind by requiring its FK be set', async () => {
      let captured: { where: Prisma.ItineraryWhereInput } | undefined;
      const prisma: any = {
        itinerary: {
          findMany: jest.fn((args: { where: Prisma.ItineraryWhereInput }) => {
            captured = args;
            return [];
          }),
        },
      };

      await makeService(prisma).topTags('GUIDE');

      const and = captured?.where.AND as Prisma.ItineraryWhereInput[];
      // First clause is the eligibility OR; second narrows to guide-owned.
      expect(and[1]).toEqual({ guideProfileId: { not: null } });
    });
  });

  describe('findOne', () => {
    it('throws NotFound when no visible itinerary matches', async () => {
      const prisma: any = {
        itinerary: { findFirst: jest.fn().mockResolvedValue(null) },
      };
      await expect(
        makeService(prisma).findOne('missing'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('resolves an activity-provider owner using the business-name preference', async () => {
      const prisma: any = {
        itinerary: {
          findFirst: jest.fn().mockResolvedValue({
            id: 'it-act',
            title: 'Pottery class',
            days: [],
            inclusions: [],
            galleryImages: [],
            guideProfile: null,
            activityProviderProfile: {
              id: 'a-1',
              fullName: 'Nimal Perera',
              businessName: 'Clay Studio',
              displayBusinessName: true,
              profilePhotoUrl: null,
            },
            safariJeep: null,
          }),
        },
      };

      const res = await makeService(prisma).findOne('it-act');

      expect(res.owner).toEqual({
        type: 'ACTIVITY_PROVIDER',
        id: 'a-1',
        profileId: 'a-1',
        name: 'Clay Studio',
        photoUrl: null,
      });
      expect(res).not.toHaveProperty('activityProviderProfile');
    });
  });
});
