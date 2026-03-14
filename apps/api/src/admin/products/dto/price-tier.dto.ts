import { IsInt, IsOptional, Min } from 'class-validator';

export class CreatePriceTierDto {
  @IsInt()
  @Min(1)
  minQty: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  maxQty?: number | null;

  @IsInt()
  @Min(0)
  price: number;
}

export class UpdatePriceTierDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  minQty?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  maxQty?: number | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  price?: number;
}
