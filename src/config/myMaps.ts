/*
 * The Google My Maps map of the service area ("Werkgebied Autosleutel24"), built from
 * seo/google-my-maps-cities.csv: 62 cities in Utrecht, Noord-Holland, Zuid-Holland,
 * Gelderland and Flevoland, coloured by province.
 *
 * One ID, used three ways:
 *  - the interactive embed behind the tap-to-load facade (InstantServiceMap),
 *  - `hasMap` on the business node in the structured data, so the map the page shows and
 *    the map the markup names are the same one,
 *  - the map line in /llms.txt.
 *
 * To change the map, change it in Google My Maps and, only if it is a new map, this ID.
 * The map must stay shared as "Anyone with the link can view".
 */
export const MY_MAPS_ID = '1Le9pOFisnp1C6SqZIEPZRyLerGrp040';

export const MY_MAPS_EMBED_URL = `https://www.google.com/maps/d/embed?mid=${MY_MAPS_ID}&ehbc=2E312F`;
export const MY_MAPS_VIEWER_URL = `https://www.google.com/maps/d/viewer?mid=${MY_MAPS_ID}`;
