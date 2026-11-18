import { Injectable } from '@nestjs/common'

// Injectable services are created by Nest when registered in a module.
@Injectable()
export class AppService {
  // Starter helper retained on AppService; no active controller route calls it.
  getHello(): string {
    return 'Hello World!'
  }
}
