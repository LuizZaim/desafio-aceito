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
import type { EmailDelivery } from "./mail";
import type { GoogleIdentityProvider } from "./google-identity";
const TOKEN = "APP_SERVICE";
const token = (r: Request) =>
  r.headers.authorization?.replace(/^Bearer /, "") || "";
@Catch()
class Errors implements ExceptionFilter {
  catch(error: unknown, host: ArgumentsHost) {
    const http = host.switchToHttp();
    const response = http.getResponse<Response>();
    const known = error instanceof HttpException;
    const parseError =
      !!error &&
      typeof error === "object" &&
      "type" in error &&
      ["entity.parse.failed", "entity.too.large"].includes(String(error.type));
    const rawJson = known && /JSON|Unexpected token|position \d+/.test(error.message);
    const status = known
      ? error.getStatus()
      : parseError
        ? String((error as any).type) === "entity.too.large"
          ? 413
          : 400
        : 500;
    if (status >= 500) {
      const req = http.getRequest<Request>();
      // Sem corpo, cabeçalhos ou token: só método, rota e código do erro.
      console.error("erro-500", req.method, String(req.url).split("?")[0], (error as any)?.code || (error as any)?.name || "desconhecido");
    }
    response.status(status).json({
      statusCode: status,
      message: rawJson
        ? "Corpo da solicitação inválido."
        : known
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
    return { status: "ok", app: "Desafio Aceito", version: "1.5.0" };
  }
  @Post("auth/register") register(@Body() body: any) {
    return this.app.register(body);
  }
  @Post("auth/login") @HttpCode(200) login(@Body() body: any) {
    return this.app.login(body);
  }
  @Post("auth/google") @HttpCode(200) google(@Body() body:any) { return this.app.googleLogin(body); }
  @Get("auth/capabilities") capabilities() { return this.app.capabilities(); }
  @Post("auth/forgot-password") @HttpCode(202) forgot(@Body() body: any) { return this.app.forgot(body); }
  @Post("auth/reset-password") @HttpCode(200) reset(@Body() body: any) { return this.app.reset(body); }
  @Post("auth/recover-code") @HttpCode(200) recoverCode(@Body() body: any) { return this.app.recoverCode(body); }
  @Post("auth/confirm-email") @HttpCode(200) confirmEmail(@Body() body: any) { return this.app.confirmEmail(body); }
  @Get("account") async account(@Req() req: Request) { return this.app.account(await this.app.authenticate(token(req))); }
  @Post("account/password") @HttpCode(200) async password(@Req() req: Request, @Body() body: any) {
    return this.app.changePassword(await this.app.authenticate(token(req)),body);
  }
  @Post("account/email") @HttpCode(202) async email(@Req() req: Request, @Body() body: any) {
    return this.app.changeEmail(await this.app.authenticate(token(req)),body);
  }
  @Post("account/recovery-codes") @HttpCode(200) async recoveryCodes(@Req() req: Request, @Body() body: any) {
    return this.app.createRecoveryCodes(await this.app.authenticate(token(req)),body);
  }
  @Post("auth/logout") @HttpCode(204) async logout(@Req() req: Request) {
    await this.app.authenticate(token(req));
    await this.app.logout(token(req));
  }
  @Get("state") async state(@Req() req: Request) {
    return this.app.getState(await this.app.authenticate(token(req)));
  }
  @Get("referee") async referee(@Req() req: Request) {
    return this.app.referee(await this.app.authenticate(token(req)));
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
export async function createApp(db: Database, options: {emailDelivery?: EmailDelivery;googleIdentity?:GoogleIdentityProvider} = {}) {
  @Module({
    controllers: [API],
    providers: [{ provide: TOKEN, useValue: new Service(db,options.emailDelivery,options.googleIdentity) }],
  })
  class AppModule {}
  const app = await NestFactory.create(AppModule, {
    logger: false,
    bodyParser: false,
  });
  // Atrás do proxy do Render, req.ip precisa ser o IP real do cliente para o limite não ser global.
  (app.getHttpAdapter().getInstance() as any).set("trust proxy", 1);
  app.use(helmet());
  app.use(json({ limit: "16kb" }));
  const origins = (process.env.CORS_ORIGINS || "").split(",").filter(Boolean);
  app.enableCors({ origin: origins.length ? origins : false });
  app.useGlobalFilters(new Errors());
  const hits = new Map<string, { count: number; until: number }>();
  app.use((req: Request, res: Response, next: () => void) => {
    if (req.url.startsWith("/auth/") || req.url.startsWith("/account")) {
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
