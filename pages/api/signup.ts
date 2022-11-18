import { db } from "@/libs/firebase-admin";
import moment from "moment";
import { createUserWithEmailAndPassword, getAuth } from "firebase/auth";
import type { NextApiRequest, NextApiResponse } from "next";
import { User } from "@/interfaces/User";
import { initializeFirebase } from "@/libs/firebase-client";

const app = initializeFirebase();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<any>
) {
  try {
    if (req.method != "POST") {
      return res
        .status(400)
        .json({ error: { message: "It should be POST method." } });
    }

    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: { message: "Email and password are invalid." },
      });
    }

    const credential = await createUserWithEmailAndPassword(
      getAuth(app),
      email,
      password
    );
    const accessToken = await credential.user.getIdToken();
    const refreshToken = credential.user.refreshToken;

    const user: User = {
      email,
      createdAt: moment().format("YYYY-MM-DD HH:mm:ss"),
    };

    await db.collection("users").doc(credential.user.uid).set(user);

    return res.json({ accessToken, refreshToken });
  } catch (err: any) {
    console.log(err);
    const { code } = err;
    if (code === "auth/email-already-in-use") {
      res.status(400);
    } else {
      res.status(500);
    }
    res.json({
      error: {
        message: code ? code.replace("auth/", "") : "Unknown error occured.",
      },
    });
  }
}
