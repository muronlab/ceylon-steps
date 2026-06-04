import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import {
  PublicItinerariesService,
  type ItineraryOwnerType,
  type ItinerarySort,
} from './public-itineraries.service';

const SORT_VALUES = new Set<ItinerarySort>([
  'relevance',
  'newest',
  'price-asc',
  'price-desc',
  'duration-asc',
  'duration-desc',
]);

const OWNER_TYPES = new Set<ItineraryOwnerType>([
  'GUIDE',
  'ACTIVITY_PROVIDER',
  'SAFARI_JEEP',
]);

const DESIGN_TYPES = new Set(['DAYS', 'TIME', 'DURATION']);

function parseCsv(value: string | string[] | undefined): string[] | undefined {
  if (!value) return undefined;
  const raw = Array.isArray(value) ? value.join(',') : value;
  const parts = raw
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

@ApiTags('public/itineraries')
@Controller('public/itineraries')
export class PublicItinerariesController {
  constructor(private readonly itineraries: PublicItinerariesService) {}

  @ApiOperation({
    summary:
      'Search publicly-visible itineraries across all partner kinds (guides, activity providers, safari operators). Paginated, no auth. Returns slim cards with owner attribution.',
  })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({
    name: 'ownerType',
    required: false,
    enum: ['GUIDE', 'ACTIVITY_PROVIDER', 'SAFARI_JEEP'],
  })
  @ApiQuery({
    name: 'tags',
    required: false,
    description: 'Comma-separated list.',
  })
  @ApiQuery({
    name: 'languages',
    required: false,
    description: 'Comma-separated list.',
  })
  @ApiQuery({
    name: 'designType',
    required: false,
    enum: ['DAYS', 'TIME', 'DURATION'],
  })
  @ApiQuery({ name: 'minDays', required: false })
  @ApiQuery({ name: 'maxDays', required: false })
  @ApiQuery({ name: 'currency', required: false })
  @ApiQuery({ name: 'minPrice', required: false })
  @ApiQuery({ name: 'maxPrice', required: false })
  @ApiQuery({
    name: 'sort',
    required: false,
    enum: [
      'relevance',
      'newest',
      'price-asc',
      'price-desc',
      'duration-asc',
      'duration-desc',
    ],
  })
  @ApiQuery({ name: 'take', required: false })
  @ApiQuery({ name: 'skip', required: false })
  @Get()
  async search(
    @Query('search') search?: string,
    @Query('ownerType') ownerType?: string,
    @Query('tags') tags?: string,
    @Query('languages') languages?: string,
    @Query('designType') designType?: string,
    @Query('minDays') minDays?: string,
    @Query('maxDays') maxDays?: string,
    @Query('currency') currency?: string,
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
    @Query('sort') sort?: string,
    @Query('take') take?: string,
    @Query('skip') skip?: string,
  ) {
    const validSort =
      sort && SORT_VALUES.has(sort as ItinerarySort)
        ? (sort as ItinerarySort)
        : undefined;
    const validOwnerType =
      ownerType && OWNER_TYPES.has(ownerType as ItineraryOwnerType)
        ? (ownerType as ItineraryOwnerType)
        : undefined;
    const validDesignType =
      designType && DESIGN_TYPES.has(designType)
        ? (designType as 'DAYS' | 'TIME' | 'DURATION')
        : undefined;

    return this.itineraries.search({
      search,
      ownerType: validOwnerType,
      tags: parseCsv(tags),
      languages: parseCsv(languages),
      designType: validDesignType,
      minDays: parseInteger(minDays),
      maxDays: parseInteger(maxDays),
      currency: currency?.toUpperCase(),
      minPrice: parseDecimal(minPrice),
      maxPrice: parseDecimal(maxPrice),
      sort: validSort,
      take: parseInteger(take),
      skip: parseInteger(skip),
    });
  }

  @ApiOperation({
    summary: 'Filter values currently in use across visible itineraries',
  })
  @Get('facets')
  async facets() {
    return this.itineraries.facets();
  }

  @ApiOperation({
    summary:
      'Most-used tags across visible itineraries (top 20, with usage counts). Powers the popular-tags chip row.',
  })
  @Get('top-tags')
  async topTags() {
    return this.itineraries.topTags();
  }

  @ApiOperation({
    summary:
      'Full itinerary detail by id (overview, days, inclusions, gallery, owner). Only returned when the itinerary and its owner are publicly visible.',
  })
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.itineraries.findOne(id);
  }
}
