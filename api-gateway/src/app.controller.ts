import { Controller } from '@nestjs/common'

import { AppService } from '@/app.service.js'

// Root controller shell; active health handlers are registered in HealthModule.
@Controller()
export class AppController {
  // Nest injects AppService from the root module; this class has no route handlers.
  constructor(private readonly appService: AppService) {}
}
