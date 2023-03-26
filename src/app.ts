import * as dotenv from "dotenv";

import cors from "cors";
import { randomUUID } from "node:crypto";
import express, { Request, Response } from "express";
import { z } from "zod";
import { db } from "./database/database";
import { User } from "./models/user-model";

dotenv.config();

const PORT = Number(process.env.PORT) ?? 3000;

const app = express();
app.use(express.json());
app.use(cors());

app.get("/users", (req: Request, res: Response) => {
  // converte o Set para um Array
  const users = [...db];

  // retorna o array de usuários com status 200
  return res.status(200).json(users);
});

app.get("/users/:id", (req: Request, res: Response) => {
  const userId = req.params.id;

  // validar se o id foi passado na requisição
  if (!userId)
    return res
      .status(400)
      .json({ code: "Bad Request", error: "Está faltando o id" });

  let userFound: User | null = null;

  // checar se existe um usuário com o mesmo id que a requisição, e se tiver atribuir a variável userFound
  for (const user of db) {
    if (user.id === userId) userFound = user;
  }

  // se não encontrar o usuário, retornar 404
  if (!userFound) return res.status(404).end("User Not Found");

  // retornar o usuário encontrado com status 200, se tudo der certo
  return res.status(200).json(userFound);
});

app.post("/users", (req: Request, res: Response) => {
  // schema para validar o corpo da requisição
  const createUserSchema = z.object({
    name: z.string().min(6),
    email: z.string().email().trim().toLowerCase(),
  });

  // validar o corpo da requisição
  const parsedData = createUserSchema.safeParse(req.body);

  // se não passar na validação, retornar 400 e os erros
  if (!parsedData.success)
    return res.status(400).json({ errors: parsedData.error.issues });

  const { email, name } = parsedData.data;

  // checar se existe um usuário com o mesmo email que a requisição, e se tiver retornar 409
  for (const user of db) {
    if (user.email === email)
      return res
        .status(409)
        .json({ code: "Conflict", message: "O usuário já existe" });
  }

  // criar um novo usuário e adicionar no banco de dados
  const newUser: User = {
    id: randomUUID(),
    email,
    name,
  };

  db.add(newUser);

  // retornar o usuário criado com status 201, se tudo der certo
  return res.status(201).json(newUser);
});

app.delete("/users/:id", (req: Request, res: Response) => {
  const userId = req.params.id;

  // validar se o id foi passado na requisição
  if (!userId)
    return res
      .status(400)
      .json({ code: "Bad Request", error: "Está faltando o id" });

  let userFound: User | null = null;

  // checar se existe um usuário com o mesmo id que a requisição, e se tiver deletar
  for (const user of db) {
    if (user.id === userId) userFound = user;
  }

  // se não encontrar o usuário, retornar 404
  if (!userFound) return res.status(404).end("User Not Found");

  // deletar o usuário e retornar o usuário deletado com status 200, se tudo der certo
  db.delete(userFound);
  return res.status(200).json(userFound);
});

app.put("/users/:id", (req: Request, res: Response) => {
  const userId = req.params.id;

  // schema para validar o corpo da requisição
  const updateUserSchema = z.object({
    name: z.string().min(6),
    email: z.string().email(),
  });

  const parsedData = updateUserSchema.safeParse(req.body);

  // validar o corpo da requisição
  if (!parsedData.success)
    return res.status(400).json({ errors: parsedData.error.issues });

  // validar se o id foi passado na requisição
  if (!userId)
    return res
      .status(400)
      .json({ code: "Bad Request", error: "Está faltando o id" });

  let userUpdated: User | null = null;

  // checar se existe um usuário com o mesmo email que a requisição
  for (const { email } of db) {
    if (email === parsedData.data.email)
      return res.status(409).json({
        code: "Conflict",
        message: "Já existe um usuário com esse email",
      });
  }

  // checar se existe um usuário com o mesmo id que a requisição e atualizar
  for (const user of db) {
    if (user.id === userId) {
      user.email = parsedData.data.email;
      user.name = parsedData.data.name;
      userUpdated = user;
    }
  }

  // se não encontrar o usuário, retornar 404
  if (!userUpdated) return res.status(404).end("User Not Found");

  // retornar o usuário atualizado com status 200, se tudo der certo
  return res.status(200).json(userUpdated);
});

app.patch("/users/:id", (req: Request, res: Response) => {
  const userId = req.params.id;

  // schema para validar o corpo da requisição
  const updateUserSchema = z.object({
    email: z.string().email(),
  });

  // validar o corpo da requisição
  const parsedData = updateUserSchema.safeParse(req.body);

  // se não passar na validação, retornar 400 e os erros
  if (!parsedData.success)
    return res
      .status(400)
      .json({ code: "Bad Request", errors: parsedData.error.issues });

  // validar se o id foi passado na requisição
  if (!userId)
    return res
      .status(400)
      .json({ code: "Bad Request", error: "Está faltando o id" });

  let userUpdated: User | null = null;

  // checar se existe um usuário com o mesmo email que a requisição, e se tiver retornar 409
  for (const { email } of db) {
    if (email === parsedData.data.email)
      return res.status(409).json({
        code: "Conflict",
        message: "Já existe um usuário com esse email",
      });
  }

  // checar se existe um usuário com o mesmo id que a requisição e atualizar
  for (const user of db) {
    if (user.id === userId) {
      user.email = parsedData.data.email;
      userUpdated = user;
    }
  }

  // se não encontrar o usuário, retornar 404
  if (!userUpdated)
    return res
      .status(404)
      .json({ code: "Not Found", message: "Usuário não encontrado" });

  // retornar o usuário atualizado com status 200, se tudo der certo
  return res.status(200).json(userUpdated);
});

app.listen(PORT, () =>
  console.log(`server running on http://localhost:${PORT}`)
);
