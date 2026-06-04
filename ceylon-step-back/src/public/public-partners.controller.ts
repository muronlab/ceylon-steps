import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import {
  PublicPartnersService,
  type ActivityProviderSort,
} from './public-partners.service';
import { PublicItinerariesService } from './public-itineraries.service';

const ACTIVITY_SORT_VALUES = new Set<ActivityProviderSort>([
  'relevance',
  'newest',
  'experience-desc',
  'price-asc',
  'price-desc',
]);

function parseCsv(value: string | undefined): string[] | undefined {
  if (!value) return undefined;
  const parts = value
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  return parts.length > 0 ? parts : undefined;
}

function parseInteger(value: string | undefined): number | undefined {
  if (value === undefined) return undefined;
  const n = Number(value);
  if (!Number.isFinite(n)) return undefined;
  return Math.trunc(n);
}

function parseDecimal(value: string | undefined): number | undefined {
  if (value === undefined) return undefined;
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return undefined;
  return n;
}

@ApiTags('public/partners')
@Controller('public')
export class PublicPartnersController {
  constructor(
    private readonly partners: PublicPartnersService,
    private readonly itineraries: PublicItinerariesService,
  ) {}

  @ApiOperation({
    summary:
      'Search visible activity-provider profiles (public, paginated). Returns provider cards for the activities directory.',
  })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({
    name: 'languages',
    required: false,
    description: 'Comma-separated list.',
  })
  @ApiQuery({ name: 'minExperience', required: false })
  @ApiQuery({ name: 'currency', required: false })
  @ApiQuery({ name: 'minPrice', required: false })
  @ApiQuery({ name: 'maxPrice', required: false })
  @ApiQuery({
    name: 'sort',
    required: false,
    enum: ['relevance', 'newest', 'experience-desc', 'price-asc', 'price-desc'],
  })
  @ApiQuery({ name: 'take', required: false })
  @ApiQuery({ name: 'skip', required: false })
  @Get('activity-providers')
  async searchActivityProviders(
    @Query('search') search?: string,
    @Query('languages') languages?: string,
    @Query('minExperience') minExperience?: string,
    @Query('currency') currency?: string,
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
    @Query('sort') sort?: string,
    @Query('take') take?: string,
    @Query('skip') skip?: string,
  ) {
    const validSort =
      sort && ACTIVITY_SORT_VALUES.has(sort as ActivityProviderSort)
        ? (sort as ActivityProviderSort)
        : undefined;
    return this.partners.searchActivityProviders({
      search,
      languages: parseCsv(languages),
      minExperience: parseInteger(minExperience),
      currency: currency?.toUpperCase(),
      minPrice: parseDecimal(minPrice),
      maxPrice: parseDecimal(maxPrice),
      sort: validSort,
      take: parseInteger(take),
      skip: parseInteger(skip),
    });
  }

  @ApiOperation({
    summary:
      'Most-used itinerary tags among visible activity providers (top 20, with usage counts).',
  })
  @Get('activity-providers/top-tags')
  async activityProviderTopTags() {
    return this.itineraries.topTags('ACTIVITY_PROVIDER');
  }

  @ApiOperation({
    summary:
      'Public activity-provider profile by id — header, contact, languages, gallery, and itinerary cards. KYC fields stripped. Only returned when the profile is publicly visible.',
  })
  @Get('activity-providers/:id')
  async activityProvider(@Param('id') id: string) {
    return this.partners.getActivityProvider(id);
  }

  @ApiOperation({
    summary:
      'Public transport-provider profile by id — header, contact, safari jeeps, vehicles, driver services, and itinerary cards. KYC fields stripped. Only returned when the profile is publicly visible.',
  })
  @Get('transport-providers/:id')
  async transportProvider(@Param('id') id: string) {
    return this.partners.getTransportProvider(id);
  }
}
