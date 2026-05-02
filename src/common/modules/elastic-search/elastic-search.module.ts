import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ElasticsearchModule as NestElasticSearchModule } from '@nestjs/elasticsearch';

@Global()
@Module({
  imports: [
    NestElasticSearchModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        return {
          node: configService.get<string>('ELASTICSEARCH_NODE'),
        };
      },
    }),
  ],
  exports: [NestElasticSearchModule],
})
export class ElasticSearchModule {}
