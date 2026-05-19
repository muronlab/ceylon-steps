import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SaveItineraryDto } from './dto/save-itinerary.dto';

const ITINERARY_INCLUDE = {
  days: { orderBy: [{ dayNumber: Prisma.SortOrder.asc }, { sortOrder: Prisma.SortOrder.asc }] },
  inclusions: { orderBy: { sortOrder: Prisma.SortOrder.asc } },
  galleryImages: { orderBy: { sortOrder: Prisma.SortOrder.asc } },
} satisfies Prisma.ItineraryInclude;

@Injectable()
export class ItinerariesService {
  constructor(private readonly prisma: PrismaService) {}

  private buildBaseData(dto: SaveItineraryDto): Prisma.ItineraryUncheckedUpdateInput {
    const data: Prisma.ItineraryUncheckedUpdateInput = {};
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.subtitle !== undefined) data.subtitle = dto.subtitle;
    if (dto.designType !== undefined) data.designType = dto.designType;
    if (dto.languagesOffered !== undefined) {
      // Trim + dedupe (case-insensitive) so the client doesn't drift into
      // duplicates as the guide edits chips.
      const seen = new Map<string, string>();
      for (const lang of dto.languagesOffered) {
        const trimmed = lang.trim();
        if (!trimmed) continue;
        const key = trimmed.toLowerCase();
        if (!seen.has(key)) seen.set(key, trimmed);
      }
      data.languagesOffered = [...seen.values()];
    }
    if (dto.tags !== undefined) {
      // Hashtags stored normalised: strip leading '#', lowercase, dedupe.
      // Searching across them later doesn't need to think about casing.
      const seen = new Set<string>();
      for (const raw of dto.tags) {
        const cleaned = raw.trim().replace(/^#+/, '').toLowerCase();
        if (cleaned) seen.add(cleaned);
      }
      data.tags = [...seen];
    }
    if (dto.durationDays !== undefined) data.durationDays = dto.durationDays;
    if (dto.durationLabel !== undefined) data.durationLabel = dto.durationLabel;
    if (dto.price !== undefined) data.price = dto.price;
    if (dto.currency !== undefined) {
      data.currency = dto.currency ? dto.currency.toUpperCase() : null;
    }
    if (dto.priceScope !== undefined) data.priceScope = dto.priceScope;
    if (dto.overview !== undefined) data.overview = dto.overview;
    if (dto.transportation !== undefined) data.transportation = dto.transportation;
    if (dto.meetingLocation !== undefined) data.meetingLocation = dto.meetingLocation;
    if (dto.imageGradient !== undefined) data.imageGradient = dto.imageGradient;
    if (dto.coverImageUrl !== undefined) data.coverImageUrl = dto.coverImageUrl;
    if (dto.isActive !== undefined) data.isActive = dto.isActive;
    if (dto.sortOrder !== undefined) data.sortOrder = dto.sortOrder;
    return data;
  }

  async list(guideProfileId: string) {
    return this.prisma.itinerary.findMany({
      where: { guideProfileId },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      include: ITINERARY_INCLUDE,
    });
  }

  async getOwned(guideProfileId: string, itineraryId: string) {
    const itinerary = await this.prisma.itinerary.findUnique({
      where: { id: itineraryId },
      include: ITINERARY_INCLUDE,
    });
    if (!itinerary) throw new NotFoundException('Itinerary not found');
    if (itinerary.guideProfileId !== guideProfileId) {
      throw new ForbiddenException('You do not own this itinerary.');
    }
    return itinerary;
  }

