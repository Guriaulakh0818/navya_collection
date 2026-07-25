declare module '@clerk/nextjs' {
  import React from 'react';

  export interface ClerkProviderProps {
    children: React.ReactNode;
    publishableKey?: string;
  }

  export const ClerkProvider: React.ComponentType<ClerkProviderProps>;

  export interface SignInFactor {
    strategy: string;
    phoneNumberId?: string;
    emailAddressId?: string;
  }

  export interface SignInAttempt {
    status: string;
    createdSessionId: string | null;
    supportedFirstFactors?: SignInFactor[];
    create: (params: { identifier: string }) => Promise<SignInAttempt>;
    prepareFirstFactor: (params: { strategy: string; phoneNumberId?: string }) => Promise<any>;
    attemptFirstFactor: (params: { strategy: string; code: string }) => Promise<SignInAttempt>;
  }

  export interface SignUpAttempt {
    status: string;
    createdSessionId: string | null;
    create: (params: { phoneNumber: string }) => Promise<SignUpAttempt>;
    preparePhoneNumberVerification: (params: { strategy: string }) => Promise<any>;
    attemptPhoneNumberVerification: (params: { code: string }) => Promise<SignUpAttempt>;
  }

  export function useSignIn(): {
    isLoaded: boolean;
    signIn: SignInAttempt;
    setActive: (params: { session: string | null }) => Promise<void>;
  };

  export function useSignUp(): {
    isLoaded: boolean;
    signUp: SignUpAttempt;
    setActive: (params: { session: string | null }) => Promise<void>;
  };

  export function useClerk(): {
    signOut: (options?: { redirectUrl?: string }) => Promise<void>;
  };

  export function useAuth(): {
    isLoaded: boolean;
    isSignedIn: boolean;
    userId: string | null;
    signOut: (options?: { redirectUrl?: string }) => Promise<void>;
  };
}

declare module '@clerk/nextjs/server' {
  import { NextRequest, NextResponse } from 'next/server';

  export interface AuthObject {
    userId: string | null;
    sessionId: string | null;
    getToken: () => Promise<string | null>;
    protect: () => void;
    redirectToSignIn: () => any;
  }

  export function auth(): AuthObject;

  export function currentUser(): Promise<{
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    emailAddresses: Array<{ emailAddress: string }>;
    phoneNumbers?: Array<{ phoneNumber: string }>;
    imageUrl?: string | null;
    publicMetadata: Record<string, any>;
  } | null>;

  export function clerkMiddleware(
    handler?: (
      auth: () => AuthObject,
      req: NextRequest,
    ) => NextResponse | void | Promise<NextResponse | void>,
  ): (req: NextRequest) => Promise<NextResponse>;

  export function createRouteMatcher(patterns: string[]): (req: NextRequest) => boolean;
}
