import Head from "next/head";
import Image from "next/image";
import { ErrorMessage, Field, Form, Formik } from "formik";
import { boolean, date, number, object, string } from "yup";
import axios from "axios";
import { deleteCookie, hasCookie, setCookie } from "cookies-next";
import { ChangeEvent, useEffect, useState } from "react";
import { useSocketContext } from "../contexts/SocketProvider";
import {
  DetectModerationLabelsCommand,
  RekognitionClient,
} from "@aws-sdk/client-rekognition";
import socketClient, { io, Socket } from "socket.io-client";

// let socket: Socket;

export default function Home() {
  const [isCensed, setIsCensed] = useState<boolean | undefined>();
  const [connectedUsers, setConnectedUsers] = useState(0);
  const [validatingImage, setValidatingImage] = useState(false);
  const [isImageValid, setIsImageValid] = useState<boolean | undefined>();

  const socket = useSocketContext();

  useEffect(() => {
    if (socket) {
      socket.on("userDisconnected", handleUserConnections);
      socket.on("userConnected", handleUserConnections);
    }

    setIsCensed(hasCookie("isCensed"));

    return () => {
      socket?.off("userConnected");
      socket?.off("userDisconnected");
    };
  }, []);

  const handleUserConnections = (connectedUsersTMP: number) => {
    setConnectedUsers(connectedUsersTMP);
  };

  const validateImage = async (image: File) => {
    let isValid = false;
    setValidatingImage(true);

    try {
      const ui8Image = new Uint8Array(await image.arrayBuffer());

      const faceRecognition = new RekognitionClient({
        region: "us-east-1",
        credentials: {
          accessKeyId: process.env.NEXT_PUBLIC_ACCESS_KEY_ID as string,
          secretAccessKey: process.env.NEXT_PUBLIC_SECRET_ACCESS_KEY as string,
        },
      });

      const response = await faceRecognition.send(
        new DetectModerationLabelsCommand({
          Image: {
            Bytes: ui8Image,
          },
        })
      );
      console.log(
        "🚀 ~ file: index.tsx ~ line 57 ~ validateImage ~ response",
        response
      );

      if (!response.ModerationLabels || response.ModerationLabels.length == 0) {
        isValid = true;
      }
    } catch (error) {
      console.log(
        "🚀 ~ file: index.tsx ~ line 37 ~ validateImage ~ error",
        error
      );
    }

    setValidatingImage(false);
    return isValid;
  };

  const handleImageChange = async (
    e: ChangeEvent<HTMLInputElement>,
    setFieldValue: (
      field: string,
      value: any,
      shouldValidate?: boolean | undefined
    ) => void
  ) => {
    let image: File;

    if (e.target.files) {
      image = e.target.files[0];
      const isValid = await validateImage(image);
      setIsImageValid(isValid);
      if (isValid) {
        return setFieldValue("picture", image);
      }
    }
    setFieldValue("picture", null);
  };

  return (
    <div>
      <Head>
        <title>Censo</title>
        <meta name="description" content="Generated by create next app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main>
        <h1>Registro de censo</h1>
        <p>Usuarios censándose {connectedUsers}</p>
        {isCensed == undefined ? (
          <div>cargando</div>
        ) : isCensed ? (
          <div>censado</div>
        ) : (
          <Formik
            initialValues={{
              people: 1,
              document: "",
              document_type: "id_card",
              name: "",
              last_name: "",
              birth_date: new Date(),
              gender: "m",
              civil_state: "single",
              nacionality: "dominican",
              picture: "",
              academic_level: "basic",
              employed: false,
            }}
            validationSchema={validationScheme}
            onSubmit={async (values) => {
              try {
                const { picture, ...data } = values;
                console.log(
                  "🚀 ~ file: index.tsx ~ line 140 ~ onSubmit={ ~ picture",
                  picture
                );

                const formData = new FormData();
                formData.append("files.picture", picture as any);
                formData.append("data", JSON.stringify(data));

                const response = await axios.post(
                  `${process.env.NEXT_PUBLIC_API_ROUTE}/censuses`,
                  formData
                );
                console.log(
                  "🚀 ~ file: index.tsx ~ line 43 ~ Home ~ response",
                  response
                );

                setCookie("isCensed", true);
                setIsCensed(true);
              } catch (error) {
                console.log(
                  "🚀 ~ file: index.tsx ~ line 35 ~ Home ~ error",
                  error
                );
              }
            }}
          >
            {({ setFieldValue, values }) => (
              <Form>
                <div className="form_group">
                  <label htmlFor="">cantidad de personas</label>
                  <Field name="people" />
                  <ErrorMessage name="people" />
                </div>
                <div className="form_group">
                  <label htmlFor="">tipo de documento de identidad</label>
                  <Field name="document_type" as="select">
                    <option value="id_card">Cédula</option>
                    <option value="passport">Pasaporte</option>
                  </Field>
                  <ErrorMessage name="passport" />
                </div>
                <div className="form_group">
                  <label htmlFor="">documento de identidad</label>
                  <Field name="document" />
                  <ErrorMessage name="document" />
                </div>
                <div className="form_group">
                  <label htmlFor="">nombre</label>
                  <Field name="name" />
                  <ErrorMessage name="name" />
                </div>
                <div className="form_group">
                  <label htmlFor="">apellido</label>
                  <Field name="last_name" />
                  <ErrorMessage name="last_name" />
                </div>
                <div className="form_group">
                  <label htmlFor="">fecha de nacimiento</label>
                  <Field name="birth_date" type="date" />
                  <ErrorMessage name="birth_date" />
                </div>
                <div className="form_group">
                  <label htmlFor="">sexo</label>
                  <Field name="gender" as="select">
                    <option value="m">Masculino</option>
                    <option value="f">Femenino</option>
                  </Field>
                  <ErrorMessage name="gender" />
                </div>
                <div className="form_group">
                  <label htmlFor="">estado civil</label>
                  <Field name="civil_state" as="select">
                    <option value="single">Soltero/a</option>
                    <option value="married">Casado/a</option>
                  </Field>
                  <ErrorMessage name="civil_state" />
                </div>
                <div className="form_group">
                  <label htmlFor="">nacionalidad</label>
                  <Field name="nacionality" as="select">
                    <option value="dominican">Dominicano/a</option>
                    <option value="foreign">Extranjero/a</option>
                  </Field>
                  <ErrorMessage name="nacionality" />
                </div>
                <div className="form_group">
                  <label htmlFor="">nivel académico</label>
                  <Field name="academic_level" as="select">
                    <option value="basic">Básico</option>
                    <option value="bachelor">Bachiller</option>
                    <option value="grade">Grado</option>
                  </Field>
                  <ErrorMessage name="academic_level" />
                </div>
                <div className="form_group">
                  <label htmlFor="">trabaja</label>
                  <Field name="employed" type="checkbox" />
                  <ErrorMessage name="employed" />
                </div>

                <div className="form_group">
                  <label htmlFor="">imagen</label>
                  <input
                    type="file"
                    name="picture"
                    onChange={(e) => handleImageChange(e, setFieldValue)}
                  />
                  {isImageValid == false && "imagen invalida"}
                  <ErrorMessage name="picture" />
                </div>

                <button type="submit">enviar</button>
              </Form>
            )}
          </Formik>
        )}
      </main>
    </div>
  );
}

const validationScheme = object({
  people: number().required(),
  document: string().required(),
  document_type: string().required(),
  name: string().required(),
  last_name: string().required(),
  picture: string().required(),
  birth_date: date().required(),
  gender: string().required(),
  civil_state: string().required(),
  nacionality: string().required(),
  academic_level: string().required(),
  employed: boolean().required(),
});
