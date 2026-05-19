import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import {
  VehicleChargeType,
  VehicleCondition,
  VehicleFuelType,
  VehicleType,
} from '@prisma/client';

export class VehicleImageDto {
  @ApiProperty()
  @IsUrl()
  imageUrl!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  caption?: string | null;
}

export class VehicleChargeDto {
  @ApiProperty({ enum: VehicleChargeType })
  @IsEnum(VehicleChargeType)
  chargeType!: VehicleChargeType;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  amount!: number;

  @ApiPropertyOptional({ default: 'LKR' })
  @IsOptional()
  @IsString()
  @MaxLength(8)
  currency?: string;

  @ApiPropertyOptional({
    description:
      'Whether the amount already includes fuel ("with petrol" vs not).',
  })
  @IsOptional()
  @IsBoolean()
  includesFuel?: boolean;

  @ApiPropertyOptional({
    description: 'Extra surcharge per overnight stay, if pricing is per-km.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  nightSurcharge?: number | null;

  @ApiPropertyOptional({
    description: 'Minimum units (km / days / hours) the customer must commit to.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  minimumUnits?: number | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  label?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string | null;
}

/**
 * Single payload used for both create and update — the client posts the full
 * desired state of the vehicle (basic fields, ordered images, ordered charges)
 * and the server replaces nested collections wholesale. Mirrors how the guide
 * itinerary editor works.
 */
export class SaveVehicleDto {
  @ApiProperty()
  @IsString()
  @MaxLength(200)
  title!: string;

  @ApiProperty({ enum: VehicleType })
  @IsEnum(VehicleType)
  vehicleType!: VehicleType;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1950)
  @Max(2100)
  manufacturedYear?: number | null;

  @ApiProperty({ enum: VehicleFuelType })
  @IsEnum(VehicleFuelType)
  fuelType!: VehicleFuelType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  fuelConsumption?: string | null;

  @ApiPropertyOptional({ enum: VehicleCondition, default: 'GOOD' })
  @IsOptional()
  @IsEnum(VehicleCondition)
  condition?: VehicleCondition;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @IsString({ each: true })
  facilities?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @IsString({ each: true })
  extraFacilities?: string[];

  @ApiPropertyOptional({
    type: [String],
    description: "What's included with this vehicle.",
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @IsString({ each: true })
  inclusions?: string[];

  @ApiPropertyOptional({
    type: [String],
    description: "What's NOT included.",
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @IsString({ each: true })
  exclusions?: string[];

  @ApiPropertyOptional({ description: 'Tiptap HTML.' })
  @IsOptional()
  @IsString()
  @MaxLength(20000)
  description?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(300)
  pickupLocation?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(300)
  dropoffLocation?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  sameDropoffAsPickup?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  allowsAnyLocation?: boolean;

  @ApiPropertyOptional({
    description:
      'Fuel policy. Free-text but the UI picks from a curated list ("Full to full", "Petrol included", etc.).',
  })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  fuelPolicy?: string | null;

  @ApiPropertyOptional({ description: 'Vehicle registration / number plate.' })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  plateNumber?: string | null;

  @ApiPropertyOptional({
    description:
      'When true, the plate number is shown to travelers on the public listing.',
  })
  @IsOptional()
  @IsBoolean()
  plateNumberVisible?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ type: [VehicleImageDto] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(30)
  @ValidateNested({ each: true })
  @Type(() => VehicleImageDto)
  images?: VehicleImageDto[];

  @ApiPropertyOptional({ type: [VehicleChargeDto] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => VehicleChargeDto)
  charges?: VehicleChargeDto[];
}
