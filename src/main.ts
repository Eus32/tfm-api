import { NestFactory, HttpAdapterHost } from '@nestjs/core';
import { ValidationPipe, BadRequestException, Logger } from '@nestjs/common';
import { ValidationError } from "class-validator"
import rateLimit from 'express-rate-limit';

import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { AllExceptionsFilter } from "./common/filters/all-exception.filter"
import { TransformInterceptor } from "./common/interceptors/transform.interceptor"
import { AppModule } from './app.module';
import { getServerConfig } from "./config";
import { ConfigEnum } from "./config/enum"
import { LoggingInterceptor } from './common/interceptors/logger.interceptor';
import { SpelunkerModule } from 'nestjs-spelunker';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';


async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    cors: true,
  });
  const config = getServerConfig();

  const configDocument = new DocumentBuilder()
    .setTitle('TFM')
    .setDescription('Eus Vercher Gómez')
    .setVersion('1.0')
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, configDocument);
  SwaggerModule.setup('api', app, documentFactory);

  const port = config[ConfigEnum.APP_PORT]
  const nestWinston = app.get(WINSTON_MODULE_NEST_PROVIDER);
  app.useLogger(nestWinston);

  app.setGlobalPrefix('api/v1');

  const httpAdapter = app.get(HttpAdapterHost);
  app.useGlobalInterceptors(new LoggingInterceptor(nestWinston.logger), new TransformInterceptor());
  app.useGlobalFilters(new AllExceptionsFilter(nestWinston.logger, httpAdapter));
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      exceptionFactory: function (errors: ValidationError[]) {
        let message = ""
        const constraints = errors[0].constraints
        if(constraints){
          message = Object.values(constraints)[0]
        }
        return new BadRequestException(message);
      }

    }),
  );
  const tree = SpelunkerModule.explore(app);
  const root = SpelunkerModule.graph(tree);
  const edges = SpelunkerModule.findGraphEdges(root);

  const mermaidEdges = edges
    .map(({ from, to }) => `${from.module.name}-->${to.module.name}`);
  console.log(`graph TD\n\t${mermaidEdges.join('\n\t')}`);

  app.use(
    rateLimit({
      windowMs: 1 * 60 * 1000, // 1 minutes
      max: 300, // limit each IP to 100 requests per windowMs
    }),
  );

  await app.listen(typeof port === 'string' ? parseInt(port) : 3000)

}
bootstrap();
