

"use client";

import "@/styles/globals.css";
import InteractiveAvatar from "@/components/InteractiveAvatar";
import InteractiveAvatarCode from "@/components/InteractiveAvatarCode";
import { Tab, Tabs } from "@nextui-org/react";

export default function App() {
  const tabs = [
    {
      id: "demo",
      label: "",
      content: <InteractiveAvatar />,
    },

  ];

  return (
    <div className="container flex flex-col items-center justify-center mx-auto pt-4 pb-20">
    <div className="responsive-container flex flex-col items-start justify-start gap-5 w-full px-4">
      <div className="w-full">
        <InteractiveAvatar />
      </div>
    </div>
  </div>
  );
}
