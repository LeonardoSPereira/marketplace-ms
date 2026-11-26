import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import * as amqp from 'amqplib'

@Injectable()
export class RabbitmqService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RabbitmqService.name)
  private connection: amqp.ChannelModel
  private channel: amqp.Channel

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    await this.connect()
  }

  async onModuleDestroy() {
    await this.disconnect()
  }

  private async connect() {
    try {
      const rabbitmqUrl = this.configService.get<string>(
        'RABBITMQ_URL',
        'amqp://admin:admin@localhost:5672',
      )

      this.connection = await amqp.connect(rabbitmqUrl)
      this.channel = await this.connection.createChannel()
      this.logger.log('✅ RabbitMQ: Connected successfully')

      // Event listener to monitor connection
      this.connection.on('error', (err) => {
        this.logger.error('❌ RabbitMQ: connection error:', err)
      })

      this.connection.on('close', () => {
        this.logger.warn('⚠️ RabbitMQ: connection closed')
      })

      this.connection.on('blocked', (reason) => {
        this.logger.warn('⚠️ RabbitMQ: connection blocked:', reason)
      })

      this.connection.on('unblocked', () => {
        this.logger.log('✅ RabbitMQ: connection unblocked')
      })
    } catch (error) {
      this.logger.error(
        '⚠️ Failed to connect to RabbitMQ, continuing without message queue:',
        error
          ? error instanceof Error
            ? error.message
            : error
          : 'Unknown error',
      )
    }
  }

  private async disconnect() {
    try {
      if (this.channel) {
        await this.channel.close()
        this.logger.log('✅ RabbitMQ: channel closed')
      }

      if (this.connection) {
        await this.connection.close()
        this.logger.log('✅ RabbitMQ: Disconnected')
      }
    } catch (error) {
      this.logger.error(
        '❌ RabbitMQ: Error disconnecting:',
        error
          ? error instanceof Error
            ? error.message
            : error
          : 'Unknown error',
      )
    }
  }

  getChannel(): amqp.Channel {
    return this.channel
  }

  getConnection(): amqp.ChannelModel {
    return this.connection
  }

  async publishMessage(
    exchange: string,
    routingKey: string,
    message: unknown,
  ): Promise<void> {
    try {
      if (!this.channel) {
        this.logger.warn(
          '⚠️ RabbitMQ: channel not available, skipping message publish',
        )

        return
      }

      await this.channel.assertExchange(exchange, 'topic', { durable: true })
      const messageBuffer = Buffer.from(JSON.stringify(message))

      const published = this.channel.publish(
        exchange,
        routingKey,
        messageBuffer,
        {
          persistent: true,
          timestamp: Date.now(),
          contentType: 'application/json',
        },
      )

      // Debug-only payload log; remove before production to avoid logging sensitive order/payment data
      this.logger.debug(`Message content: ${JSON.stringify(message)}`)

      if (!published) {
        throw new Error('Failed to publish message to RabbitMQ')
      }

      this.logger.log(`✅ Message published to ${exchange}:${routingKey}`)
    } catch (error) {
      this.logger.error(
        '❌ RabbitMQ: Error publishing message:',
        error
          ? error instanceof Error
            ? error.message
            : error
          : 'Unknown error',
      )
    }
  }
}
