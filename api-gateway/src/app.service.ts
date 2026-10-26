import { Injectable } from '@nestjs/common'

// Injectable services are created by Nest when registered in a module.
@Injectable()
export class AppService {
  // Simple response used by GET /health/hello to verify the gateway answers.
  getHello(): string {
    return 'Hello World!'
  }
}
