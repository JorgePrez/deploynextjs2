import { AVATARS, VOICES } from "@/app/lib/constants";
import "@/styles/globals.css";

import {
  Configuration,
  NewSessionData,
  StreamingAvatarApi,
} from "@heygen/streaming-avatar";
import {
  Button,
  Card,
  CardBody,
  CardFooter,
  Divider,
  Input,
  Select,
  SelectItem,
  Spinner,
  Tooltip,
} from "@nextui-org/react";
import { Microphone, MicrophoneStage } from "@phosphor-icons/react";
import { useChat } from "ai/react";
import clsx from "clsx";
import OpenAI from "openai";
import { useEffect, useRef, useState } from "react";
import InteractiveAvatarTextInput from "./InteractiveAvatarTextInput";

const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});

export default function InteractiveAvatar() {
  const [isLoadingSession, setIsLoadingSession] = useState(false);
  const [isLoadingRepeat, setIsLoadingRepeat] = useState(false);
  const [isLoadingChat, setIsLoadingChat] = useState(false);
  const [stream, setStream] = useState<MediaStream>();
  const [debug, setDebug] = useState<string>();
  const [avatarId, setAvatarId] = useState<string>("");
  const [voiceId, setVoiceId] = useState<string>("");
  const [data, setData] = useState<NewSessionData>();
  const [text, setText] = useState<string>("");
  const [initialized, setInitialized] = useState(false); // Track initialization
  const [recording, setRecording] = useState(false); // Track recording state
  const mediaStream = useRef<HTMLVideoElement>(null);
  const avatar = useRef<StreamingAvatarApi | null>(null);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const handleSubmitRef = useRef<() => void>(() => {}); // Referencia para handleSubmit



 /* function handleSubmit() {
    if (input.trim() === "") {
      return;
    }
    onSubmit();
    setInput("");
  }*/

  const { input, setInput, handleSubmit } = useChat({
    onFinish: async (message) => {
      console.log("ChatGPT Response:", message);

      if (!initialized || !avatar.current) {
        setDebug("Avatar API not initialized");
        return;
      }

      //send the ChatGPT response to the Interactive Avatar
      await avatar.current
        .speak({
          taskRequest: { text: message.content, sessionId: data?.sessionId },
        })
        .catch((e) => {
          setDebug(e.message);
        });
      setIsLoadingChat(false);
    },
    initialMessages: [
      {
        id: "1",
        role: "system",
        content: "Eres Henry Hazlitt. Vas a ser un tutor y vas a responder preguntas sobre economía a los estudiantes, únicamente responderás en base a tus libros. Si te preguntan algo fuera de esos temas responde amablemente que solo respondes en el contexto de tus escritos. Por favor da una respuesta breve, eres un chatbot con un avatar por lo que tu respuesta no puede durar más de 1 minuto, responde de forma amable siempre",
      },
    ],
  });


  function onSubmit() {
    // Your submit logic here
    console.log('Submitted:', input);

    setIsLoadingChat(true);
      if (!input) {
        //setDebug("Please enter text to send to ChatGPT");
        setDebug("Debes ingresar texto");
        return;
      }
      handleSubmit();
    
  }

  


  async function fetchAccessToken() {
    try {
      const response = await fetch("/api/get-access-token", {
        method: "POST",
      });
      const token = await response.text();
      console.log("Access Token:", token); // Log the token to verify
      return token;
    } catch (error) {
      console.error("Error fetching access token:", error);
      return "";
    }
  }

  async function startSession() {
    setIsLoadingSession(true);
    await updateToken();
    if (!avatar.current) {
      setDebug("Avatar API is not initialized");
      return;
    }

    //001cc6d54eae4ca2b5fb16ca8e8eb9bb
    //Anterior 7e56728c6b9a4469b3d1367a3464f2ad
    try {
      const res = await avatar.current.createStartAvatar(
        {
          newSessionRequest: {
            quality: "low",
            avatarName: "josh_lite3_20230714",
            voice: { voiceId: '001cc6d54eae4ca2b5fb16ca8e8eb9bb' },
          },
        },
        setDebug
      );
      console.log(res);
      
      setData(res);
      setStream(avatar.current.mediaStream);
     // handleSpeak();

     

    } catch (error) {
      console.error("Error starting avatar session:", error);
      console.log(error)
      
     /* setDebug(
        `There was an error starting the session. ${"7e56728c6b9a4469b3d1367a3464f2ad" ? "This custom voice ID may not be supported." : ""}`
      );*/

      setDebug(
        `${error}`
      );
    }
    setIsLoadingSession(false);
  }

  async function updateToken() {
    const newToken = await fetchAccessToken();
    console.log("Updating Access Token:", newToken); // Log token for debugging
    avatar.current = new StreamingAvatarApi(
      new Configuration({ accessToken: newToken })
    );

    const startTalkCallback = (e: any) => {
      console.log("Avatar started talking", e);
    };

    const stopTalkCallback = (e: any) => {
      console.log("Avatar stopped talking", e);
    };

    console.log("Adding event handlers:", avatar.current);
    avatar.current.addEventHandler("avatar_start_talking", startTalkCallback);
    avatar.current.addEventHandler("avatar_stop_talking", stopTalkCallback);

    setInitialized(true);
  }

  async function handleInterrupt() {
    if (!initialized || !avatar.current) {
      setDebug("Avatar API not initialized");
      return;
    }
    await avatar.current
      .interrupt({ interruptRequest: { sessionId: data?.sessionId } })
      .catch((e) => {
        setDebug(e.message);
      });
  }

  async function endSession() {
    if (!initialized || !avatar.current) {
      setDebug("Avatar API not initialized");
      return;
    }
    await avatar.current.stopAvatar(
      { stopSessionRequest: { sessionId: data?.sessionId } },
      setDebug
    );
    setStream(undefined);
  }

  async function handleSpeak() {
   // setIsLoadingRepeat(true);
    if (!initialized || !avatar.current) {
      setDebug("Avatar API not initialized");
      return;
    }
    await avatar.current
      .speak({ taskRequest: { text: 'Hola soy Henry Hazlitt. A lo largo de nuestra interacción, responderé tus preguntas y compartiré conocimientos basados en las obras y escritos, que he publicado a lo largo de mi carrera.  Así que puedes realizarme cualquier pregunta sobre economía.', sessionId: data?.sessionId } })
      .catch((e) => {
        setDebug(e.message);
      });
    //setIsLoadingRepeat(false);
  }

  useEffect(() => {
    async function init() {
      const newToken = await fetchAccessToken();
      console.log("Initializing with Access Token:", newToken); // Log token for debugging
      avatar.current = new StreamingAvatarApi(
        new Configuration({ accessToken: newToken, jitterBuffer: 20000 })
      );
      setInitialized(true); // Set initialized to true
    }
    init();

    return () => {
      endSession();
    };
  }, []);

  useEffect(() => {
    if (stream && mediaStream.current) {
      mediaStream.current.srcObject = stream;
      mediaStream.current.onloadedmetadata = () => {
        mediaStream.current!.play();
        setDebug("Playing");
        handleSpeak();
      };
    }
  }, [mediaStream, stream]);

  function startRecording() {
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        mediaRecorder.current = new MediaRecorder(stream);
        mediaRecorder.current.ondataavailable = (event) => {
          audioChunks.current.push(event.data);
        };
        mediaRecorder.current.onstop = () => {
          const audioBlob = new Blob(audioChunks.current, {
            type: "audio/wav",
          });
          audioChunks.current = [];
          transcribeAudio(audioBlob);



         // await timeout(5000); //for 5 sec delay


          /*console.log("entrando");
    
    
          // Notar que en ese momento el texto se encuentra vacio
          setIsLoadingChat(true);
              if (!input) {
                setDebug("Debes ingresar texto");
                console.log("Vacio");
                setIsLoadingChat(false);
                return;
              }
          console.log(input);
          handleSubmit(); // Realizar el submit al detener la grabación
          console.log("saliendo");*/
    


          /*console.log("entrando");


          // Notar que en ese momento el texto se encuentra vacio
          setIsLoadingChat(true);
              if (!input) {
                setDebug("Debes ingresar texto");
                console.log("Vacio");
                setIsLoadingChat(false);
                return;
              }
          console.log(input);
          handleSubmit(); // Realizar el submit al detener la grabación
          console.log("saliendo");*/


        };
        // 1000
        //        mediaRecorder.current.start();
        mediaRecorder.current.start(1000);
        setRecording(true);
      })
      .catch((error) => {
        console.error("Error accessing microphone:", error);
      });
  }



