import "reflect-metadata";
import {
  Module,
  Controller,
  Get,
  Param,
  Post,
  Body,
  Req,
  Inject,
  HttpCode,
  Catch,
  ExceptionFilter,
  ArgumentsHost,
  HttpException,
} from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { type Request, type Response, json } from "express";
import helmet from "helmet";
import type { Database } from "./db";
import { Service } from "./service";
const TOKEN = "APP_SERVICE";
const token = (r: Request) =>
  r.headers.authorization?.replace(/^Bearer /, "") || "";
@Catch()
class Errors implements ExceptionFilter {
  catch(error: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    const known = error instanceof HttpException;
    const parseError =
      !!error &&
      typeof error === "object" &&
      "type" in error &&
      ["entity.parse.failed", "entity.too.large"].includes(String(error.type));
    const status = known
      ? error.getStatus()
      : parseError
        ? String((error as any).type) === "entity.too.large"
          ? 413
          : 400
        : 500;
    response.status(status).json({
      statusCode: status,
      message: known
        ? error.message
        : parseError
          ? "Corpo da solicitação inválido."
          : "Não foi possível concluir. Tente novamente.",
    });
  }
}
@Controller()
class API {
  constructor(@Inject(TOKEN) private readonly app: Service) {}
  @Get("health") health() {
    return { status: "ok", app: "Desafio Aceito", version: "1.1.0" };
  }
  @Post("auth/register") register(@Body() body: any) {
    return this.app.register(body);
  }
  @Post("auth/login") @HttpCode(200) login(@Body() body: any) {
    return this.app.login(body);
  }
  @Post("auth/logout") @HttpCode(204) async logout(@Req() req: Request) {
    await this.app.authenticate(token(req));
    await this.app.logout(token(req));
  }
  @Get("state") async state(@Req() req: Request) {
    return this.app.getState(await this.app.authenticate(token(req)));
  }
  @Get("teams") async teams(@Req() req: Request) {
    return this.app.teams(await this.app.authenticate(token(req)));
  }
  @Get("teams/:id") async team(@Req() req: Request, @Param("id") id: string) {
    return this.app.team(await this.app.authenticate(token(req)), id);
  }
  @Post("state") @HttpCode(200) async update(
    @Req() req: Request,
    @Body() body: any,
  ) {
    return this.app.update(await this.app.authenticate(token(req)), body);
  }
}
export async function createApp(db: Database) {
  @Module({
    controllers: [API],
    providers: [{ provide: TOKEN, useValue: new Service(db) }],
  })
  class AppModule {}
  const app = await NestFactory.create(AppModule, {
    logger: false,
    bodyParser: false,
  });
  app.use(helmet());
  app.use(json({ limit: "16kb" }));
  const origins = (process.env.CORS_ORIGINS || "").split(",").filter(Boolean);
  app.enableCors({ origin: origins.length ? origins : false });
  app.useGlobalFilters(new Errors());
  const hits = new Map<string, { count: number; until: number }>();
  app.use((req: Request, res: Response, next: () => void) => {
    if (req.url.startsWith("/auth/")) {
      const key = req.ip || "unknown",
        now = Date.now(),
        old = hits.get(key);
      const count =
        old && old.until > now
          ? old
          : { count: 0, until: now + 15 * 60 * 1000 };
      count.count++;
      hits.set(key, count);
      if (hits.size > 5000)
        for (const [k, v] of hits) if (v.until < now) hits.delete(k);
      if (count.count > 30) {
        res.status(429).json({
          message: "Muitas tentativas. Aguarde antes de tentar novamente.",
        });
        return;
      }
    }
    res.setHeader("Cache-Control", "no-store");
    next();
  });
  await app.init();
  return app;
}
