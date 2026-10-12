import { PartialType } from '@nestjs/mapped-types';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  Max,
  Min,
} from 'class-validator';

const url = { protocols: ['http', 'https'], require_protocol: true };

export class CreateProjectDto {
  @IsString() @IsNotEmpty() title: string;
  @Matches(/^[a-z0-9-]+$/, { message: 'slug may only contain a-z, 0-9 and -' })
  slug: string;
  @IsString() @IsNotEmpty() summaryEn: string;
  @IsString() @IsNotEmpty() summaryEs: string;
  @IsArray() @IsString({ each: true }) tags: string[];
  // @IsOptional also accepts null, which clears the field.
  @IsOptional() @IsUrl(url) repoUrl?: string | null;
  @IsOptional() @IsUrl(url) liveUrl?: string | null;
  @IsOptional() @IsUrl(url) imageUrl?: string | null;
  @IsOptional() @IsInt() @Min(1990) @Max(2100) year?: number | null;
  @IsOptional() @IsBoolean() featured?: boolean;
  @IsOptional() @IsBoolean() published?: boolean;
  @IsOptional() @IsInt() @Min(0) order?: number;
}

export class UpdateProjectDto extends PartialType(CreateProjectDto) {}
