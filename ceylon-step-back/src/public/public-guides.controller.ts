import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { PublicGuidesService, type GuideSort } from './public-guides.service';

const SORT_VALUES = new Set<GuideSort>([
  'relevance',
  'newest',
  'experience-desc',
  'price-asc',
  'price-desc',
]);

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

@ApiTags('public/guides')
@Controller('public/guides')
export class PublicGuidesController {
  constructor(private readonly guides: PublicGuidesService) {}

  @ApiOperation({ summary: 'Search active guide profiles (public, paginated)' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'regions', required: false, description: 'Comma-separated list.' })
  @ApiQuery({ name: 'languages', required: false, description: 'Comma-separated list.' })
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
  @Get()
  async search(
    @Query('search') search?: string,
    @Query('category') category?: string,
    @Query('regions') regions?: string,
    @Query('languages') languages?: string,
    @Query('minExperience') minExperience?: string,
    @Query('currency') currency?: string,
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
    @Query('sort') sort?: string,
    @Query('take') take?: string,
    @Query('skip') skip?: string,
  ) {
    const validSort = sort && SORT_VALUES.has(sort as GuideSort) ? (sort as GuideSort) : undefined;
    return this.guides.search({
      search,
      category,
      regions: parseCsv(regions),
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

  @ApiOperation({ summary: 'Filter values currently in use across active profiles' })
  @Get('facets')
  async facets() {
    return this.guides.facets();
  }

  @ApiOperation({
    summary:
      'Public guide profile by id — header fields, languages, gallery, and itinerary CARDS (no day/inclusion/gallery details to keep the response small).',
  })
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.guides.findOne(id);
  }

  @ApiOperation({
    summary:
      'Full itinerary detail (overview HTML, days, inclusions, gallery). Loaded on demand when a card is opened.',
  })
  @Get(':guideId/itineraries/:itineraryId')
  async getItineraryDetail(
    @Param('guideId') guideId: string,
    @Param('itineraryId') itineraryId: string,
  ) {
    return this.guides.getItineraryDetail(guideId, itineraryId);
  }
}
