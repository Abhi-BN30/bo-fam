"use client";

import { useEffect,useState } from "react";

export default function InstallButton(){

const [prompt,setPrompt]=useState<any>(null);

useEffect(()=>{

const handler=(e:any)=>{

e.preventDefault();

setPrompt(e);

};

window.addEventListener("beforeinstallprompt",handler);

return ()=>window.removeEventListener("beforeinstallprompt",handler);

},[]);

if(!prompt) return null;

return(

<button

onClick={async()=>{

prompt.prompt();

await prompt.userChoice;

setPrompt(null);

}}

className="fixed bottom-6 right-6 z-50 rounded-full bg-indigo-600 px-6 py-3 text-white shadow-xl"

>

Install App

</button>

);

}