  async create(guideProfileId: string, dto: SaveItineraryDto) {
    // Apply the same trim/normalise pipeline used on update so the row is
    // consistent regardless of which path created it.
    const base = this.buildBaseData(dto);
    const created = await this.prisma.itinerary.create({
      data: {
        guideProfileId,
        title: dto.title,
        subtitle: dto.subtitle ?? null,
        designType: dto.designType ?? 'DAYS',
        languagesOffered:
          (base.languagesOffered as string[] | undefined) ?? [],
        tags: (base.tags as string[] | undefined) ?? [],
        durationDays: dto.durationDays ?? null,
        durationLabel: dto.durationLabel ?? null,
        price: dto.price ?? null,
        currency: dto.currency ? dto.currency.toUpperCase() : null,
        priceScope: dto.priceScope ?? 'PER_PERSON',
        overview: dto.overview ?? null,
        transportation: dto.transportation ?? null,
        meetingLocation: dto.meetingLocation ?? null,
        imageGradient: dto.imageGradient ?? null,
        coverImageUrl: dto.coverImageUrl ?? null,
        isActive: dto.isActive ?? true,
        sortOrder: dto.sortOrder ?? 0,
        days: dto.days
          ? {
              create: dto.days.map((d, i) => ({
                dayNumber: d.dayNumber,
                title: d.title,
                description: d.description ?? null,
                startTime: d.startTime ?? null,
                endTime: d.endTime ?? null,
                sortOrder: i,
              })),
            }
          : undefined,
        inclusions: dto.inclusions
          ? {
              create: dto.inclusions.map((inc, i) => ({
                kind: inc.kind,
                text: inc.text,
                sortOrder: i,
              })),
            }
          : undefined,
        galleryImages: dto.galleryImages
          ? {
              create: dto.galleryImages.map((img, i) => ({
                imageUrl: img.imageUrl,
                caption: img.caption ?? null,
                sortOrder: i,
              })),
            }
          : undefined,
      },
      include: ITINERARY_INCLUDE,
    });
    return created;
  }

  async update(guideProfileId: string, itineraryId: string, dto: SaveItineraryDto) {
    await this.getOwned(guideProfileId, itineraryId);

    const writes: Prisma.PrismaPromise<unknown>[] = [
      this.prisma.itinerary.update({
        where: { id: itineraryId },
        data: this.buildBaseData(dto),
      }),
    ];

    if (dto.days !== undefined) {
      writes.push(
        this.prisma.itineraryDay.deleteMany({ where: { itineraryId } }),
      );
      if (dto.days.length > 0) {
        writes.push(
          this.prisma.itineraryDay.createMany({
            data: dto.days.map((d, i) => ({
              itineraryId,
              dayNumber: d.dayNumber,
              title: d.title,
              description: d.description ?? null,
              startTime: d.startTime ?? null,
              endTime: d.endTime ?? null,
              sortOrder: i,
            })),
          }),
        );
      }
    }

    if (dto.inclusions !== undefined) {
      writes.push(
        this.prisma.itineraryInclusion.deleteMany({ where: { itineraryId } }),
      );
      if (dto.inclusions.length > 0) {
        writes.push(
          this.prisma.itineraryInclusion.createMany({
            data: dto.inclusions.map((inc, i) => ({
              itineraryId,
              kind: inc.kind,
              text: inc.text,
              sortOrder: i,
            })),
          }),
        );
      }
    }

    if (dto.galleryImages !== undefined) {
      writes.push(
        this.prisma.itineraryImage.deleteMany({ where: { itineraryId } }),
      );
      if (dto.galleryImages.length > 0) {
        writes.push(
          this.prisma.itineraryImage.createMany({
            data: dto.galleryImages.map((img, i) => ({
              itineraryId,
              imageUrl: img.imageUrl,
              caption: img.caption ?? null,
              sortOrder: i,
            })),
          }),
        );
      }
    }

    await this.prisma.$transaction(writes);

    return this.prisma.itinerary.findUnique({
      where: { id: itineraryId },
      include: ITINERARY_INCLUDE,
    });
  }

  async remove(guideProfileId: string, itineraryId: string) {
    await this.getOwned(guideProfileId, itineraryId);
    await this.prisma.itinerary.delete({ where: { id: itineraryId } });
    return { ok: true };
  }
}
