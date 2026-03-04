import { Body, Controller, Post } from '@nestjs/common';
import { FirebaseAdminService } from './firebase-admin.service';

interface PathRequest {
  path: string;
}

interface ByFieldRequest extends PathRequest {
  field: string;
  value: unknown;
}

interface WriteRequest extends PathRequest {
  data: Record<string, unknown>;
  mode: 'set' | 'update' | 'push';
}

@Controller('firebase')
export class FirebaseController {
  constructor(private readonly firebaseAdminService: FirebaseAdminService) {}

  @Post('list')
  getList(@Body() body: PathRequest) {
    return this.firebaseAdminService.getList(body.path);
  }

  @Post('by-id')
  getById(@Body() body: PathRequest) {
    return this.firebaseAdminService.getById(body.path);
  }

  @Post('by-field')
  getByField(@Body() body: ByFieldRequest) {
    return this.firebaseAdminService.getByField(body.path, body.field, body.value);
  }

  @Post('write')
  async write(@Body() body: WriteRequest) {
    await this.firebaseAdminService.write(body.path, body.data, body.mode);
    return { success: true };
  }

  @Post('delete')
  async delete(@Body() body: PathRequest) {
    await this.firebaseAdminService.delete(body.path);
    return { success: true };
  }
}
