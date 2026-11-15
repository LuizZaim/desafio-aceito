import Constants, { ExecutionEnvironment } from "expo-constants";
import { Platform } from "react-native";

export function googleNativeAvailability(): string | null {
  if (Platform.OS === "web") return "O acesso Google está disponível no aplicativo Android/iOS configurado. Na prévia web, use seu e-mail e senha.";
  if (Constants.executionEnvironment === ExecutionEnvironment.StoreClient) return "O acesso Google precisa da versão instalada do aplicativo; ele não funciona no Expo Go.";
  if (Platform.OS === "ios" && !Constants.expoConfig?.extra?.googleIosClientId)
    return "O cliente Google para iOS ainda não foi configurado.";
  return null;
}

/** Only the signed ID token goes to our API. Google profile fields never grant access. */
export async function nativeGoogleToken(webClientId: string): Promise<string | null> {
  const unavailable = googleNativeAvailability();
  if (unavailable) throw Error(unavailable);
  if (!/^[A-Za-z0-9_-]+\.apps\.googleusercontent\.com$/.test(webClientId))
    throw Error("O acesso Google ainda não foi configurado no servidor.");
  // Defer the native module until after the Expo Go/web checks, so those modes keep working.
  const sdk = await import("@react-native-google-signin/google-signin");
  try {
    sdk.GoogleSignin.configure({
      webClientId,
      offlineAccess: false,
      ...(Platform.OS === "ios" ? { iosClientId: Constants.expoConfig?.extra?.googleIosClientId } : {}),
    });
    if (Platform.OS === "android") await sdk.GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const result = await sdk.GoogleSignin.signIn();
    if (!sdk.isSuccessResponse(result)) return null;
    if (!result.data.idToken) throw Error("NO_ID_TOKEN");
    return result.data.idToken;
  } catch (error) {
    if (sdk.isErrorWithCode(error) && error.code === sdk.statusCodes.SIGN_IN_CANCELLED) return null;
    if (sdk.isErrorWithCode(error) && error.code === sdk.statusCodes.PLAY_SERVICES_NOT_AVAILABLE)
      throw Error("Atualize o Google Play Services para usar este método de acesso.");
    throw Error("Não foi possível concluir o acesso Google. Verifique a conexão e a configuração do aplicativo e tente novamente.");
  }
}
