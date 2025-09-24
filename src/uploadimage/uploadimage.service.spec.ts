import { Test, TestingModule } from '@nestjs/testing';
import { UploadimageService } from './uploadimage.service';

describe('UploadimageService', () => {
  let service: UploadimageService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UploadimageService],
    }).compile();

    service = module.get<UploadimageService>(UploadimageService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