/*
async function stopRecording() {
    if (mediaRecorder.current) {
      mediaRecorder.current.stop();
      setRecording(false);


      await timeout(5000); //for 5 sec delay


      console.log("entrando");


      // Notar que en ese momento el texto se encuentra vacio
      setIsLoadingChat(true);
          if (!input) {
            setDebug("Debes ingresar texto");
            console.log("Vacio");
            setIsLoadingChat(false);
            return;
          }
      console.log(input);
      handleSubmit(); // Realizar el submit al detener la grabación
      console.log("saliendo");

    }
  }

*/
   function stopRecording2() {
    if (mediaRecorder.current) {
      mediaRecorder.current.stop();
      setRecording(false);


     // onSubmit();


/*
      console.log("entrando");


      // Notar que en ese momento el texto se encuentra vacio
      setIsLoadingChat(true);
          if (!input) {
            setDebug("Debes ingresar texto");
            console.log("Vacio");
            setIsLoadingChat(false);
            return;
          }
      console.log(input);
      handleSubmit(); // Realizar el submit al detener la grabación
      console.log("saliendo");*/



    }
  }

  function stopRecording() {
    if (mediaRecorder.current) {
      mediaRecorder.current.stop();
      setRecording(false);
      
      // Agregamos un pequeño retraso para asegurar que la transcripción se haya completado
      setTimeout(() => {
        if (input.trim() !== "") {
          onSubmit();
        }
        else{
          console.log("no hay nada");
        }
      }, 3000); // 1 segundo de retraso

    

      

    }
  }

  async function transcribeAudio(audioBlob: Blob) {
    try {
      // Convert Blob to File
      const audioFile = new File([audioBlob], "recording.wav", {
        type: "audio/wav",
      });
      const response = await openai.audio.transcriptions.create({
        model: "whisper-1",
        file: audioFile,
        language: "es" // "en"
      });
      const transcription = response.text;
      console.log("Transcription: ", transcription);
      setInput(transcription);
      //onSubmit(); // Llamar a onSubmit inmediatamente después de establecer el input
      //await timeout(5000);
    } catch (error) {
      console.error("Error transcribing audio:", error);
    }
  }



 


  return (
    <div className="w-full flex flex-col gap-4">
      <Card>
        <CardBody className="h-[500px] flex flex-col justify-center items-center">
          {stream ? (
            <div className="h-[500px] w-[900px] justify-center items-center flex rounded-lg overflow-hidden">
              <video
                ref={mediaStream}
                autoPlay
                playsInline
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                }}
              >
                <track kind="captions" />
              </video>
              <div className="flex flex-col gap-2 absolute bottom-3 right-3">
                <Button
                  size="md"
                  onClick={handleInterrupt}
                  className="bg-gradient-to-tr from-indigo-500 to-indigo-300 text-white rounded-lg"
                  variant="shadow"
                >
                  Detener respuesta
                </Button>
                <Button
                  size="md"
                  onClick={endSession}
                  className="bg-gradient-to-tr from-indigo-500 to-indigo-300  text-white rounded-lg"
                  variant="shadow"
                >
                  Finalizar conversación / Reiniciar
                </Button>
              </div>
            </div>
          ) : !isLoadingSession ? (
            <div className="h-full justify-center items-center flex flex-col gap-8 w-[500px] self-center">
            
              <Button
                size="md"
                onClick={startSession}
                className="bg-gradient-to-tr from-indigo-500 to-indigo-300 w-full text-white"
                variant="shadow"
              >
                Empezar conversación
              </Button>
            </div>
          ) : (
            <Spinner size="lg" color="default" />
          )}
        </CardBody>
        <Divider />

  {/* This is how you write single line comments inside JSX */}
  <CardFooter className="flex flex-col gap-3"  hidden={true}>
     { /*
          <InteractiveAvatarTextInput
            label="Repeat"
            placeholder="Type something for the avatar to repeat"
            input={text}
            onSubmit={handleSpeak}
            setInput={setText}
            disabled={!stream}
            loading={isLoadingRepeat}
          />
         */ }
          <InteractiveAvatarTextInput
            label="Chat"
            placeholder="Pregúntale a Henry Hazlitt"
            input={input}
            onSubmit={onSubmit}
            setInput={setInput}
            handleSubmit={handleSubmit}
            loading={isLoadingChat}
            endContent={
              <Tooltip
                content={!recording ? "Start recording" : "Stop recording"}
              >
                <Button
                  onClick={!recording ? startRecording : stopRecording}
                  isDisabled={!stream}
                  isIconOnly
                  className={clsx(
                    "mr-4 text-white",
                    !recording
                      ? "bg-gradient-to-tr from-indigo-500 to-indigo-300"
                      : ""
                  )}
                  size="sm"
                  variant="shadow"
                >
                  {!recording ? (
                    <Microphone size={20} />
                  ) : (
                    <>
                      <div className="absolute h-full w-full bg-gradient-to-tr from-indigo-500 to-indigo-300 animate-pulse -z-10"></div>
                      <MicrophoneStage size={20} />
                    </>
                  )}
                </Button>
              </Tooltip>
            }
            disabled={!stream}
          />
        </CardFooter>
      </Card>
      <p className="console font-mono">
        <span className="font-bold">Console:</span>
        <br />
        {debug}
      </p>
    </div>
  );
}
