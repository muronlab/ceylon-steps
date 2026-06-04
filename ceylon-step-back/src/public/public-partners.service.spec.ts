import { NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PublicPartnersService } from './public-partners.service';

describe('PublicPartnersService', () => {
  const makeService = (prisma: unknown) =>
    new PublicPartnersService(prisma as PrismaService);

  type ProfileWhere =
    | Prisma.ActivityProviderProfileWhereInput
    | Prisma.TransportProviderProfileWhereInput;

  describe('getActivityProvider', () => {
    it('throws NotFound when no visible profile matches', async () => {
      const prisma: any = {
        activityProviderProfile: {
          findFirst: jest.fn().mockResolvedValue(null),
        },
      };
      await expect(
        makeService(prisma).getActivityProvider('missing'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('gates on visibility and prefers the business name when opted in', async () => {
      let captured: { where: ProfileWhere } | undefined;
      const prisma: any = {
        activityProviderProfile: {
          findFirst: jest.fn((args: { where: ProfileWhere }) => {
            captured = args;
            return Promise.resolve({
              id: 'a-1',
              fullName: 'Nimal Perera',
              businessName: 'Clay Studio',
              businessNameColor: null,
              displayBusinessName: true,
              natureOfBusiness: 'Pottery',
              description: null,
              contactEmail: 'a@example.com',
              businessEmail: null,
              mobileNumber: '0770000000',
              businessPhone: null,
              whatsappAvailable: false,
              address: 'Kandy',
              businessAddress: null,
              profilePhotoUrl: null,
              coverPhotoUrl: null,
              yearsOfExperience: 4,
              currency: 'LKR',
              pricePerHour: null,
              pricePerDay: null,
              approvedAt: new Date(0),
              createdAt: new Date(0),
              updatedAt: new Date(0),
              languages: [],
              galleryImages: [],
              itineraries: [],
            });
          }),
        },
      };

      const res = await makeService(prisma).getActivityProvider('a-1');

      expect(res.displayName).toBe('Clay Studio');
      expect(res.type).toBe('ACTIVITY_PROVIDER');
      // Business contact falls back to the provider's own values when null.
      expect(res.email).toBe('a@example.com');
      const where = captured?.where as Prisma.ActivityProviderProfileWhereInput;
      expect(where.isActive).toBe(true);
      expect(where.adminEnabled).toBe(true);
    });
  });

  describe('searchActivityProviders', () => {
    it('gates on visibility, clamps paging, and prefers the business name', async () => {
      let captured:
        | { where: ProfileWhere; take: number; skip: number }
        | undefined;
      const prisma: any = {
        $transaction: jest.fn().mockResolvedValue([
          [
            {
              id: 'a-1',
              fullName: 'Nimal Perera',
              businessName: 'Clay Studio',
              businessNameColor: null,
              displayBusinessName: true,
              natureOfBusiness: 'Pottery',
              description: null,
              profilePhotoUrl: null,
              coverPhotoUrl: null,
              yearsOfExperience: 4,
              currency: 'LKR',
              pricePerHour: null,
              pricePerDay: null,
              languages: [],
            },
          ],
          1,
        ]),
        activityProviderProfile: {
          findMany: jest.fn(
            (args: { where: ProfileWhere; take: number; skip: number }) => {
              captured = args;
              return [];
            },
          ),
          count: jest.fn().mockReturnValue(1),
        },
      };

      const res = await makeService(prisma).searchActivityProviders({
        take: 999,
        skip: -3,
      });

      expect(captured?.take).toBe(60);
      expect(captured?.skip).toBe(0);
      const where = captured?.where as Prisma.ActivityProviderProfileWhereInput;
      expect(where.isActive).toBe(true);
      expect(where.adminEnabled).toBe(true);
      expect(res.total).toBe(1);
      expect(res.items[0].displayName).toBe('Clay Studio');
    });
  });

  describe('getTransportProvider', () => {
    it('throws NotFound when no visible profile matches', async () => {
      const prisma: any = {
        transportProviderProfile: {
          findFirst: jest.fn().mockResolvedValue(null),
        },
      };
      await expect(
        makeService(prisma).getTransportProvider('missing'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('falls back to the full name when there is no business', async () => {
      const prisma: any = {
        transportProviderProfile: {
          findFirst: jest.fn().mockResolvedValue({
            id: 't-1',
            fullName: 'Sunil Silva',
            providerType: 'SAFARI_JEEP',
            hasBusiness: false,
            businessName: null,
            businessDescription: null,
            contactEmail: 't@example.com',
            mobileNumber: '0710000000',
            whatsappAvailable: false,
            profilePhotoUrl: null,
            coverPhotoUrl: null,
            approvedAt: new Date(0),
            createdAt: new Date(0),
            updatedAt: new Date(0),
            safariJeeps: [],
            vehicles: [],
            driverServices: [],
          }),
        },
        itinerary: { findMany: jest.fn().mockResolvedValue([]) },
      };

      const res = await makeService(prisma).getTransportProvider('t-1');

      expect(res.displayName).toBe('Sunil Silva');
      expect(res.type).toBe('TRANSPORT_PROVIDER');
      expect(res.itineraries).toEqual([]);
    });
  });
});
