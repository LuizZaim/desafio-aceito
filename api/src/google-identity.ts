import { OAuth2Client, type TokenPayload } from "google-auth-library";
export type VerifiedGoogleIdentity = {issuer:"https://accounts.google.com";sub:string;email:string;name:string};
export interface GoogleIdentityProvider {
  readonly available:boolean;
  readonly clientId:string|null;
  verify(idToken:string):Promise<VerifiedGoogleIdentity>;
}
export interface GoogleTokenClient {
  verifyIdToken(options:{idToken:string;audience:string}):Promise<{getPayload():TokenPayload|undefined}>;
}
/** Only the official library may verify signatures. No decoded/unverified JWT is ever trusted. */
export function createGoogleIdentityProvider(env:NodeJS.ProcessEnv=process.env, injectedClient?:GoogleTokenClient):GoogleIdentityProvider {
  const clientId=env.GOOGLE_WEB_CLIENT_ID?.trim();
  if (!clientId || !/^[A-Za-z0-9_-]+\.apps\.googleusercontent\.com$/.test(clientId)) return {
    available:false,clientId:null,verify:async()=>{throw Error("GOOGLE_UNAVAILABLE");},
  };
  const client=injectedClient||new OAuth2Client(clientId);
  return {
    available:true,clientId,
    verify:async(idToken)=>{
      const ticket=await client.verifyIdToken({idToken,audience:clientId});
      const claims=ticket.getPayload(), now=Math.floor(Date.now()/1000);
      if (!claims || !["accounts.google.com","https://accounts.google.com"].includes(claims.iss) || claims.aud!==clientId ||
          typeof claims.exp!=="number" || !Number.isFinite(claims.exp) || claims.exp<=now || claims.email_verified!==true ||
          typeof claims.sub!=="string" || !claims.sub || claims.sub.length>255 ||
          typeof claims.email!=="string" || !/^\S+@\S+\.\S+$/.test(claims.email) || claims.email.length>254)
        throw Error("INVALID_GOOGLE_IDENTITY");
      const email=claims.email.trim().toLowerCase();
      return {issuer:"https://accounts.google.com",sub:claims.sub,email,name:typeof claims.name==="string"&&claims.name.trim()?claims.name.trim().slice(0,100):email.split("@")[0].slice(0,100)};
    },
  };
}
