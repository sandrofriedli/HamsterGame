// src/app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaClient } from "@prisma/client";
import { NextAuthOptions } from "next-auth";

const prisma = new PrismaClient();

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Email (dev)",
      credentials: {
        email: { label: "Email", type: "text" }
      },
      async authorize(credentials) {
        if (!credentials?.email) return null;
        const email = String(credentials.email).toLowerCase();

        // find or create user (dev flow)
        let user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
          user = await prisma.user.create({
            data: { email, name: email.split("@")[0] || email, isAdmin: false }
          });
        }
        // return object that will be stored in the session
        return { id: user.id, email: user.email, name: user.name, isAdmin: user.isAdmin };
      }
    })
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as any).id ?? token.id;
        token.isAdmin = (user as any).isAdmin ?? false;
      }
      return token;
    },
    async session({ session, token }) {
      (session as any).user = {
        id: token.id,
        email: token.email,
        name: token.name,
        isAdmin: token.isAdmin ?? false
      };
      return session;
    }
  },
  secret: process.env.NEXTAUTH_SECRET ?? process.env.SESSION_SECRET ?? "dev-secret"
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
