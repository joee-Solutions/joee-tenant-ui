// Optional per-country/state city overrides or extensions.
// Key format: `${countryCode}-${stateCode}` using ISO codes from country-state-city.
// This lets us add more complete city lists when the library's data is limited.

export const cityOverrides: Record<string, string[]> = {
  // Nigeria – Lagos State
  "NG-LA": [
    "Agege",
    "Ajeromi-Ifelodun",
    "Alimosho",
    "Amuwo-Odofin",
    "Apapa",
    "Badagry",
    "Epe",
    "Eti-Osa",
    "Ibeju-Lekki",
    "Ifako-Ijaiye",
    "Ikeja",
    "Ikorodu",
    "Kosofe",
    "Lagos Island",
    "Lagos Mainland",
    "Mushin",
    "Ojo",
    "Oshodi-Isolo",
    "Shomolu",
    "Surulere",
  ],

  // Nigeria – Ogun State
  "NG-OG": [
    "Abeokuta",
    "Ado-Odo/Ota",
    "Ijebu Ode",
    "Ijebu Igbo",
    "Sagamu",
    "Ifo",
    "Ilaro",
    "Ago-Iwoye",
    "Owode",
    "Imeko",
    "Odogbolu",
    "Ota",
    "Obafemi-Owode",
    "Remo North",
  ],
};

