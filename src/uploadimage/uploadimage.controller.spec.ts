import { Test, TestingModule } from '@nestjs/testing';
import { UploadimageController } from './uploadimage.controller';
import { UploadimageService } from './uploadimage.service';

describe('UploadimageController', () => {
  let controller: UploadimageController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UploadimageController],
      providers: [UploadimageService],
    }).compile();

    controller = module.get<UploadimageController>(UploadimageController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
