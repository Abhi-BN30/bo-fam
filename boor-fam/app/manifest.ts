import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "The Boorlagadda's",
    short_name: "BoorFam",
    description: "The Boorlagadda Family Tree",

    start_url: "/",

    scope: "/",

    display: "standalone",

    orientation: "portrait",

    background_color: "#EEF2FF",

    theme_color: "#4338CA",

    categories: ["social","family"],

    lang: "en",

    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable"
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable"
      }
    ],

    shortcuts: [
      {
        name: "Family Tree",
        short_name: "Tree",
        url: "/",
        icons: [{ src: "/icon-192.png", sizes: "192x192" }]
      },
      {
        name: "User Directory",
        short_name: "Directory",
        url: "/directory",
        icons: [{ src: "/icon-192.png", sizes: "192x192" }]
      },
      {
        name: "Profile",
        short_name: "Profile",
        url: "/profile",
        icons: [{ src: "/icon-192.png", sizes: "192x192" }]
      }
    ]
  };
}