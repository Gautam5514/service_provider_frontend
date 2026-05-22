export default function manifest() {
  return {
    name:             "EliteCrew — Home Services",
    short_name:       "EliteCrew",
    description:      "Book verified AC, electrical & appliance experts at your doorstep. Pay after service.",
    start_url:        "/",
    display:          "standalone",
    background_color: "#ffffff",
    theme_color:      "#000000",
    orientation:      "portrait-primary",
    categories:       ["utilities", "lifestyle"],
    icons: [
      { src: "/icon.png",       sizes: "512x512", type: "image/png", purpose: "any maskable" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png", purpose: "apple touch icon" },
    ],
    screenshots: [],
    shortcuts: [
      {
        name:       "Book AC Service",
        short_name: "AC Repair",
        url:        "/services/ac",
        icons:      [{ src: "/icon.png", sizes: "96x96" }],
      },
      {
        name:       "My Bookings",
        short_name: "Bookings",
        url:        "/bookings",
        icons:      [{ src: "/icon.png", sizes: "96x96" }],
      },
    ],
  };
}
