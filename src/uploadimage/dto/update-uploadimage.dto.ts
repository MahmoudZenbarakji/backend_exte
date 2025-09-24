import { PartialType } from '@nestjs/swagger';
import { CreateUploadimageDto } from './create-uploadimage.dto';

export class UpdateUploadimageDto extends PartialType(CreateUploadimageDto) {}
