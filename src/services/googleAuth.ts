import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User, signOut } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

export const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive.file'
];

const provider = new GoogleAuthProvider();
SCOPES.forEach((scope) => provider.addScope(scope));
provider.setCustomParameters({
  prompt: 'select_account'
});

const TOKEN_KEY = 'google_sheets_access_token';
const USER_KEY = 'google_sheets_user_info';
const TOKEN_TIME_KEY = 'google_sheets_token_timestamp';

let isSigningIn = false;
let cachedAccessToken: string | null = localStorage.getItem(TOKEN_KEY) || null;

export interface StoredUserInfo {
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  uid: string;
}

export const getStoredUserInfo = (): StoredUserInfo | null => {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const initAuth = (
  onAuthSuccess?: (user: User | StoredUserInfo, token: string) => void,
  onAuthFailure?: () => void
) => {
  // Check if we have token and user in storage on initial load
  const storedToken = localStorage.getItem(TOKEN_KEY);
  const storedUser = getStoredUserInfo();

  if (storedToken && storedUser) {
    cachedAccessToken = storedToken;
    if (onAuthSuccess) {
      onAuthSuccess(storedUser, storedToken);
    }
  }

  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      const token = cachedAccessToken || localStorage.getItem(TOKEN_KEY);
      const userInfo: StoredUserInfo = {
        displayName: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
        uid: user.uid
      };
      localStorage.setItem(USER_KEY, JSON.stringify(userInfo));

      if (token) {
        cachedAccessToken = token;
        if (onAuthSuccess) onAuthSuccess(user, token);
      } else if (!isSigningIn) {
        if (onAuthSuccess) onAuthSuccess(user, '');
      }
    } else {
      const token = localStorage.getItem(TOKEN_KEY);
      const sUser = getStoredUserInfo();
      if (!token || !sUser) {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    }
  });
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Falha ao obter token de acesso Google.');
    }

    cachedAccessToken = credential.accessToken;
    localStorage.setItem(TOKEN_KEY, credential.accessToken);
    localStorage.setItem(TOKEN_TIME_KEY, Date.now().toString());

    const userInfo: StoredUserInfo = {
      displayName: result.user.displayName,
      email: result.user.email,
      photoURL: result.user.photoURL,
      uid: result.user.uid
    };
    localStorage.setItem(USER_KEY, JSON.stringify(userInfo));

    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Google Sign In Error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken || localStorage.getItem(TOKEN_KEY) || null;
};

export const clearGoogleSession = () => {
  cachedAccessToken = null;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(TOKEN_TIME_KEY);
};

export const googleLogout = async () => {
  try {
    await signOut(auth);
  } catch (e) {
    console.warn('Sign out warning:', e);
  }
  clearGoogleSession();
};
