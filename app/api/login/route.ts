import { NextResponse } from "next/server";
import { USER_CREDENTIALS } from "@/data/user-credentials";

export async function POST(request: Request) {
  const { usuario, contrasena } = await request.json();
  const user = USER_CREDENTIALS.find(
    (u) => u.usuario === usuario && u.contrasena === contrasena
  );
  if (!user) {
    return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });
  }
  // No enviar la contraseña en la respuesta
  const { contrasena: _, ...userData } = user;
  return NextResponse.json(userData);
} 